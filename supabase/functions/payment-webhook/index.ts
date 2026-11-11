// Supabase Edge Function: payment-webhook
// Description: Cổng nhận Webhook thanh toán SePay / Ngân hàng bảo mật.
// Áp dụng quy chuẩn: supabase skill (Edge Functions Security, Service Role usage, Secrets Management).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Headers CORS tiêu chuẩn
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sepay-signature',
};

Deno.serve(async (req: Request) => {
  // 1. Xử lý Preflight CORS OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Xác thực Webhook Security Signature / Token
    const authHeader = req.headers.get('authorization') || req.headers.get('x-sepay-signature') || '';
    const secretKey = Deno.env.get('SEPAY_SECRET_KEY') || 'spsk_live_ardGMMETTMTVqW8sR5aFKtJyDVawHbmH';

    const cleanToken = authHeader.replace(/^(Bearer|Apikey)\s+/i, '').trim();
    if (cleanToken !== secretKey) {
      console.error(`[EdgeFn:payment-webhook] Unauthorized webhook call attempt. Received token: "${cleanToken}"`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid webhook secret token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Đọc và phân tích Payload
    const body = await req.json();
    console.log('[EdgeFn:payment-webhook] Received validated payload:', JSON.stringify(body));

    const transactionContent = body.transaction_content || body.transactionContent || body.content || body.description || '';
    const code = body.code || '';
    const amountIn = parseFloat(body.amount_in || body.amountIn || body.transferAmount) || 0;
    const referenceNumber = String(body.reference_number || body.referenceNumber || body.referenceCode || `SEPAY-${Date.now()}`);

    // 4. Khởi tạo Supabase Client với Service Role Key (Chỉ chạy trên Serverless Edge)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || 'placeholder_service_key';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // TRƯỜNG HỢP A: NẠP TIỀN VÀO VÍ NGƯỜI DÙNG (Cú pháp: ZMWALLET<buyerShortId>)
    // ========================================================================
    let walletShortId = '';
    const walletMatch = transactionContent.match(/ZMWALLET([a-zA-Z0-9]+)/i);
    if (walletMatch && walletMatch[1]) {
      walletShortId = walletMatch[1].toLowerCase();
    }

    if (walletShortId) {
      console.log(`[EdgeFn:payment-webhook] Processing deposit for user prefix: ${walletShortId}, amount: ${amountIn}đ`);

      // 4.1 Tra cứu ví của người dùng
      const { data: wallets, error: walletErr } = await supabase
        .schema('payment')
        .from('Wallet')
        .select('*')
        .ilike('buyerId', `${walletShortId}%`)
        .limit(1);

      if (walletErr || !wallets || wallets.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: `Wallet not found for prefix: ${walletShortId}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const wallet = wallets[0];

      // 4.2 Idempotency Check: Kiểm tra xem mã tham chiếu này đã được cộng tiền chưa
      const { data: existingTxs } = await supabase
        .schema('payment')
        .from('WalletTransaction')
        .select('id')
        .eq('walletId', wallet.id)
        .ilike('description', `%Ref: ${referenceNumber}%`)
        .limit(1);

      if (existingTxs && existingTxs.length > 0) {
        console.log(`[EdgeFn:payment-webhook] Idempotency: Deposit ${referenceNumber} already processed.`);
        return new Response(
          JSON.stringify({ success: true, message: 'Deposit already processed', idempotent: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 4.3 Thực hiện cộng số dư ví
      const newBalance = (wallet.balance || 0) + amountIn;
      await supabase
        .schema('payment')
        .from('Wallet')
        .update({ balance: newBalance, updatedAt: new Date().toISOString() })
        .eq('id', wallet.id);

      // 4.4 Ghi sổ giao dịch ví (Audit Ledger)
      await supabase
        .schema('payment')
        .from('WalletTransaction')
        .insert({
          walletId: wallet.id,
          amount: amountIn,
          type: 'DEPOSIT',
          status: 'SUCCESS',
          description: `Nạp tiền tự động qua SePay Edge Function (Ref: ${referenceNumber})`,
          createdAt: new Date().toISOString(),
        });

      return new Response(
        JSON.stringify({
          success: true,
          action: 'WALLET_DEPOSIT',
          walletId: wallet.id,
          creditedAmount: amountIn,
          newBalance: newBalance,
          referenceNumber,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // TRƯỜNG HỢP B: THANH TOÁN ĐƠN HÀNG (Cú pháp: ZM<orderShortId>)
    // ========================================================================
    let orderShortId = code ? code.replace(/^ZM/i, '') : '';
    if (!orderShortId && transactionContent) {
      const match = transactionContent.match(/ZM([a-zA-Z0-9]+)/i);
      if (match && match[1]) {
        orderShortId = match[1];
      }
    }

    if (orderShortId) {
      console.log(`[EdgeFn:payment-webhook] Processing order checkout for short ID: ${orderShortId}`);

      // Tra cứu đơn hàng
      const { data: orders, error: orderErr } = await supabase
        .schema('order')
        .from('Order')
        .select('*')
        .ilike('id', `${orderShortId}%`)
        .limit(1);

      if (orderErr || !orders || orders.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: `Order not found for code: ${orderShortId}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const order = orders[0];

      // Idempotency: Kiểm tra nếu đơn hàng đã được đánh dấu thanh toán
      if (order.paymentStatus === 'PAID') {
        return new Response(
          JSON.stringify({ success: true, message: 'Order already paid', idempotent: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cập nhật trạng thái đơn hàng thành PROCESSING và PAID
      await supabase
        .schema('order')
        .from('Order')
        .update({
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Cập nhật trạng thái giao dịch thanh toán
      await supabase
        .schema('payment')
        .from('Transaction')
        .update({
          status: 'SUCCESS',
          providerTxId: referenceNumber,
          updatedAt: new Date().toISOString(),
        })
        .eq('orderId', order.id);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'ORDER_CHECKOUT',
          orderId: order.id,
          paidAmount: amountIn,
          referenceNumber,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'No recognized transaction syntax in webhook content' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[EdgeFn:payment-webhook] Internal error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
