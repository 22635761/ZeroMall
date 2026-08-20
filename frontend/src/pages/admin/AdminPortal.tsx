import React from 'react'
import { AdminPage } from './AdminPage'
import { CsSupportPage } from '../CsSupport/CsSupportPage'
import { AdminAuthForm } from '../../components/admin/AdminAuthForm'

interface AdminPortalProps {
  user: any
  onAuthSuccess?: (user: any, token: string) => void
  onLogout: () => void
  onBackToHome: () => void
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  onAuthSuccess = () => {},
  onLogout,
  onBackToHome
}) => {
  // If authenticated as ADMIN
  if (user?.role === 'ADMIN') {
    return <AdminPage user={user} onLogout={onLogout} onBackToHome={onBackToHome} />
  }

  // If authenticated as PLATFORM_SUPPORT
  if (user?.role === 'PLATFORM_SUPPORT') {
    return <CsSupportPage user={user} onLogout={onLogout} onBackToHome={onBackToHome} />
  }

  // If not authenticated or logged in as different role, show dedicated Admin / CS Portal Login page
  return (
    <AdminAuthForm
      onAuthSuccess={onAuthSuccess}
      onBackToHome={onBackToHome}
    />
  )
}
