import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  Star,
  Ticket,
  Settings,
  Bell,
  LogOut,
  BookOpen,
} from 'lucide-react'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import Toaster from '../ui/Toaster'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Products',  path: '/admin/products',  icon: Package },
  { label: 'Categories',path: '/admin/categories',icon: Tag },
  { label: 'Orders',    path: '/admin/orders',    icon: ShoppingBag },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Reviews',   path: '/admin/reviews',   icon: Star },
  { label: 'Coupons',   path: '/admin/coupons',   icon: Ticket },
  { label: 'Blogs',     path: '/admin/blogs',     icon: BookOpen },
  { label: 'Settings',  path: '/admin/settings',  icon: Settings },
] as const

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/admin/products')) {
    if (pathname.endsWith('/new'))  return 'New Product'
    if (pathname.endsWith('/edit')) return 'Edit Product'
    return 'Products'
  }
  if (pathname.startsWith('/admin/orders')) {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length > 2) return 'Order Detail'
    return 'Orders'
  }
  const map: Record<string, string> = {
    '/admin/dashboard':  'Dashboard',
    '/admin/categories': 'Categories',
    '/admin/customers':  'Customers',
    '/admin/reviews':    'Reviews',
    '/admin/coupons':    'Coupons',
    '/admin/blogs':      'Blog Posts',
    '/admin/settings':   'Settings',
  }
  return map[pathname] ?? 'Admin'
}

export default function AdminLayout() {
  const { admin, logout } = useAdminAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const pageTitle = getPageTitle(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 240,
          height: '100vh',
          background: '#EDE8DC',
          borderRight: '1px solid #E2DAC8',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        {/* Logo area */}
        <div
          style={{
            height: 72,
            borderBottom: '1px solid #E2DAC8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: '#1C1A17',
            }}
          >
            Prayosha Crystal
          </span>
          <span
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#9E9590',
            }}
          >
            Admin Panel
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `admin-nav-item${isActive ? ' active' : ''}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div
          style={{
            borderTop: '1px solid #E2DAC8',
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: '#1C1A17',
              marginBottom: 10,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {admin?.name}
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Jost', sans-serif",
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#9E9590',
              padding: 0,
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div
        style={{
          marginLeft: 240,
          flex: 1,
          background: '#F5F0E8',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Topbar */}
        <header
          style={{
            height: 64,
            background: '#F5F0E8',
            borderBottom: '1px solid #E2DAC8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            position: 'sticky',
            top: 0,
            zIndex: 5,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: '#1C1A17',
            }}
          >
            {pageTitle}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B6057',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
            >
              <Bell size={18} />
            </button>

            {/* Avatar */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#7B5EA7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Jost', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: '#fff',
                userSelect: 'none',
              }}
            >
              {admin?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '32px 40px', flex: 1 }}>
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  )
}
