import React from 'react'
import type { Shipment, StationTab, DockTruck, Hub, LinehaulTrip } from './types'
import { STATUS_CONFIG, timeAgo, extractLinehaulInfo, getPickupDriver, getDeliveryDriver } from './helpers'
import { returnService } from '../../../services/return.service'

interface HubParcelTableProps {
  stationTab: StationTab
  activeList: Shipment[]
  sortingList: Shipment[]
  destinationList: Shipment[]
  selectedShipmentIds: Set<string>
  selectedLastMileIds: Set<string>
  searchFilter: string
  setSearchFilter: (val: string) => void
  onRefresh: () => void
  currentHub: Hub | null
  currentUser: any
  hubs: Hub[]
  dockTrucks: DockTruck[]
  linehaulTrips: LinehaulTrip[]
  actionLoading: boolean
  onToggleSelectShipment: (id: string) => void
  onSelectAllSorting: () => void
  onToggleSelectLastMile: (id: string) => void
  onSelectAllLastMile: () => void
  onOpenDispatchBatch: () => void
  onOpenDispatchSingle: (s: Shipment) => void
  onOpenLastMileBatch: () => void
  onOpenLastMileSingle: (s: Shipment) => void
  onUnloadSingleShipmentFromDock: (truckId: string, shipmentId: string, truckNumber: string) => void
  onSelectRouteForSorting: (hub: Hub) => void
  onOpenReconciliation: (trip: LinehaulTrip) => void
  onUpdateStatus: (
    shipmentId: string,
    status: string,
    failureReason?: string,
    hubId?: string,
    note?: string
  ) => Promise<void>
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  )
}

const TAB_TITLES: Record<StationTab, string> = {
  INBOUND_PICKUP: '1. Nhận Từ Shipper',
  SORTING_LINEHAUL: '2. Phân Loại & Đóng Xe Tải',
  INBOUND_RECEIVING: '3. Tiếp Nhận Xe Tải Đến',
  DISPATCH_LASTMILE: '4. Chia Tuyến Giao',
}

export const HubParcelTable: React.FC<HubParcelTableProps> = ({
  stationTab,
  activeList,
  sortingList,
  destinationList,
  selectedShipmentIds,
  selectedLastMileIds,
  searchFilter,
  setSearchFilter,
  onRefresh,
  currentHub,
  currentUser,
  hubs,
  dockTrucks,
  linehaulTrips,
  actionLoading,
  onToggleSelectShipment,
  onSelectAllSorting,
  onToggleSelectLastMile,
  onSelectAllLastMile,
  onOpenDispatchBatch,
  onOpenDispatchSingle,
  onOpenLastMileBatch,
  onOpenLastMileSingle,
  onUnloadSingleShipmentFromDock,
  onSelectRouteForSorting,
  onOpenReconciliation,
  onUpdateStatus,
}) => {
  return (
    <>
      {/* Table Header with Batch Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
            📋 {TAB_TITLES[stationTab]}
          </h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md border border-slate-200">
            {activeList.length} kiện
          </span>

          {/* Batch Linehaul Dispatch Button (Tab 2) */}
          {stationTab === 'SORTING_LINEHAUL' && selectedShipmentIds.size > 0 && (
            <button
              onClick={onOpenDispatchBatch}
              className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5 animate-pulse"
            >
              <span>🚛</span>
              <span>Đóng Xe Tuyến ({selectedShipmentIds.size} kiện đã chọn)</span>
            </button>
          )}

          {/* Quick Route Selectors (Tab 2) */}
          {stationTab === 'SORTING_LINEHAUL' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {hubs
                .filter((h) => !currentHub?.id || h.id !== currentHub.id)
                .map((destHub) => {
                  const prov = (destHub.province || '').toLowerCase()
                  const loadedIds = new Set(dockTrucks.flatMap((t) => t.shipments.map((item) => item.id)))
                  const matching = sortingList.filter((s) => {
                    if (loadedIds.has(s.id)) return false
                    const addr = (s.deliveryAddress || '').toLowerCase()
                    if (prov.includes('hồ chí minh') || prov.includes('hcm')) {
                      return (
                        addr.includes('hồ chí minh') ||
                        addr.includes('tp.hcm') ||
                        addr.includes('tp hcm') ||
                        addr.includes('sài gòn') ||
                        addr.includes('tân bình') ||
                        addr.includes('gò vấp') ||
                        addr.includes('bình thạnh') ||
                        addr.includes('quận 1') ||
                        addr.includes('bình dương') ||
                        addr.includes('đồng nai')
                      )
                    }
                    if (prov.includes('hà nội') || prov.includes('mê linh')) {
                      return addr.includes('hà nội') || addr.includes('mê linh') || addr.includes('cầu giấy')
                    }
                    return addr.includes(prov)
                  })

                  if (matching.length === 0) return null

                  return (
                    <button
                      key={destHub.id}
                      type="button"
                      onClick={() => onSelectRouteForSorting(destHub)}
                      className="px-2 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1"
                      title={`Chọn toàn bộ ${matching.length} kiện chờ xuất đi ${destHub.name}`}
                    >
                      <span>⚡ Chọn Tuyến {destHub.code} ({matching.length} kiện)</span>
                    </button>
                  )
                })}
            </div>
          )}

          {/* Batch Last-Mile Dispatch Button (Tab 4) */}
          {stationTab === 'DISPATCH_LASTMILE' && selectedLastMileIds.size > 0 && (
            <button
              onClick={onOpenLastMileBatch}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5 animate-pulse"
            >
              <span>🛵</span>
              <span>Phân Tuyến Shipper ({selectedLastMileIds.size} kiện đã chọn)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Tìm mã vận đơn, tên..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-400 w-44"
            />
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
          >
            🔄 Làm Mới
          </button>
        </div>
      </div>

      {activeList.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="text-4xl opacity-40">
            {stationTab === 'INBOUND_PICKUP'
              ? '📭'
              : stationTab === 'SORTING_LINEHAUL'
              ? '📦'
              : stationTab === 'INBOUND_RECEIVING'
              ? '🚛'
              : '🛵'}
          </div>
          <p className="text-sm font-bold text-slate-400">Không có bưu kiện nào chờ xử lý tại khâu này</p>
          <p className="text-xs text-slate-300">
            {stationTab === 'INBOUND_PICKUP'
              ? 'Các Shipper First-Mile chưa bàn giao kiện hàng nào về bưu cục.'
              : stationTab === 'SORTING_LINEHAUL'
              ? 'Chưa có kiện hàng nào tại kho cần phân loại & xuất xe.'
              : stationTab === 'INBOUND_RECEIVING'
              ? 'Chưa có xe tải trung chuyển nào đang trên đường đến.'
              : 'Chưa có kiện hàng nào chờ chia tuyến cho Shipper giao.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
              <tr>
                {(stationTab === 'SORTING_LINEHAUL' || stationTab === 'DISPATCH_LASTMILE') && (
                  <th className="py-3 px-3 text-center w-8">
                    <input
                      type="checkbox"
                      checked={
                        stationTab === 'SORTING_LINEHAUL'
                          ? sortingList.length > 0 && selectedShipmentIds.size === sortingList.length
                          : destinationList.length > 0 && selectedLastMileIds.size === destinationList.length
                      }
                      onChange={
                        stationTab === 'SORTING_LINEHAUL' ? onSelectAllSorting : onSelectAllLastMile
                      }
                      className="rounded text-sky-600 cursor-pointer"
                      title="Chọn tất cả"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Mã Vận Đơn</th>
                <th className="py-3 px-4">Người Nhận / Tuyến Đích</th>
                {stationTab === 'INBOUND_PICKUP' && <th className="py-3 px-4">Shipper Bàn Giao</th>}
                {stationTab === 'INBOUND_RECEIVING' && <th className="py-3 px-4">Chuyến Xe Tải & Mã Seal</th>}
                {stationTab === 'DISPATCH_LASTMILE' && <th className="py-3 px-4">Shipper Phụ Trách</th>}
                <th className="py-3 px-4">Kiện Hàng</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeList.map((s) => {
                const pickupAssignment = getPickupDriver(s)
                const deliveryAssignment = getDeliveryDriver(s)
                const linehaulInfo = stationTab === 'INBOUND_RECEIVING' ? extractLinehaulInfo(s) : null

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    {/* Checkbox chọn hàng loạt */}
                    {stationTab === 'SORTING_LINEHAUL' && (
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedShipmentIds.has(s.id)}
                          onChange={() => onToggleSelectShipment(s.id)}
                          className="rounded text-sky-600 cursor-pointer"
                        />
                      </td>
                    )}
                    {stationTab === 'DISPATCH_LASTMILE' && (
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLastMileIds.has(s.id)}
                          onChange={() => onToggleSelectLastMile(s.id)}
                          className="rounded text-emerald-600 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Mã vận đơn */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-black text-[11px] ${
                            s.isReturn ? 'text-orange-700' : 'text-emerald-700'
                          }`}
                        >
                          {s.trackingNumber}
                        </span>
                        {s.isReturn && (
                          <span className="px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 border border-orange-200 text-[9px] font-black uppercase">
                            🔄 Hàng Hoàn
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {s.isReturn
                          ? `Yêu cầu: #${s.returnData?.returnNumber || ''}`
                          : `#${s.orderId.slice(0, 12)}...`}
                      </div>
                      {s.isReturn && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Đơn: #{s.orderId.slice(0, 14)}...
                        </div>
                      )}
                      {s.codAmount > 0 && (
                        <div className="text-[10px] font-bold text-rose-600">
                          💰 COD: {s.codAmount.toLocaleString('vi-VN')}đ
                        </div>
                      )}
                      {s.isReturn && (
                        <div className="text-[10px] font-bold text-emerald-700">💵 Thu khách: 0đ</div>
                      )}
                      {stationTab === 'SORTING_LINEHAUL' &&
                        (() => {
                          const dt = dockTrucks.find((t) => t.shipments.some((item) => item.id === s.id))
                          if (!dt) return null
                          return (
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 font-mono text-[9px] font-bold">
                                <span>🚛</span> Trên xe: [{dt.truckNumber}]
                              </span>
                            </div>
                          )
                        })()}
                    </td>

                    {/* Người nhận */}
                    <td className="py-3.5 px-4 space-y-0.5 max-w-[200px]">
                      <div className="font-bold text-slate-800 text-[11px]">{s.buyerName}</div>
                      <div className="text-[10px] text-slate-400">{s.buyerPhone}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{s.deliveryAddress}</div>
                    </td>

                    {/* Shipper Bàn Giao (Tab 1) */}
                    {stationTab === 'INBOUND_PICKUP' && (
                      <td className="py-3.5 px-4 space-y-0.5 max-w-[180px]">
                        {pickupAssignment?.driver ? (
                          <>
                            <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                              🛵 {pickupAssignment.driver.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              📞 {pickupAssignment.driver.phone} • 🏍️{' '}
                              {pickupAssignment.driver.vehicleNumber || pickupAssignment.driver.licensePlate || ''}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Lấy: {timeAgo(pickupAssignment.completedAt || s.pickedUpAt)}
                            </div>
                            {pickupAssignment.proofImage && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                📸 Có ảnh POP
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Chưa có thông tin</span>
                        )}
                      </td>
                    )}

                    {/* Chuyến Xe Tải & Seal (Tab 3) */}
                    {stationTab === 'INBOUND_RECEIVING' && (
                      <td className="py-3.5 px-4 space-y-1 max-w-[190px]">
                        {linehaulInfo ? (
                          <>
                            <div className="font-mono font-black text-indigo-950 text-[11px] flex items-center gap-1">
                              🚛 {linehaulInfo.truckNumber}
                            </div>
                            {linehaulInfo.sealNumber && (
                              <div className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                                🔒 {linehaulInfo.sealNumber}
                              </div>
                            )}
                            {linehaulInfo.driver && (
                              <div className="text-[10px] text-slate-500">Bác tài: {linehaulInfo.driver}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">🚛 Xe trung chuyển Linehaul</div>
                        )}
                      </td>
                    )}

                    {/* Shipper Phụ Trách (Tab 4) */}
                    {stationTab === 'DISPATCH_LASTMILE' && (
                      <td className="py-3.5 px-4 space-y-0.5 max-w-[190px]">
                        {deliveryAssignment?.driver ? (
                          <>
                            <div className="font-bold text-teal-800 text-[11px] flex items-center gap-1">
                              🛵 {deliveryAssignment.driver.name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              📞 {deliveryAssignment.driver.phone} • 🏍️{' '}
                              {deliveryAssignment.driver.vehicleNumber ||
                                deliveryAssignment.driver.licensePlate ||
                                ''}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 mt-0.5">
                              ⏳ Chờ Shipper nhận
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa gán tuyến</span>
                        )}
                      </td>
                    )}

                    {/* Kiện Hàng */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="text-slate-700 font-medium text-[11px]">
                        {s.package?.itemsSummary || 'Bưu phẩm ZMX'}
                      </div>
                      <div className="text-[10px] text-slate-400">{s.package?.weight || 0.5}kg</div>
                    </td>

                    {/* Trạng Thái */}
                    <td className="py-3.5 px-4">
                      {s.isReturn && stationTab === 'INBOUND_PICKUP' ? (
                        <StatusBadge status="PICKED_UP" />
                      ) : (
                        <StatusBadge status={s.status} />
                      )}
                    </td>

                    {/* Thao Tác */}
                    <td className="py-3.5 px-4 text-right">
                      {stationTab === 'INBOUND_PICKUP' &&
                        (s.isReturn ? (
                          <button
                            onClick={async () => {
                              try {
                                await returnService.hubInboundReturn(s.id, {
                                  hubId: currentHub?.id || '',
                                  staffName: currentUser.name,
                                  note: `Nhân viên kho [${currentUser.name}] quét nhận kiện hoàn tại ${currentHub?.name}`,
                                })
                                alert(`Đã quét nhận kiện hàng hoàn #${s.trackingNumber} nhập kho ${currentHub?.name} thành công!`)
                                onRefresh()
                              } catch (e: any) {
                                alert(e.message || 'Lỗi nhập kho hàng hoàn')
                              }
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40"
                          >
                            📥 Nhập Kho
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onUpdateStatus(
                                s.id,
                                'AT_ORIGIN_HUB',
                                undefined,
                                currentHub?.id,
                                `Nhân viên kho [${currentUser.name}] đã quét nhận bàn giao từ Shipper về ${currentHub?.name}`
                              )
                            }
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40"
                          >
                            📥 Nhập Kho
                          </button>
                        ))}

                      {stationTab === 'SORTING_LINEHAUL' &&
                        (() => {
                          const dt = dockTrucks.find((t) => t.shipments.some((item) => item.id === s.id))
                          if (dt) {
                            return (
                              <button
                                onClick={() =>
                                  onUnloadSingleShipmentFromDock(dt.id, s.id, dt.truckNumber)
                                }
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-[10px] transition cursor-pointer shadow-xs disabled:opacity-40 flex items-center gap-1 ml-auto"
                                title="Dỡ bưu kiện này khỏi xe tải quay lại sàn kho"
                              >
                                <span>↩️</span> Dỡ Khỏi Xe
                              </button>
                            )
                          }
                          return (
                            <button
                              onClick={() => onOpenDispatchSingle(s)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1 ml-auto"
                            >
                              <span>🚛</span> Đóng Xe Tải
                            </button>
                          )
                        })()}

                      {stationTab === 'INBOUND_RECEIVING' && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              const info = extractLinehaulInfo(s)
                              const truck = info?.truckNumber || 'Xe Tuyến Liên Tỉnh'
                              const seal = info?.sealNumber || 'Chưa gắn Seal'
                              const key = `${truck}_${seal}`
                              const foundTrip = linehaulTrips.find((t) => t.tripKey === key)
                              if (foundTrip) {
                                onOpenReconciliation(foundTrip)
                              } else {
                                onUpdateStatus(
                                  s.id,
                                  'AT_DESTINATION_HUB',
                                  undefined,
                                  currentHub?.id,
                                  `Xe tải [${truck}] đã đến và bàn giao bưu kiện vào ${currentHub?.name}`
                                )
                              }
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1"
                          >
                            <span>📋</span>
                            <span>Đối Soát Chuyến</span>
                          </button>
                          <button
                            onClick={() =>
                              onUpdateStatus(
                                s.id,
                                'AT_DESTINATION_HUB',
                                undefined,
                                currentHub?.id,
                                `Xe tải trung chuyển đã đến và bàn giao bưu kiện vào ${currentHub?.name}`
                              )
                            }
                            disabled={actionLoading}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer border border-slate-200"
                            title="Nhập nhanh kiện này"
                          >
                            Nhập Nhanh
                          </button>
                        </div>
                      )}

                      {stationTab === 'DISPATCH_LASTMILE' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'DELIVERY_ASSIGNED' ? (
                            <button
                              onClick={() => onOpenLastMileSingle(s)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1"
                            >
                              <span>🔄</span> Đổi Shipper
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenLastMileSingle(s)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1"
                            >
                              <span>🛵</span> Phân Tuyến Giao
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer */}
      {activeList.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
          <span>
            Hiển thị {activeList.length} bưu kiện • Bưu cục: {currentHub?.name}
          </span>
          <span>Nhân viên: {currentUser.name}</span>
        </div>
      )}
    </>
  )
}
