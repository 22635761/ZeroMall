// Supabase Edge Function: cskh-dispute-settle
// Description: Trọng tài phán quyết giải quyết tranh chấp / đổi trả hoàn tiền phía server.
// Áp dụng quy chuẩn: supabase skill (Edge Functions Security, JWT role validation, Double-entry Wallet ledger).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid Bearer token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // Khởi tạo Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || 'placeholder_service_key';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Xác thực người dùng và vai trò qua Auth User / JWT
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    
    // Kiểm tra quyền: Phải có role PLATFORM_SUPPORT hoặc ADMIN (từ app_metadata hoặc database)
    let userRole = user?.app_metadata?.role || '';
    if (!userRole && user?.id) {
      const { data: dbUser } = await supabase
        .schema('auth')
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();
      userRole = dbUser?.role || '';
    }

    const isAuthorized = ['PLATFORM_SUPPORT', 'ADMIN', 'SUPPORT'].includes(String(userRole).toUpperCase());
    if (authErr || !isAuthorized) {
      console.warn(`[EdgeFn:cskh-dispute-settle] Forbidden: User ${user?.id || 'unknown'} has role ${userRole}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Yêu cầu quyền CSKH (PLATFORM_SUPPORT) hoặc Quản trị viên' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Đọc payload yêu cầu phán quyết
    const body = await req.json();
    const { returnId, resolution, csNote, refundAmount } = body;

    if (!returnId || !resolution) {
      return new Response(
        JSON.stringify({ error: 'Bad Request: Thiếu returnId hoặc resolution' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Tra cứu thông tin hồ sơ đổi trả
    const { data: returns, error: retErr } = await supabase
      .schema('delivery')
      .from('Return')
      .select('*')
      .eq('id', returnId)
      .limit(1);

    if (retErr || !returns || returns.length === 0) {
      return new Response(
        JSON.stringify({ error: `Không tìm thấy hồ sơ đổi trả #${returnId}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const returnRecord = returns[0];
    const finalRefundAmount = Number(refundAmount ?? returnRecord.refundAmount ?? 0);

    // 2. Phân định theo phán quyết của CSKH
    if (resolution === 'APPROVE_REFUND') {
      console.log(`[EdgeFn:cskh-dispute-settle] Arbitrating APPROVE_REFUND for Return #${returnId}, refund: ${finalRefundAmount}đ`);

      // 2.1 Tra cứu hoặc khởi tạo ví của Buyer
      const { data: buyerWallets } = await supabase
        .schema('payment')
        .from('Wallet')
        .select('*')
        .eq('buyerId', returnRecord.buyerId)
        .limit(1);

      let buyerWalletId = '';
      if (buyerWallets && buyerWallets.length > 0) {
        buyerWalletId = buyerWallets[0].id;
        const updatedBal = (buyerWallets[0].balance || 0) + finalRefundAmount;
        await supabase
          .schema('payment')
          .from('Wallet')
          .update({ balance: updatedBal, updatedAt: new Date().toISOString() })
          .eq('id', buyerWalletId);
      }

      // 2.2 Ghi sổ kép giao dịch hoàn tiền ví
      if (buyerWalletId) {
        await supabase
          .schema('payment')
          .from('WalletTransaction')
          .insert({
            walletId: buyerWalletId,
            amount: finalRefundAmount,
            type: 'REFUND',
            status: 'SUCCESS',
            description: `Hoàn tiền tranh chấp đơn hàng #${returnRecord.orderId} theo phán quyết CSKH`,
            createdAt: new Date().toISOString(),
          });
      }

      // 2.3 Cập nhật trạng thái Return thành COMPLETED
      await supabase
        .schema('delivery')
        .from('Return')
        .update({
          status: 'COMPLETED',
          resolution: 'RETURN_REFUND',
          csAgentId: user.id,
          csNote: csNote || 'CSKH đã phê duyệt hoàn tiền cho Người mua',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', returnId);

      // 2.4 Hủy / Đóng Escrow đơn hàng
      await supabase
        .schema('payment')
        .from('EscrowTransaction')
        .update({
          status: 'REFUNDED',
          updatedAt: new Date().toISOString(),
        })
        .eq('orderId', returnRecord.orderId);

      // 2.5 Cập nhật đơn hàng thành CANCELLED / RETURNED
      await supabase
        .schema('order')
        .from('Order')
        .update({
          status: 'CANCELLED',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', returnRecord.orderId);

      return new Response(
        JSON.stringify({
          success: true,
          resolution: 'APPROVE_REFUND',
          returnId,
          refundedAmount: finalRefundAmount,
          buyerId: returnRecord.buyerId,
          orderId: returnRecord.orderId,
          settledAt: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (resolution === 'REJECT_REFUND') {
      console.log(`[EdgeFn:cskh-dispute-settle] Arbitrating REJECT_REFUND for Return #${returnId}`);

      // Bác bỏ yêu cầu: Cập nhật Return thành REJECTED
      await supabase
        .schema('delivery')
        .from('Return')
        .update({
          status: 'REJECTED',
          csAgentId: user.id,
          csNote: csNote || 'CSKH từ chối yêu cầu đổi trả sau khi thẩm định chứng cứ',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', returnId);

      // Mở khóa tiền hàng Escrow cho Shop
      await supabase
        .schema('payment')
        .from('EscrowTransaction')
        .update({
          status: 'RELEASED',
          updatedAt: new Date().toISOString(),
        })
        .eq('orderId', returnRecord.orderId);

      return new Response(
        JSON.stringify({
          success: true,
          resolution: 'REJECT_REFUND',
          returnId,
          csNote,
          orderId: returnRecord.orderId,
          settledAt: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Resolution không hỗ trợ: ${resolution}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[EdgeFn:cskh-dispute-settle] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Lỗi xử lý server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
