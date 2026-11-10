import React, { useState } from 'react'
import type { Shipment, Hub, Driver, AdminActiveNav } from './types'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopBar } from './AdminTopBar'
import { AdminControlTowerView } from './AdminControlTowerView'
import { AdminShipmentDataGrid } from './AdminShipmentDataGrid'
import { AdminShipmentDrawer } from './AdminShipmentDrawer'
import { AdminLinehaulFleetView } from './AdminLinehaulFleetView'
import { LogisticsHubsFleetTab } from '../LogisticsHubsFleetTab'
import { LogisticsCodReconciliationTab } from '../LogisticsCodReconciliationTab'
import { LogisticsFinanceTab } from '../LogisticsFinanceTab'

interface AdminPortalLayoutProps {
  currentUser: any
  shipments: Shipment[]
  hubs: Hub[]
  drivers: Driver[]
  loading?: boolean
  onRefresh: () => void
  onLogout: () => void
  onBackToHome?: () => void
  onUpdateStatus?: (shipmentId: string, status: string, failureReason?: string) => void
}

export const AdminPortalLayout: React.FC<AdminPortalLayoutProps> = ({
  currentUser,
  shipments,
  hubs,
  drivers,
  loading = false,
  onRefresh,
  onLogout,
  onBackToHome,
  onUpdateStatus,
}) => {
  const [activeNav, setActiveNav] = useState<AdminActiveNav>(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab') as AdminActiveNav
    if (tabParam && ['TOWER', 'SHIPMENTS', 'HUBS', 'LINEHAUL', 'DRIVERS', 'COD', 'FINANCE'].includes(tabParam)) {
      return tabParam
    }
    return 'TOWER'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHubId, setSelectedHubId] = useState('ALL')
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [gridStatusFilter, setGridStatusFilter] = useState('ALL')

  // Lọc danh sách bưu kiện theo Hub được chọn (nếu có)
  const hubFilteredShipments = shipments.filter((s) => {
    if (selectedHubId === 'ALL') return true
    return s.currentHubId === selectedHubId || s.currentHub?.id === selectedHubId
  })

  // Nếu người dùng tìm kiếm trên TopBar
  const handleGlobalSearchSubmit = () => {
    if (searchQuery.trim()) {
      setActiveNav('SHIPMENTS')
    }
  }

  // Điều hướng từ phễu bưu kiện sang Data Grid có sẵn filter
  const handleNavigateToShipments = (statusFilter: string) => {
    setGridStatusFilter(statusFilter)
    setActiveNav('SHIPMENTS')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex text-left selection:bg-emerald-600 selection:text-white">
      {/* 1. Fixed Left Sidebar */}
      <AdminSidebar
        activeNav={activeNav}
        onChangeNav={(nav) => {
          setActiveNav(nav)
          if (nav === 'SHIPMENTS') setGridStatusFilter('ALL')
        }}
        totalShipments={shipments.length}
        totalHubs={hubs.length}
        totalDrivers={drivers.length}
        currentUser={currentUser}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
      />

      {/* 2. Main Workspace (Right) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Global Top Bar */}
        <AdminTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleGlobalSearchSubmit}
          selectedHubId={selectedHubId}
          onSelectHub={setSelectedHubId}
          hubs={hubs}
          onRefresh={onRefresh}
          loading={loading}
          slaRate={97.8}
        />

        {/* Dynamic Workspace Content */}
        <main className="p-6 lg:p-8 flex-1 space-y-6 max-w-[1600px] w-full mx-auto">
          {activeNav === 'TOWER' && (
            <AdminControlTowerView
              shipments={hubFilteredShipments}
              hubs={hubs}
              drivers={drivers}
              onSelectShipment={(s) => setSelectedShipment(s)}
              onNavigateToShipmentsWithFilter={handleNavigateToShipments}
              onNavigateToDrivers={() => setActiveNav('DRIVERS')}
              onNavigateToCod={() => setActiveNav('COD')}
            />
          )}

          {activeNav === 'SHIPMENTS' && (
            <AdminShipmentDataGrid
              shipments={hubFilteredShipments}
              onSelectShipment={(s) => setSelectedShipment(s)}
              initialStatusFilter={gridStatusFilter}
              loading={loading}
            />
          )}

          {activeNav === 'HUBS' && (
            <div className="space-y-4">
              <LogisticsHubsFleetTab initialSubView="HUBS" />
            </div>
          )}

          {activeNav === 'LINEHAUL' && (
            <AdminLinehaulFleetView
              hubs={hubs}
              shipments={hubFilteredShipments}
              onSelectShipment={(s) => setSelectedShipment(s)}
            />
          )}

          {activeNav === 'DRIVERS' && (
            <div className="space-y-4">
              <LogisticsHubsFleetTab initialSubView="DRIVERS" />
            </div>
          )}

          {activeNav === 'COD' && (
            <LogisticsCodReconciliationTab
              shipments={hubFilteredShipments}
              hubs={hubs}
              drivers={drivers}
              onSelectShipment={(s) => setSelectedShipment(s as any)}
            />
          )}

          {activeNav === 'FINANCE' && (
            <LogisticsFinanceTab
              shipments={hubFilteredShipments}
              hubs={hubs}
              drivers={drivers}
            />
          )}
        </main>

        {/* Enterprise Footer */}
        <footer className="bg-white border-t border-slate-200/90 py-3.5 px-6 text-center text-xs text-slate-400 font-medium">
          ZeroExpress (ZMX) Logistics Operations Center • Tiêu chuẩn vận hành chuỗi cung ứng TMĐT cấp cao
        </footer>
      </div>

      {/* 3. Slide-Over Shipment Drawer */}
      <AdminShipmentDrawer
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onUpdateStatus={onUpdateStatus}
      />
    </div>
  )
}
