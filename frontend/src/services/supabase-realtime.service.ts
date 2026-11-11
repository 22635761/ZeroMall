import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase-storage.service';

export interface DriverGpsPing {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface DriverPresenceInfo {
  driverId: string;
  name: string;
  phone: string;
  hubId?: string;
  vehicleType: string;
  onlineAt: string;
}

/**
 * Service quản lý Supabase Realtime tập trung cho ZeroMall:
 * 1. Postgres Changes (Database events): Đơn hàng, Khiếu nại đổi trả, Trạng thái vận đơn.
 * 2. Broadcast Channels (In-Memory, Low-Latency): Tọa độ GPS tài xế theo thời gian thực (tránh nghẽn Write I/O DB).
 * 3. Presence Channels: Giám sát tài xế và nhân sự bưu cục đang online.
 */

// ============================================================================
// 1. POSTGRES CHANGES (DATABASE REALTIME)
// ============================================================================

/**
 * Lắng nghe thay đổi trạng thái đơn hàng (Dành cho Khách hàng & Người bán)
 */
export function subscribeOrderChanges(params: {
  buyerId?: string;
  shopId?: string;
  onChange: (payload: { eventType: string; new: any; old: any }) => void;
}): () => void {
  const channelName = `order-changes-${params.buyerId || params.shopId || 'all'}-${Date.now()}`;
  
  let filter: string | undefined;
  if (params.buyerId) {
    filter = `buyerId=eq.${params.buyerId}`;
  } else if (params.shopId) {
    filter = `shopId=eq.${params.shopId}`;
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'order',
        table: 'Order',
        filter: filter,
      },
      (payload: any) => {
        params.onChange({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Lắng nghe khiếu nại đổi trả và tranh chấp (Dành cho CSKH, Shop & Khách hàng)
 */
export function subscribeDisputeChanges(params: {
  returnId?: string;
  onChange: (payload: { eventType: string; new: any; old: any }) => void;
}): () => void {
  const channelName = `dispute-changes-${params.returnId || 'all'}-${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'delivery',
        table: 'Return',
        filter: params.returnId ? `id=eq.${params.returnId}` : undefined,
      },
      (payload: any) => {
        params.onChange({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Lắng nghe cập nhật hành trình vận đơn SPX
 */
export function subscribeShipmentChanges(params: {
  shipmentId?: string;
  onChange: (payload: { eventType: string; new: any; old: any }) => void;
}): () => void {
  const channelName = `shipment-changes-${params.shipmentId || 'all'}-${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'delivery',
        table: 'Shipment',
        filter: params.shipmentId ? `id=eq.${params.shipmentId}` : undefined,
      },
      (payload: any) => {
        params.onChange({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// 2. BROADCAST (IN-MEMORY REALTIME GPS FLEET)
// ============================================================================

let gpsBroadcastChannel: RealtimeChannel | null = null;

function getGpsBroadcastChannel(): RealtimeChannel {
  if (!gpsBroadcastChannel) {
    gpsBroadcastChannel = supabase.channel('fleet:gps', {
      config: {
        broadcast: { ack: false, self: false },
      },
    });
    gpsBroadcastChannel.subscribe();
  }
  return gpsBroadcastChannel;
}

/**
 * Tài xế phát xung tọa độ GPS trực tiếp lên kênh Realtime (Không ghi liên tục vào CSDL)
 */
export async function broadcastDriverGps(ping: DriverGpsPing): Promise<void> {
  const channel = getGpsBroadcastChannel();
  await channel.send({
    type: 'broadcast',
    event: 'driver_gps',
    payload: ping,
  });
}

/**
 * Tháp điều hành Logistics SPX lắng nghe luồng tọa độ toàn bộ đội xe
 */
export function subscribeFleetGps(onGps: (ping: DriverGpsPing) => void): () => void {
  const channelName = `fleet-gps-listener-${Date.now()}`;
  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    })
    .on('broadcast', { event: 'driver_gps' }, (event: any) => {
      if (event.payload) {
        onGps(event.payload as DriverGpsPing);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// 3. PRESENCE (GIÁM SÁT TRẠNG THÁI TRỰC TUYẾN TÀI XẾ)
// ============================================================================

/**
 * Tài xế điểm danh trực tuyến trên kênh Presence
 */
export function joinDriverPresence(info: DriverPresenceInfo): {
  untrack: () => void;
  channel: RealtimeChannel;
} {
  const channel = supabase.channel('fleet:presence');

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track(info);
    }
  });

  return {
    untrack: () => {
      channel.untrack();
      supabase.removeChannel(channel);
    },
    channel,
  };
}

/**
 * Quản lý bưu cục / Tháp điều hành theo dõi danh sách tài xế đang hoạt động
 */
export function subscribeActiveDriversPresence(
  onSync: (activeDrivers: DriverPresenceInfo[]) => void
): () => void {
  const channel = supabase.channel('fleet:presence');

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const drivers: DriverPresenceInfo[] = [];
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (p.driverId) {
            drivers.push(p as DriverPresenceInfo);
          }
        });
      });
      onSync(drivers);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
