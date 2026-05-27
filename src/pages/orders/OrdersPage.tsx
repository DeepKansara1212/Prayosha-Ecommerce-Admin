import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, ChevronDown, ChevronLeft, ChevronRight, Search, Loader2, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react'
import {
  getAllOrders,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '../../api/orders.api'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif"

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const ORDER_STATUSES: OrderStatus[] = [
  'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
]

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string }> = {
  placed:     { bg: '#F3F4F6', color: '#6B7280' },
  confirmed:  { bg: '#ECFDF5', color: '#5A8A6A' },
  processing: { bg: '#F0EAF7', color: '#7B5EA7' },
  shipped:    { bg: '#E0F2FE', color: '#0369A1' },
  delivered:  { bg: '#ECFDF5', color: '#166534' },
  cancelled:  { bg: '#FEF2F2', color: '#A85050' },
  refunded:   { bg: '#FEF9EC', color: '#C49A3C' },
}

const PAYMENT_STYLE: Record<string, { bg: string; color: string }> = {
  paid:     { bg: '#ECFDF5', color: '#5A8A6A' },
  pending:  { bg: '#FEF9EC', color: '#C49A3C' },
  failed:   { bg: '#FEF2F2', color: '#A85050' },
  refunded: { bg: '#F3F4F6', color: '#6B7280' },
}

// ── Styles ────────────────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  padding: '7px 10px',
  background: '#F5F0E8',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  fontFamily: FONT,
  fontSize: 12,
  color: '#1C1A17',
  outline: 'none',
}

const TH: React.CSSProperties = {
  padding: '10px 12px',
  fontFamily: FONT,
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#9E9590',
  textAlign: 'left',
  borderBottom: '1px solid #E2DAC8',
  background: '#EDE8DC',
  whiteSpace: 'nowrap',
}

const TD: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #E2DAC8',
  verticalAlign: 'middle',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ type, message }: { type: 'success' | 'error'; message: string }) {
  const isOk = type === 'success'
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        background: isOk ? '#1C1A17' : '#A85050',
        borderRadius: 4,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        maxWidth: 360,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {isOk
        ? <CheckCircle size={15} color="#5A8A6A" />
        : <AlertCircle size={15} color="#fff" />}
      <span style={{ fontFamily: FONT, fontSize: 13, color: '#fff' }}>{message}</span>
    </div>
  )
}

// ── StatusDropdown ────────────────────────────────────────────────────────────

function StatusDropdown({
  orderId,
  current,
  onSelect,
  disabled,
  isLoading,
}: {
  orderId: string
  current: OrderStatus
  onSelect: (id: string, status: OrderStatus) => void
  disabled?: boolean
  isLoading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const busy = isLoading || disabled

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !busy && setOpen(o => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px 3px 10px',
          borderRadius: 12,
          border: 'none',
          cursor: busy ? 'not-allowed' : 'pointer',
          background: STATUS_STYLE[current].bg,
          color: STATUS_STYLE[current].color,
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 500,
          opacity: busy ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {capitalize(current)}
        {isLoading
          ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
          : <ChevronDown size={11} />
        }
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            background: '#F5F0E8',
            border: '1px solid #E2DAC8',
            borderRadius: 4,
            boxShadow: '0 4px 16px rgba(28,26,23,0.12)',
            zIndex: 200,
            minWidth: 148,
            overflow: 'hidden',
          }}
        >
          {ORDER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { onSelect(orderId, s); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                background: s === current ? '#EDE8DC' : 'transparent',
                border: 'none',
                fontFamily: FONT,
                fontSize: 12,
                color: STATUS_STYLE[s]?.color ?? '#6B7280',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  s === current ? '#E2DAC8' : '#EDE8DC')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  s === current ? '#EDE8DC' : 'transparent')
              }
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: STATUS_STYLE[s]?.color ?? '#6B7280',
                  flexShrink: 0,
                }}
              />
              {capitalize(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter]   = useState('')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage]                   = useState(1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // ── Toast ──────────────────────────────────────────────────────────────────────

  const [toast, setToast]   = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimer          = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, message })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  useEffect(() => { setPage(1) }, [statusFilter, dateFrom, dateTo])

  // ── Query ─────────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-orders', statusFilter, dateFrom, dateTo, debouncedSearch, page],
    queryFn: () =>
      getAllOrders({
        status:   statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo || undefined,
        search:   debouncedSearch || undefined,
        page,
        limit:    20,
      }),
    placeholderData: (prev) => prev,
  })

  // ── Per-row status update ─────────────────────────────────────────────────────

  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusChange = async (orderId: string, orderNumber: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, { status: newStatus })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      showToast('success', `Order #${orderNumber} updated to ${newStatus}`)
    } catch {
      showToast('error', 'Failed to update order status. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  const orders     = data?.orders ?? []
  const pagination = data?.pagination

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Header */}
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 500,
          color: '#1C1A17',
          marginBottom: 24,
        }}
      >
        Orders
      </h1>

      {/* Filter bar */}
      <div
        style={{
          background: '#EDE8DC',
          border: '1px solid #E2DAC8',
          borderRadius: 4,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {/* Status tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            border: '1px solid #E2DAC8',
            borderRadius: 4,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {STATUS_TABS.map(tab => {
            const active = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  padding: '7px 12px',
                  background: active ? '#1C1A17' : '#F5F0E8',
                  border: 'none',
                  borderRight: '1px solid #E2DAC8',
                  fontFamily: FONT,
                  fontSize: 11,
                  color: active ? '#fff' : '#6B6057',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', whiteSpace: 'nowrap' }}>
            From
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ ...INPUT_BASE, width: 136 }}
          />
          <span style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', whiteSpace: 'nowrap' }}>
            To
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ ...INPUT_BASE, width: 136 }}
          />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9E9590',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Order number or customer email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...INPUT_BASE, paddingLeft: 28, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#EDE8DC',
          border: '1px solid #E2DAC8',
          borderRadius: 4,
          overflowX: 'auto',
        }}
      >
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>
            Loading orders…
          </div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#A85050' }}>
            Failed to load orders. Please try again.
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <ShoppingCart size={48} style={{ margin: '0 auto 16px', color: '#9E9590', display: 'block' }} />
            <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 500, color: '#1C1A17', marginBottom: 8, marginTop: 0 }}>
              No orders yet
            </h3>
            <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', marginBottom: 0, marginTop: 0 }}>
              Orders will appear here once customers start purchasing.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Order #</th>
                <th style={TH}>Customer</th>
                <th style={TH}>Date</th>
                <th style={TH}>Items</th>
                <th style={TH}>Total</th>
                <th style={TH}>Payment</th>
                <th style={TH}>Status</th>
                <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: Order) => (
                <tr
                  key={order._id}
                  onMouseEnter={e => {
                    const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                    cells.forEach(td => ((td as HTMLElement).style.background = '#F0EAF7'))
                  }}
                  onMouseLeave={e => {
                    const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                    cells.forEach(td => ((td as HTMLElement).style.background = 'transparent'))
                  }}
                >
                  {/* Order # */}
                  <td style={TD}>
                    <Link
                      to={`/admin/orders/${order._id}`}
                      style={{
                        fontFamily: FONT,
                        fontSize: 12,
                        color: '#7B5EA7',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
                      onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
                    >
                      {order.orderNumber}
                    </Link>
                  </td>

                  {/* Customer */}
                  <td style={TD}>
                    <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#1C1A17' }}>
                      {order.user.name}
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
                      {order.user.email}
                    </div>
                  </td>

                  {/* Date */}
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057', whiteSpace: 'nowrap' }}>
                      {fmtDate(order.createdAt)}
                    </span>
                  </td>

                  {/* Items */}
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                  </td>

                  {/* Total */}
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#C49A3C' }}>
                      {fmt(order.total)}
                    </span>
                  </td>

                  {/* Payment badge */}
                  <td style={TD}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 9px',
                        borderRadius: 12,
                        background: PAYMENT_STYLE[order.paymentStatus]?.bg ?? '#F3F4F6',
                        color: PAYMENT_STYLE[order.paymentStatus]?.color ?? '#6B7280',
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </td>

                  {/* Status dropdown */}
                  <td style={TD}>
                    <StatusDropdown
                      orderId={order._id}
                      current={order.status}
                      onSelect={(id, status) =>
                        handleStatusChange(id, order.orderNumber, status)
                      }
                      disabled={updatingId !== null && updatingId !== order._id}
                      isLoading={updatingId === order._id}
                    />
                  </td>

                  {/* Actions */}
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <Link
                      to={`/admin/orders/${order._id}`}
                      title="View detail"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: 4,
                        color: '#6B6057',
                        textDecoration: 'none',
                        border: '1px solid #E2DAC8',
                        background: 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e =>
                        ((e.currentTarget as HTMLAnchorElement).style.background = '#F5F0E8')
                      }
                      onMouseLeave={e =>
                        ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')
                      }
                    >
                      <Eye size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            padding: '10px 0',
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590' }}>
            {pagination.total} order{pagination.total !== 1 ? 's' : ''} · page {pagination.page} of {pagination.totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: '#EDE8DC',
                border: '1px solid #E2DAC8',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 12,
                color: pagination.hasPrev ? '#1C1A17' : '#C4B89A',
                cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
              }}
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: '#EDE8DC',
                border: '1px solid #E2DAC8',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 12,
                color: pagination.hasNext ? '#1C1A17' : '#C4B89A',
                cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
              }}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
