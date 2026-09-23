import React, { useState, useMemo } from 'react'
import { LinehaulDispatchModal } from './LinehaulDispatchModal'
import { LinehaulInboundReconciliationModal } from './LinehaulInboundReconciliationModal'
import { LastMileDispatchModal } from './LastMileDispatchModal'
import { HubDockTruckList } from './HubDockTruckList'

import type {
  Shipment,
  StationTab,
  HubOperatorStationProps,
  LinehaulTrip,
} from './hub/types'
import {
  extractLinehaulInfo,
  isDestinedForCurrentHub,
} from './hub/helpers'
import { useHubDockTrucks } from './hub/useHubDockTrucks'
import { useHubDispatchModals } from './hub/useHubDispatchModals'
import { useHubScanner } from './hub/useHubScanner'
import { HubPipelineTabs } from './hub/HubPipelineTabs'
import { HubScannerBar } from './hub/HubScannerBar'
import { HubLinehaulTripsBanner } from './hub/HubLinehaulTripsBanner'
import { DockTruckQuickSealModal } from './hub/DockTruckQuickSealModal'
import { HubParcelTable } from './hub/HubParcelTable'

export const HubOperatorStation: React.FC<HubOperatorStationProps> = ({
  currentUser,
  hubs,
  drivers = [],
  shipments,
  returns = [],
  onRefresh,
  onUpdateStatus,
  actionLoading,
  assignedHubId,
}) => {
  const currentHub = useMemo(() => {
    if (assignedHubId) return hubs.find((h) => h.id === assignedHubId) || hubs[0]
    const email = (currentUser?.email || '').toLowerCase()
    if (email.includes('bienhoa')) return hubs.find((h) => h.code === 'DN01') || hubs[0]
    if (email.includes('melinh')) return hubs.find((h) => h.code === 'HN01') || hubs[0]
    return hubs.find((h) => h.code === 'HCM01') || hubs[0]
  }, [assignedHubId, currentUser?.email, hubs])

  const [stationTab, setStationTab] = useState<StationTab>('INBOUND_PICKUP')
  const [searchFilter, setSearchFilter] = useState('')

  // 1. Nhận Từ Shipper
  const pickupInboundList = useMemo(
    () => shipments.filter((s) => s.status === 'PICKED_UP' && s.currentHubId === currentHub?.id),
    [shipments, currentHub]
  )

  // 1.1 Hàng Hoàn Chờ Bàn Giao Từ Shipper (Inbound Pickup)
  const returnInboundList = useMemo(() => {
    return returns.filter((r) => {
      const isPendingHubInbound =
        r.status === 'RETURN_IN_TRANSIT' &&
        r.resolution !== 'REFUND_ONLY' &&
        (r.returnMethod === 'ZMX_PICKUP' || !r.returnMethod)

      if (!isPendingHubInbound) return false
      if (r.shipment?.currentHubId && currentHub?.id) {
        return r.shipment.currentHubId === currentHub.id
      }
      return true
    })
  }, [returns, currentHub])

  const returnInboundAsShipments = useMemo(() => {
    return returnInboundList.map((ret): Shipment => {
      const trackingNum = ret.returnTrackingNumber || ret.returnNumber
      const buyerName = ret.shipment?.buyerName || 'Người Mua'
      const buyerPhone = ret.shipment?.buyerPhone || ''
      const buyerAddress = ret.shipment?.deliveryAddress || 'Địa chỉ khách'
      const shopName = ret.shipment?.pickupAddress?.name || 'Kho Shop'
      const shopAddress = [
        ret.shipment?.pickupAddress?.address,
        ret.shipment?.pickupAddress?.ward,
        ret.shipment?.pickupAddress?.district,
        ret.shipment?.pickupAddress?.province,
      ]
        .filter(Boolean)
        .join(', ') || 'Kho Người Bán'

      const itemsSummary =
        ret.items?.map((it) => `${it.productName} (x${it.quantity})`).join(', ') || 'Hàng hoàn trả'

      return {
        id: ret.id,
        orderId: ret.orderId,
        trackingNumber: trackingNum,
        buyerName: `${buyerName} (Khách Hoàn)`,
        buyerPhone: buyerPhone,
        deliveryAddress: `Gửi về Shop: ${shopName} • ${shopAddress}`,
        pickupAddress: { name: buyerName, phone: buyerPhone, address: buyerAddress },
        codAmount: 0,
        status: 'RETURN_IN_TRANSIT',
        currentHubId: ret.shipment?.currentHubId || currentHub?.id,
        currentHub: currentHub ? { id: currentHub.id, name: currentHub.name } : undefined,
        package: { weight: 0.5, itemsSummary },
        assignments: [
          {
            id: `ret-asn-${ret.id}`,
            type: 'PICKUP',
            status: 'COMPLETED',
            driver: { name: 'Shipper ZMX', phone: 'Đã thu hồi từ khách', vehicleNumber: 'Xe máy' },
            completedAt: ret.updatedAt,
            proofImage: ret.evidences?.find((e) => e.fileType === 'IMAGE')?.fileUrl,
          },
        ],
        isReturn: true,
        returnData: ret,
      }
    })
  }, [returnInboundList, currentHub])

  // 1.2 Hàng Hoàn Đã Nhập Kho (Lưu tại kho này hoặc chờ chuyển tiếp về Shop)
  const returnAtHubAsShipments = useMemo(() => {
    return returns
      .filter((r) => {
        if (r.status !== 'RETURN_AT_HUB') return false
        // Nếu shipment liên kết đã chuyển sang IN_TRANSIT (đã xuất xe tải) hoặc AT_DESTINATION_HUB, không hiển thị ở sàn kho Tab 2
        if (r.shipment?.status && r.shipment.status !== 'AT_ORIGIN_HUB' && r.shipment.status !== 'SORTING') {
          return false
        }
        if (r.shipment?.currentHubId && currentHub?.id) {
          return r.shipment.currentHubId === currentHub.id
        }
        return true
      })
      .map((ret): Shipment => {
        const trackingNum = ret.returnTrackingNumber || ret.returnNumber
        const buyerName = ret.shipment?.buyerName || 'Người Mua'
        const buyerPhone = ret.shipment?.buyerPhone || ''
        const buyerAddress = ret.shipment?.deliveryAddress || 'Địa chỉ khách'
        const shopName = ret.shipment?.pickupAddress?.name || 'Kho Shop'
        const shopAddress = [
          ret.shipment?.pickupAddress?.address,
          ret.shipment?.pickupAddress?.ward,
          ret.shipment?.pickupAddress?.district,
          ret.shipment?.pickupAddress?.province,
        ]
          .filter(Boolean)
          .join(', ') || 'Kho Người Bán'

        const itemsSummary =
          ret.items?.map((it) => `${it.productName} (x${it.quantity})`).join(', ') || 'Hàng hoàn trả'

        return {
          id: ret.shipmentId || ret.id,
          orderId: ret.orderId,
          trackingNumber: trackingNum,
          buyerName: `${shopName} (Shop Nhận Hoàn)`,
          buyerPhone: ret.shipment?.pickupAddress?.phone || buyerPhone,
          deliveryAddress: `Kho Shop: ${shopName} • ${shopAddress}`,
          pickupAddress: { name: buyerName, phone: buyerPhone, address: buyerAddress },
          codAmount: 0,
          status: 'AT_ORIGIN_HUB',
          currentHubId: ret.shipment?.currentHubId || currentHub?.id,
          currentHub: currentHub ? { id: currentHub.id, name: currentHub.name } : undefined,
          package: { weight: 0.5, itemsSummary },
          assignments: [],
          isReturn: true,
          returnData: ret,
        }
      })
  }, [returns, currentHub])

  // 2. Phân loại & Xuất xe (Đơn hàng gửi đi + Hàng hoàn đang lưu tại kho)
  const sortingList = useMemo(
    () => [
      ...shipments.filter(
        (s) => ['AT_ORIGIN_HUB', 'SORTING'].includes(s.status) && s.currentHubId === currentHub?.id
      ),
      ...returnAtHubAsShipments,
    ],
    [shipments, returnAtHubAsShipments, currentHub]
  )

  // Helper map shipment kèm thông tin hoàn hàng (nếu có)
  const enhanceShipmentWithReturn = (s: Shipment): Shipment => {
    const linkedReturn = returns.find((r) => r.shipmentId === s.id || r.id === s.id)
    if (!linkedReturn) return s

    const trackingNum = linkedReturn.returnTrackingNumber || linkedReturn.returnNumber || s.trackingNumber
    const shopName = s.pickupAddress?.name || 'Kho Shop'
    const shopAddress = [
      s.pickupAddress?.address,
      s.pickupAddress?.ward,
      s.pickupAddress?.district,
      s.pickupAddress?.province,
    ]
      .filter(Boolean)
      .join(', ') || 'Kho Người Bán'

    return {
      ...s,
      trackingNumber: trackingNum,
      buyerName: `${shopName} (Shop Nhận Hoàn)`,
      buyerPhone: s.pickupAddress?.phone || s.buyerPhone,
      deliveryAddress: `Kho Shop: ${shopName} • ${shopAddress}`,
      isReturn: true,
      returnData: linkedReturn,
    }
  }

  // 3. Tiếp nhận xe tải đến
  const inTransitList = useMemo(
    () =>
      shipments
        .filter((s) => s.status === 'IN_TRANSIT' && isDestinedForCurrentHub(s, currentHub))
        .map(enhanceShipmentWithReturn),
    [shipments, returns, currentHub]
  )

  // 4. Chia tuyến Shipper Last-Mile
  const destinationList = useMemo(
    () =>
      shipments
        .filter(
          (s) =>
            ['AT_DESTINATION_HUB', 'DELIVERY_ASSIGNED'].includes(s.status) &&
            isDestinedForCurrentHub(s, currentHub)
        )
        .map(enhanceShipmentWithReturn),
    [shipments, returns, currentHub]
  )

  // Quản lý xe tại Dock (custom hook)
  const {
    dockTrucks,
    saveDockTrucks,
    sealingDockTruck,
    setSealingDockTruck,
    quickSealNumber,
    setQuickSealNumber,
    activeScanDockTruckId,
    setActiveScanDockTruckId,
    directScanMode,
    setDirectScanMode,
    handleOpenSealModal,
    handleConfirmSealFromDock,
    handleUnloadEntireDockTruck,
    handleUnloadSingleShipmentFromDock,
    getMatchingUnloadedParcelsForTruck,
    handleBatchLoadRouteToTruck,
  } = useHubDockTrucks(
    currentHub,
    hubs,
    sortingList,
    onUpdateStatus,
    onRefresh,
    (msg) => setScanMessage(msg)
  )

  // Quản lý các Modal chia tuyến & đóng xe (custom hook)
  const {
    selectedShipmentIds,
    setSelectedShipmentIds,
    selectedLastMileIds,
    setSelectedLastMileIds,
    isDispatchModalOpen,
    setIsDispatchModalOpen,
    modalShipments,
    setModalShipments,
    isLastMileModalOpen,
    setIsLastMileModalOpen,
    lastMileModalShipments,
    setLastMileModalShipments,
    reconcilingTrip,
    setReconcilingTrip,
    handleToggleSelectShipment,
    handleSelectAllSorting,
    handleToggleSelectLastMile,
    handleSelectAllLastMile,
    handleOpenLastMileSingle,
    handleOpenLastMileBatch,
    handleConfirmLastMileDispatch,
    handleOpenDispatchSingle,
    handleOpenDispatchBatch,
    handleConfirmLinehaulDispatch,
  } = useHubDispatchModals(
    sortingList,
    destinationList,
    currentHub,
    drivers,
    dockTrucks,
    saveDockTrucks,
    onUpdateStatus,
    onRefresh,
    (msg) => setScanMessage(msg)
  )

  // Danh sách bưu kiện tổng hợp tại kho để máy quét barcode tra cứu
  const allHubShipmentsForScanner = useMemo(() => {
    return [...shipments, ...returnAtHubAsShipments]
  }, [shipments, returnAtHubAsShipments])

  // Quản lý Máy Quét Mã Vạch (custom hook)
  const {
    scannedCode,
    setScannedCode,
    scanMessage,
    setScanMessage,
    isCameraScannerOpen,
    setIsCameraScannerOpen,
    handleScanCode,
    handleScanSubmit,
  } = useHubScanner(
    stationTab,
    currentHub,
    currentUser,
    hubs,
    allHubShipmentsForScanner,
    returnInboundAsShipments,
    dockTrucks,
    activeScanDockTruckId,
    directScanMode,
    saveDockTrucks,
    onUpdateStatus,
    onRefresh,
    handleOpenDispatchSingle,
    handleOpenLastMileSingle
  )

  // Gom nhóm chuyến xe
  const linehaulTrips = useMemo(() => {
    const map = new Map<string, LinehaulTrip>()
    inTransitList.forEach((s) => {
      const info = extractLinehaulInfo(s)
      const truck = info?.truckNumber || 'Xe Tuyến Liên Tỉnh'
      const seal = info?.sealNumber || 'Chưa gắn Seal'
      const driver = info?.driver || 'Bác tài'
      const phone = info?.driverPhone || ''
      const key = `${truck}_${seal}`

      if (!map.has(key)) {
        map.set(key, {
          tripKey: key,
          truckNumber: truck,
          sealNumber: seal,
          truckDriver: driver,
          truckDriverPhone: phone,
          originHubName: s.currentHub?.name,
          dispatchedAt: s.trackingLogs?.find((l) => l.description?.includes('Xe tải'))?.timestamp,
          shipments: [],
        })
      }
      map.get(key)!.shipments.push({
        id: s.id,
        trackingNumber: s.trackingNumber,
        orderId: s.orderId,
        buyerName: s.buyerName,
        buyerPhone: s.buyerPhone,
        deliveryAddress: s.deliveryAddress,
        package: s.package,
        codAmount: s.codAmount,
        status: s.status,
      })
    })
    return Array.from(map.values())
  }, [inTransitList])

  const activeReconcilingTrip = useMemo(() => {
    if (!reconcilingTrip) return null
    return linehaulTrips.find((t) => t.tripKey === reconcilingTrip.tripKey) || reconcilingTrip
  }, [reconcilingTrip, linehaulTrips])

  const activeList = useMemo(() => {
    const raw =
      stationTab === 'INBOUND_PICKUP'
        ? [...pickupInboundList, ...returnInboundAsShipments]
        : stationTab === 'SORTING_LINEHAUL'
        ? sortingList
        : stationTab === 'INBOUND_RECEIVING'
        ? inTransitList
        : destinationList

    if (!searchFilter.trim()) return raw
    const q = searchFilter.trim().toLowerCase()
    return raw.filter(
      (s) =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.buyerName.toLowerCase().includes(q) ||
        s.buyerPhone.includes(q) ||
        s.orderId.toLowerCase().includes(q) ||
        (s.returnData?.returnNumber && s.returnData.returnNumber.toLowerCase().includes(q))
    )
  }, [
    stationTab,
    pickupInboundList,
    returnInboundAsShipments,
    sortingList,
    inTransitList,
    destinationList,
    searchFilter,
  ])

  // Trip Reconciliation Handlers (Tab 3)
  const handleReceiveShipmentFromTrip = async (shipmentId: string) => {
    const truck = reconcilingTrip?.truckNumber || 'Xe tải tuyến'
    await onUpdateStatus(
      shipmentId,
      'AT_DESTINATION_HUB',
      undefined,
      currentHub?.id,
      `Xe tải [${truck}] đã đến. Nhân viên bưu cục [${currentUser.name}] đã đối soát & nhập bưu cục phát ${currentHub?.name}`
    )
    onRefresh()
  }

  const handleReceiveAllShipmentsFromTrip = async (shipmentIds: string[]) => {
    const truck = reconcilingTrip?.truckNumber || 'Xe tải tuyến'
    for (const id of shipmentIds) {
      await onUpdateStatus(
        id,
        'AT_DESTINATION_HUB',
        undefined,
        currentHub?.id,
        `Xe tải [${truck}] đã đến. Xác nhận nhập kho bưu cục phát ${currentHub?.name}`
      )
    }
    setScanMessage({
      type: 'success',
      text: `🏢 Đã nhập kho thành công toàn bộ ${shipmentIds.length} kiện từ chuyến xe [${truck}]!`,
    })
    onRefresh()
  }

  const handleReportTripDiscrepancy = async (trip: LinehaulTrip, missingShipmentIds: string[], reason: string) => {
    for (const id of missingShipmentIds) {
      await onUpdateStatus(
        id,
        'DELIVERY_FAILED',
        reason,
        currentHub?.id,
        `BẤT THƯỜNG ĐỐI SOÁT CHUYẾN XE [${trip.truckNumber}]: ${reason}. Đã lập biên bản gửi Bác tài [${trip.truckDriver}] & Bưu cục gửi để truy soát camera.`
      )
    }
    setScanMessage({
      type: 'error',
      text: `⚠️ Đã lập biên bản bất thường thiếu ${missingShipmentIds.length} kiện trên chuyến xe [${trip.truckNumber}].`,
    })
    onRefresh()
  }

  if (!currentHub) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Đang tải dữ liệu bưu cục...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 text-left">
      {/* SECTION 1: 4-STEP PIPELINE TABS */}
      <HubPipelineTabs
        currentTab={stationTab}
        onSelectTab={(tab) => {
          setStationTab(tab)
          setSearchFilter('')
          setScanMessage(null)
          setSelectedShipmentIds(new Set())
          setSelectedLastMileIds(new Set())
        }}
        pickupCount={pickupInboundList.length}
        returnCount={returnInboundList.length}
        sortingCount={sortingList.length}
        inTransitCount={inTransitList.length}
        destinationCount={destinationList.length}
      />

      {/* SECTION 2: SCANNER BAR */}
      <HubScannerBar
        stationTab={stationTab}
        dockTrucks={dockTrucks}
        activeScanDockTruckId={activeScanDockTruckId}
        setActiveScanDockTruckId={setActiveScanDockTruckId}
        directScanMode={directScanMode}
        setDirectScanMode={setDirectScanMode}
        scannedCode={scannedCode}
        setScannedCode={setScannedCode}
        onScanSubmit={handleScanSubmit}
        scanMessage={scanMessage}
        isCameraScannerOpen={isCameraScannerOpen}
        setIsCameraScannerOpen={setIsCameraScannerOpen}
        actionLoading={actionLoading}
        onScanCode={handleScanCode}
      />

      {/* SECTION 3: PARCEL TABLE & SUB-VIEWS */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        {/* Banner Xe tại Dock (Tab 2) */}
        {stationTab === 'SORTING_LINEHAUL' && (
          <HubDockTruckList
            dockTrucks={dockTrucks}
            activeScanDockTruckId={activeScanDockTruckId}
            setActiveScanDockTruckId={setActiveScanDockTruckId}
            actionLoading={actionLoading}
            getMatchingUnloadedParcelsForTruck={getMatchingUnloadedParcelsForTruck}
            handleBatchLoadRouteToTruck={handleBatchLoadRouteToTruck}
            handleOpenSealModal={handleOpenSealModal}
            handleUnloadEntireDockTruck={handleUnloadEntireDockTruck}
          />
        )}

        {/* Banner Xe Tuyến Cập Bến (Tab 3) */}
        {stationTab === 'INBOUND_RECEIVING' && (
          <HubLinehaulTripsBanner
            linehaulTrips={linehaulTrips}
            inTransitTotalCount={inTransitList.length}
            onOpenReconciliation={(trip) => setReconcilingTrip(trip)}
          />
        )}

        {/* Main Parcel Table */}
        <HubParcelTable
          stationTab={stationTab}
          activeList={activeList}
          sortingList={sortingList}
          destinationList={destinationList}
          selectedShipmentIds={selectedShipmentIds}
          selectedLastMileIds={selectedLastMileIds}
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          onRefresh={onRefresh}
          currentHub={currentHub}
          currentUser={currentUser}
          hubs={hubs}
          dockTrucks={dockTrucks}
          linehaulTrips={linehaulTrips}
          actionLoading={actionLoading}
          onToggleSelectShipment={handleToggleSelectShipment}
          onSelectAllSorting={handleSelectAllSorting}
          onToggleSelectLastMile={handleToggleSelectLastMile}
          onSelectAllLastMile={handleSelectAllLastMile}
          onOpenDispatchBatch={handleOpenDispatchBatch}
          onOpenDispatchSingle={handleOpenDispatchSingle}
          onOpenLastMileBatch={handleOpenLastMileBatch}
          onOpenLastMileSingle={handleOpenLastMileSingle}
          onUnloadSingleShipmentFromDock={handleUnloadSingleShipmentFromDock}
          onSelectRouteForSorting={(destHub) => {
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
            setSelectedShipmentIds(new Set(matching.map((s) => s.id)))
          }}
          onOpenReconciliation={(trip) => setReconcilingTrip(trip)}
          onUpdateStatus={onUpdateStatus}
        />
      </div>

      {/* MODAL 1: LINEHAUL DISPATCH & SEAL */}
      <LinehaulDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false)
          setModalShipments([])
        }}
        onConfirm={handleConfirmLinehaulDispatch}
        currentHub={currentHub}
        availableHubs={hubs}
        selectedShipments={modalShipments}
        dockTrucks={dockTrucks}
        registeredDrivers={drivers}
        actionLoading={actionLoading}
      />

      {/* MODAL 2: QUICK SEAL FROM DOCK */}
      <DockTruckQuickSealModal
        sealingDockTruck={sealingDockTruck}
        onClose={() => setSealingDockTruck(null)}
        quickSealNumber={quickSealNumber}
        setQuickSealNumber={setQuickSealNumber}
        onConfirmSeal={handleConfirmSealFromDock}
        actionLoading={actionLoading}
      />

      {/* MODAL 3: INBOUND RECONCILIATION */}
      <LinehaulInboundReconciliationModal
        isOpen={!!reconcilingTrip}
        onClose={() => setReconcilingTrip(null)}
        trip={activeReconcilingTrip}
        currentHubName={currentHub?.name || 'Bưu cục phát'}
        onReceiveShipment={handleReceiveShipmentFromTrip}
        onReceiveAllShipments={handleReceiveAllShipmentsFromTrip}
        onReportDiscrepancy={handleReportTripDiscrepancy}
        actionLoading={actionLoading}
      />

      {/* MODAL 4: LAST-MILE DISPATCH */}
      <LastMileDispatchModal
        isOpen={isLastMileModalOpen}
        onClose={() => {
          setIsLastMileModalOpen(false)
          setLastMileModalShipments([])
        }}
        shipments={lastMileModalShipments}
        drivers={drivers}
        currentHub={currentHub}
        onConfirm={handleConfirmLastMileDispatch}
        actionLoading={actionLoading}
      />
    </div>
  )
}
