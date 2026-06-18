import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Package, MapPin, Clock, CreditCard, Loader2, CheckCircle, AlertCircle, Truck, ExternalLink } from 'lucide-react'
import {
  getOrderDetail,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '../../api/orders.api'
import {
  pushToShipRocket,
  generateLabel,
  syncTracking,
  cancelShipment,
} from '../../api/shipping.api'
import { useToast } from '../../store/toastStore'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif"

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  style,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: '#EDE8DC',
        border: '1px solid #E2DAC8',
        borderRadius: 4,
        ...style,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E2DAC8',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {icon && <span style={{ color: '#7B5EA7', display: 'flex' }}>{icon}</span>}
        <span
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#6B6057',
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

const fmtCheckpointDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

// ── Shipping & Fulfillment ────────────────────────────────────────────────────

function ShippingPanel({ order }: { order: Order }) {
  const qc = useQueryClient()
  const toast = useToast()

  const showCard = ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)
  if (!showCard) return null

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-order', order._id] })
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
  }

  const shipMutation = useMutation({
    mutationFn: () => pushToShipRocket(order._id),
    onSuccess: () => {
      toast.success('Order pushed to ShipRocket')
      invalidate()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Failed to push order to ShipRocket')
    },
  })

  const labelMutation = useMutation({
    mutationFn: () => generateLabel(order._id),
    onSuccess: () => {
      toast.success('Shipping label generated')
      invalidate()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Failed to generate label')
    },
  })

  const syncMutation = useMutation({
    mutationFn: () => syncTracking(order._id),
    onSuccess: () => {
      toast.success('Tracking synced')
      invalidate()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Failed to sync tracking')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelShipment(order._id),
    onSuccess: () => {
      toast.success('Shipment cancelled')
      invalidate()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Failed to cancel shipment')
    },
  })

  const busy = shipMutation.isPending || labelMutation.isPending || syncMutation.isPending || cancelMutation.isPending

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: '#7B5EA7', border: 'none', borderRadius: 4,
    fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#fff',
    cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
  }

  const btnSecondary: React.CSSProperties = {
    ...btnPrimary, background: '#F5F0E8', color: '#1C1A17', border: '1px solid #E2DAC8',
  }

  const btnDanger: React.CSSProperties = {
    ...btnPrimary, background: 'transparent', color: '#A85050', border: '1px solid #E2DAC8',
  }

  const statusLabel = order.awbCode
    ? (order.shiprocketStatus || order.aftershipStatus || 'In Transit')
    : order.shiprocketOrderId
      ? 'Awaiting AWB assignment'
      : 'Not yet dispatched'

  return (
    <SectionCard title="Shipping & Fulfillment" icon={<Truck size={14} />}>
      {!order.shiprocketOrderId ? (
        <>
          <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', margin: '0 0 16px' }}>
            Status: Not yet dispatched
          </p>
          <button
            style={btnPrimary}
            disabled={busy}
            onClick={() => shipMutation.mutate()}
          >
            {shipMutation.isPending && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            Push to ShipRocket
          </button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
              ShipRocket Order ID:{' '}
              <span style={{ color: '#1C1A17', fontWeight: 500 }}>{order.shiprocketOrderId}</span>
            </div>
            {order.awbCode && (
              <>
                <div style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                  AWB: <span style={{ color: '#1C1A17', fontWeight: 500 }}>{order.awbCode}</span>
                </div>
                {order.courierName && (
                  <div style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                    Courier: <span style={{ color: '#1C1A17', fontWeight: 500 }}>{order.courierName}</span>
                  </div>
                )}
              </>
            )}
            <div style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
              Status: <span style={{ color: '#7B5EA7', fontWeight: 500 }}>{statusLabel}</span>
            </div>
            {order.labelUrl && (
              <a
                href={order.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: FONT, fontSize: 12, color: '#7B5EA7', textDecoration: 'none',
                }}
              >
                View Label <ExternalLink size={12} />
              </a>
            )}
          </div>

          {order.trackingCheckpoints && order.trackingCheckpoints.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{
                fontFamily: FONT, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: '#9E9590', margin: '0 0 12px',
              }}>
                Tracking Timeline
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...order.trackingCheckpoints].reverse().map((cp, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#7B5EA7',
                      marginTop: 4, flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
                        {fmtCheckpointDate(cp.time)}
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#1C1A17' }}>
                        {cp.message}
                      </div>
                      {cp.location && (
                        <div style={{ fontFamily: FONT, fontSize: 11, color: '#6B6057' }}>
                          {cp.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {!order.awbCode && (
              <button style={btnPrimary} disabled={busy} onClick={() => labelMutation.mutate()}>
                {labelMutation.isPending && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                Generate Label
              </button>
            )}
            <button style={btnSecondary} disabled={busy} onClick={() => syncMutation.mutate()}>
              {syncMutation.isPending && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
              Sync Tracking
            </button>
            {order.status !== 'delivered' && (
              <button style={btnDanger} disabled={busy} onClick={() => cancelMutation.mutate()}>
                {cancelMutation.isPending && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                Cancel Shipment
              </button>
            )}
          </div>
        </>
      )}
    </SectionCard>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ['admin-order', id],
    queryFn: () => getOrderDetail(id!),
    enabled: !!id,
  })

  // ── Status update form state ──────────────────────────────────────────────────
  const [formStatus, setFormStatus]         = useState<OrderStatus>('placed')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [note, setNote]                     = useState('')
  const [formError, setFormError]           = useState('')

  const [toast, setToast]   = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimer          = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, message })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // Sync form when order loads (but not on every re-fetch to preserve edits)
  useEffect(() => {
    if (order) {
      setFormStatus(order.status)
      setTrackingNumber(order.trackingNumber ?? '')
    }
  }, [order?._id])

  const statusMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateOrderStatus>[1]) =>
      updateOrderStatus(id!, payload),
    onSuccess: (_data, variables) => {
      setNote('')
      setFormError('')
      showToast('success', `Order #${order?.orderNumber} updated to ${variables.status}`)
      qc.invalidateQueries({ queryKey: ['admin-order', id] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
    },
    onError: () => {
      if (order) setFormStatus(order.status)
      showToast('error', 'Failed to update order status. Please try again.')
    },
  })

  const handleStatusUpdate = () => {
    setFormError('')
    if (formStatus === 'shipped' && !trackingNumber.trim()) {
      setFormError('Tracking number is required when status is Shipped.')
      return
    }
    statusMutation.mutate({
      status: formStatus,
      note: note.trim() || undefined,
      trackingNumber: trackingNumber.trim() || undefined,
    })
  }

  // ── Loading / error states ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>
        Loading order…
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#A85050' }}>
        Order not found or failed to load.
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/admin/orders')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONT,
            fontSize: 12,
            color: '#6B6057',
            padding: 0,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#1C1A17')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#6B6057')}
        >
          <ArrowLeft size={14} />
          Orders
        </button>
        <span style={{ color: '#C4B89A', fontFamily: FONT, fontSize: 13 }}>/</span>
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#7B5EA7' }}>
          {order.orderNumber}
        </span>
        <span
          style={{
            marginLeft: 4,
            padding: '3px 10px',
            borderRadius: 12,
            background: STATUS_STYLE[order.status].bg,
            color: STATUS_STYLE[order.status].color,
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {capitalize(order.status)}
        </span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Left — 65% */}
        <div style={{ flex: '0 0 65%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Order items table */}
          <SectionCard title="Order Items" icon={<Package size={14} />}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Image', 'Product', 'SKU', 'Qty', 'Unit Price', 'Line Total'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '6px 8px',
                        fontFamily: FONT,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: '#9E9590',
                        textAlign: h === 'Line Total' ? 'right' : 'left',
                        borderBottom: '1px solid #E2DAC8',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2DAC8' }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: 'cover',
                            borderRadius: 3,
                            border: '1px solid #E2DAC8',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 3,
                            border: '1px solid #E2DAC8',
                            background: '#F5F0E8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#C4B89A',
                            fontSize: 9,
                            fontFamily: FONT,
                          }}
                        >
                          No img
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2DAC8' }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#1C1A17' }}>
                        {item.name}
                      </span>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2DAC8' }}>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
                        {item.sku}
                      </span>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2DAC8' }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2DAC8' }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                        {fmt(item.price)}
                      </span>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2DAC8', textAlign: 'right' }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#1C1A17' }}>
                        {fmt(item.price * item.quantity)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          {/* Shipping address */}
          <SectionCard title="Shipping Address" icon={<MapPin size={14} />}>
            <div style={{ fontFamily: FONT, fontSize: 13, color: '#1C1A17', fontWeight: 500, marginBottom: 4 }}>
              {order.shippingAddress.fullName}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057', lineHeight: 1.7 }}>
              {order.shippingAddress.phone}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057', lineHeight: 1.7 }}>
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057', lineHeight: 1.7 }}>
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </div>
            {order.trackingNumber && (
              <div
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  background: '#E0F2FE',
                  borderRadius: 4,
                  fontFamily: FONT,
                  fontSize: 12,
                  color: '#0369A1',
                }}
              >
                Tracking: <strong>{order.trackingNumber}</strong>
              </div>
            )}
          </SectionCard>

          {/* Order timeline */}
          <SectionCard title="Order Timeline" icon={<Clock size={14} />}>
            {order.statusHistory.length === 0 ? (
              <p style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590' }}>No history yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[...order.statusHistory].reverse().map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 12,
                      position: 'relative',
                      paddingBottom: i < order.statusHistory.length - 1 ? 16 : 0,
                    }}
                  >
                    {/* Dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: STATUS_STYLE[entry.status as OrderStatus]?.color ?? '#9E9590',
                          border: '2px solid #EDE8DC',
                          outline: `2px solid ${STATUS_STYLE[entry.status as OrderStatus]?.color ?? '#9E9590'}`,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                      {i < order.statusHistory.length - 1 && (
                        <div
                          style={{ width: 1, flex: 1, background: '#E2DAC8', marginTop: 4 }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ paddingBottom: 4 }}>
                      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#1C1A17' }}>
                        {capitalize(entry.status)}
                      </div>
                      {entry.note && (
                        <div style={{ fontFamily: FONT, fontSize: 11, color: '#6B6057', marginTop: 2 }}>
                          {entry.note}
                        </div>
                      )}
                      <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
                        {fmtDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right — 35% */}
        <div style={{ flex: '0 0 35%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Order summary */}
          <SectionCard title="Order Summary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Subtotal', value: fmt(order.subtotal) },
                { label: 'Discount', value: order.discount > 0 ? `−${fmt(order.discount)}` : '—', color: order.discount > 0 ? '#5A8A6A' : undefined },
                { label: 'Shipping', value: order.shippingCharge === 0 ? 'Free' : fmt(order.shippingCharge) },
                { label: 'Tax', value: order.tax > 0 ? fmt(order.tax) : '—' },
              ].map(row => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>{row.label}</span>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: row.color ?? '#1C1A17' }}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div
                style={{
                  borderTop: '1px solid #E2DAC8',
                  marginTop: 4,
                  paddingTop: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#1C1A17' }}>
                  Total
                </span>
                <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: '#C49A3C' }}>
                  {fmt(order.total)}
                </span>
              </div>
            </div>

            {/* Coupon */}
            {order.couponCode && (
              <div
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  background: '#FEF9EC',
                  borderRadius: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: 11, color: '#6B6057' }}>Coupon applied</span>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#C49A3C',
                    letterSpacing: '0.05em',
                  }}
                >
                  {order.couponCode}
                </span>
              </div>
            )}
          </SectionCard>

          <ShippingPanel order={order} />

          {/* Payment info */}
          <SectionCard title="Payment" icon={<CreditCard size={14} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>Method</span>
                <span style={{ fontFamily: FONT, fontSize: 12, color: '#1C1A17', fontWeight: 500 }}>
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>Status</span>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 500,
                    color:
                      order.paymentStatus === 'paid' ? '#5A8A6A'
                      : order.paymentStatus === 'failed' ? '#A85050'
                      : '#C49A3C',
                    textTransform: 'capitalize',
                  }}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.razorpayOrderId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4, borderTop: '1px solid #E2DAC8' }}>
                  <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9E9590' }}>
                    Razorpay Order ID
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: 11, color: '#6B6057', wordBreak: 'break-all' }}>
                    {order.razorpayOrderId}
                  </span>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9E9590' }}>
                    Razorpay Payment ID
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: 11, color: '#6B6057', wordBreak: 'break-all' }}>
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Status update panel */}
          <div
            style={{
              background: '#EDE8DC',
              border: '1px solid #E2DAC8',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #E2DAC8',
              }}
            >
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: '#6B6057',
                }}
              >
                Update Status
              </span>
            </div>

            {/* Card body — slightly darker background */}
            <div
              style={{
                background: '#EDE8DC',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Status select */}
              <div>
                <label
                  style={{ display: 'block', fontFamily: FONT, fontSize: 11, color: '#6B6057', marginBottom: 5 }}
                >
                  Status
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={formStatus}
                    onChange={e => {
                      setFormStatus(e.target.value as OrderStatus)
                      setFormError('')
                    }}
                    disabled={statusMutation.isPending}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      background: '#F5F0E8',
                      border: '1px solid #E2DAC8',
                      borderRadius: 4,
                      fontFamily: FONT,
                      fontSize: 12,
                      color: '#1C1A17',
                      outline: 'none',
                      cursor: statusMutation.isPending ? 'not-allowed' : 'pointer',
                      opacity: statusMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{capitalize(s)}</option>
                    ))}
                  </select>
                  {statusMutation.isPending && (
                    <Loader2
                      size={15}
                      style={{ animation: 'spin 1s linear infinite', color: '#7B5EA7', flexShrink: 0 }}
                    />
                  )}
                </div>
              </div>

              {/* Tracking number (only for shipped) */}
              {formStatus === 'shipped' && (
                <div>
                  <label
                    style={{ display: 'block', fontFamily: FONT, fontSize: 11, color: '#6B6057', marginBottom: 5 }}
                  >
                    Tracking Number <span style={{ color: '#A85050' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => { setTrackingNumber(e.target.value); setFormError('') }}
                    placeholder="e.g. DTDC123456789"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#F5F0E8',
                      border: `1px solid ${formError ? '#A85050' : '#E2DAC8'}`,
                      borderRadius: 4,
                      fontFamily: FONT,
                      fontSize: 12,
                      color: '#1C1A17',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Note */}
              <div>
                <label
                  style={{ display: 'block', fontFamily: FONT, fontSize: 11, color: '#6B6057', marginBottom: 5 }}
                >
                  Note <span style={{ color: '#C4B89A' }}>(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Internal note about this status change…"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#F5F0E8',
                    border: '1px solid #E2DAC8',
                    borderRadius: 4,
                    fontFamily: FONT,
                    fontSize: 12,
                    color: '#1C1A17',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Validation error */}
              {formError && (
                <p style={{ fontFamily: FONT, fontSize: 12, color: '#A85050', margin: 0 }}>
                  {formError}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleStatusUpdate}
                disabled={statusMutation.isPending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  background: statusMutation.isPending ? '#D4B86A' : '#C49A3C',
                  border: 'none',
                  borderRadius: 4,
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#fff',
                  cursor: statusMutation.isPending ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'background 0.15s',
                  alignSelf: 'flex-start',
                }}
                onMouseEnter={e => {
                  if (!statusMutation.isPending)
                    (e.currentTarget as HTMLButtonElement).style.background = '#B5891E'
                }}
                onMouseLeave={e => {
                  if (!statusMutation.isPending)
                    (e.currentTarget as HTMLButtonElement).style.background = '#C49A3C'
                }}
              >
                {statusMutation.isPending && (
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                )}
                {statusMutation.isPending ? 'Updating…' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
