import { useState } from 'react'
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
  GalleryHorizontal,
  Moon,
  Target,
  Link2,
  Sparkles,
  Truck,
  Menu,
  X,
} from 'lucide-react'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import Toaster from '../ui/Toaster'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Products',  path: '/admin/products',  icon: Package },
  { label: 'Meanings',  path: '/admin/meanings',  icon: Sparkles },
  { label: 'Categories',path: '/admin/categories',icon: Tag },
  { label: 'Sub-Categories', path: '/admin/subcategories', icon: Tag },
  { label: 'Orders',    path: '/admin/orders',    icon: ShoppingBag },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Reviews',   path: '/admin/reviews',   icon: Star },
  { label: 'Coupons',   path: '/admin/coupons',   icon: Ticket },
  { label: 'Rashis',              path: '/admin/astrology/rashis',           icon: Moon },
  { label: 'Purposes',            path: '/admin/astrology/purposes',         icon: Target },
  { label: 'Rashi Mappings',      path: '/admin/astrology/rashi-mappings',   icon: Link2 },
  { label: 'Calculator Leads',    path: '/admin/astrology/leads',            icon: Sparkles },
  { label: 'Blogs',     path: '/admin/blogs',     icon: BookOpen },
  { label: 'Banners',   path: '/admin/banners',   icon: GalleryHorizontal },
  { label: 'Shipping',  path: '/admin/shipping-providers', icon: Truck },
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
    '/admin/meanings': 'Meanings',
    '/admin/subcategories': 'Sub-Categories',
    '/admin/customers':  'Customers',
    '/admin/reviews':    'Reviews',
    '/admin/coupons':    'Coupons',
    '/admin/astrology/rashis':            'Rashis',
    '/admin/astrology/purposes':          'Purposes',
    '/admin/astrology/rashi-mappings':    'Rashi → Bracelet Mappings',
    '/admin/astrology/leads':             'Calculator Leads',
    '/admin/blogs':      'Blog Posts',
    '/admin/banners':    'Hero Banners',
    '/admin/shipping-providers': 'Shipping Providers',
    '/admin/settings':   'Settings',
  }
  return map[pathname] ?? 'Admin'
}

export default function AdminLayout() {
  const { admin, logout } = useAdminAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const pageTitle = getPageTitle(location.pathname)

  const handleLogout = () => {
    logout()
    setIsSidebarOpen(false)
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${isSidebarOpen ? ' is-open' : ''}`} id="admin-navigation">
        {/* Logo area */}
        <div className="admin-sidebar-brand">
          <img
            src="/prayosha-logo.png"
            alt="prayosha crystals"
            style={{ height: 54, width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Nav */}
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setIsSidebarOpen(false)}
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
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
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
              fontFamily: "var(--font-body)",
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#9E9590',
              padding: 0,
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>
      {isSidebarOpen && (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main area ── */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            type="button"
            aria-label={isSidebarOpen ? 'Close admin navigation' : 'Open admin navigation'}
            aria-expanded={isSidebarOpen}
            aria-controls="admin-navigation"
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span
            style={{
              fontFamily: "var(--font-body)",
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
                fontFamily: "var(--font-body)",
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
        <main className="admin-page-content">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  )
}
