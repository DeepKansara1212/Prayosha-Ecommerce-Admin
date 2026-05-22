import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, X } from 'lucide-react'
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  type Coupon,
  type CreateCouponPayload,
} from '../../api/coupons.api'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif"

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

const INPUT_BASE: React.CSSProperties = {
  padding: '8px 10px',
  background: '#F5F0E8',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  fontFamily: FONT,
  fontSize: 12,
  color: '#1C1A17',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 11,
  fontWeight: 600,
  color: '#6B6057',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  display: 'block',
  marginBottom: 6,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

const isExpired = (validUntil: string) => new Date(validUntil) < new Date()

// ── CopyCode ──────────────────────────────────────────────────────────────────

function CopyCode({ code, muted }: { code: string; muted: boolean }) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          color: muted ? '#9E9590' : '#1C1A17',
          letterSpacing: '0.04em',
        }}
      >
        {code}
      </span>
      {(hovered || copied) && (
        <button
          onClick={handleCopy}
          title="Copy code"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: copied ? '#5A8A6A' : '#9E9590',
            display: 'inline-flex',
            alignItems: 'center',
            padding: 0,
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      )}
    </div>
  )
}

// ── ActiveToggle ──────────────────────────────────────────────────────────────

function ActiveToggle({
  couponId,
  isActive,
  onToggle,
  disabled,
}: {
  couponId: string
  isActive: boolean
  onToggle: (id: string, active: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onToggle(couponId, !isActive)}
      title={isActive ? 'Deactivate' : 'Activate'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 12,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: isActive ? '#ECFDF5' : '#F3F4F6',
        color: isActive ? '#5A8A6A' : '#9E9590',
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 500,
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: isActive ? '#5A8A6A' : '#9E9590',
          flexShrink: 0,
        }}
      />
      {isActive ? 'Active' : 'Inactive'}
    </button>
  )
}

// ── CreateCouponDrawer ────────────────────────────────────────────────────────

const BLANK_FORM: CreateCouponPayload = {
  code: '',
  discountType: 'flat',
  discountValue: 0,
  minOrderValue: 0,
  maxUsage: 100,
  validFrom: '',
  validUntil: '',
}

function CreateCouponDrawer({
  open,
  onClose,
  onCreate,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onCreate: (data: CreateCouponPayload) => void
  isPending: boolean
}) {
  const [form, setForm] = useState<CreateCouponPayload>(BLANK_FORM)

  const set = (field: keyof CreateCouponPayload, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    if (!open) setForm(BLANK_FORM)
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(form)
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,26,23,0.4)',
            zIndex: 100,
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 400,
          background: '#F5F0E8',
          borderLeft: '1px solid #E2DAC8',
          zIndex: 101,
          boxShadow: '-4px 0 24px rgba(28,26,23,0.12)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            height: 64,
            borderBottom: '1px solid #E2DAC8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 500,
              color: '#1C1A17',
            }}
          >
            Create Coupon
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9E9590',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Code */}
          <div>
            <label style={LABEL_STYLE}>Code</label>
            <input
              type="text"
              required
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              style={INPUT_BASE}
            />
          </div>

          {/* Discount Type */}
          <div>
            <label style={LABEL_STYLE}>Discount Type</label>
            <div style={{ display: 'flex', gap: 20 }}>
              {(['flat', 'percent'] as const).map(type => (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontFamily: FONT,
                    fontSize: 13,
                    color: '#1C1A17',
                  }}
                >
                  <input
                    type="radio"
                    name="discountType"
                    value={type}
                    checked={form.discountType === type}
                    onChange={() => set('discountType', type)}
                    style={{ accentColor: '#7B5EA7' }}
                  />
                  {type === 'flat' ? 'Flat ₹' : 'Percent %'}
                </label>
              ))}
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <label style={LABEL_STYLE}>Discount Value</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: FONT,
                  fontSize: 12,
                  color: '#9E9590',
                  pointerEvents: 'none',
                }}
              >
                {form.discountType === 'flat' ? '₹' : '%'}
              </span>
              <input
                type="number"
                required
                min={1}
                value={form.discountValue || ''}
                onChange={e => set('discountValue', Number(e.target.value))}
                style={{ ...INPUT_BASE, paddingLeft: 24 }}
              />
            </div>
          </div>

          {/* Min Order Value */}
          <div>
            <label style={LABEL_STYLE}>Min Order Value</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: FONT,
                  fontSize: 12,
                  color: '#9E9590',
                  pointerEvents: 'none',
                }}
              >
                ₹
              </span>
              <input
                type="number"
                min={0}
                value={form.minOrderValue || ''}
                onChange={e => set('minOrderValue', Number(e.target.value))}
                style={{ ...INPUT_BASE, paddingLeft: 24 }}
              />
            </div>
          </div>

          {/* Max Usage */}
          <div>
            <label style={LABEL_STYLE}>Max Usage</label>
            <input
              type="number"
              required
              min={1}
              value={form.maxUsage || ''}
              onChange={e => set('maxUsage', Number(e.target.value))}
              style={INPUT_BASE}
            />
          </div>

          {/* Valid From */}
          <div>
            <label style={LABEL_STYLE}>Valid From</label>
            <input
              type="date"
              required
              value={form.validFrom}
              onChange={e => set('validFrom', e.target.value)}
              style={INPUT_BASE}
            />
          </div>

          {/* Valid Until */}
          <div>
            <label style={LABEL_STYLE}>Valid Until</label>
            <input
              type="date"
              required
              value={form.validUntil}
              onChange={e => set('validUntil', e.target.value)}
              style={INPUT_BASE}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              background: isPending ? '#C4B89A' : '#C49A3C',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.15s',
            }}
          >
            {isPending ? 'Creating…' : 'Create Coupon'}
          </button>
        </form>
      </div>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: getCoupons,
  })

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      setDrawerOpen(false)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCoupon(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })

  const coupons = data ?? []

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 500,
            color: '#1C1A17',
            margin: 0,
          }}
        >
          Coupons
        </h1>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            padding: '8px 18px',
            background: '#C49A3C',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLButtonElement).style.background = '#B8892E')
          }
          onMouseLeave={e =>
            ((e.currentTarget as HTMLButtonElement).style.background = '#C49A3C')
          }
        >
          + Create Coupon
        </button>
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
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 13,
              color: '#9E9590',
            }}
          >
            Loading coupons…
          </div>
        ) : isError ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 13,
              color: '#A85050',
            }}
          >
            Failed to load coupons. Please try again.
          </div>
        ) : coupons.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 13,
              color: '#9E9590',
            }}
          >
            No coupons yet. Create your first coupon above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Code</th>
                <th style={TH}>Type</th>
                <th style={TH}>Value</th>
                <th style={TH}>Min Order</th>
                <th style={TH}>Usage</th>
                <th style={TH}>Valid Until</th>
                <th style={TH}>Active</th>
                <th style={{ ...TH, textAlign: 'right' as const }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: Coupon) => {
                const expired = isExpired(coupon.validUntil)
                const subColor = expired ? '#9E9590' : '#6B6057'

                return (
                  <tr
                    key={coupon._id}
                    onMouseEnter={e => {
                      const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                      cells.forEach(td => ((td as HTMLElement).style.background = '#F0EAF7'))
                    }}
                    onMouseLeave={e => {
                      const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                      cells.forEach(td => ((td as HTMLElement).style.background = 'transparent'))
                    }}
                  >
                    {/* Code */}
                    <td style={TD}>
                      <CopyCode code={coupon.code} muted={expired} />
                    </td>

                    {/* Type */}
                    <td style={TD}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: 12,
                          background:
                            coupon.discountType === 'flat' ? '#E8F0F7' : '#F0EAF7',
                          color:
                            coupon.discountType === 'flat' ? '#4A7A9B' : '#7B5EA7',
                          fontFamily: FONT,
                          fontSize: 11,
                          fontWeight: 500,
                          opacity: expired ? 0.5 : 1,
                        }}
                      >
                        {coupon.discountType === 'flat' ? 'FLAT ₹' : 'PERCENT %'}
                      </span>
                    </td>

                    {/* Value */}
                    <td style={TD}>
                      <span
                        style={{
                          fontFamily: FONT,
                          fontSize: 13,
                          fontWeight: 500,
                          color: expired ? '#9E9590' : '#1C1A17',
                        }}
                      >
                        {coupon.discountType === 'flat'
                          ? `₹${coupon.discountValue}`
                          : `${coupon.discountValue}%`}
                      </span>
                    </td>

                    {/* Min Order */}
                    <td style={TD}>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: subColor }}>
                        ₹{coupon.minOrderValue.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Usage */}
                    <td style={TD}>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: subColor }}>
                        {coupon.usedCount} / {coupon.maxUsage}
                      </span>
                    </td>

                    {/* Valid Until */}
                    <td style={TD}>
                      <span
                        style={{
                          fontFamily: FONT,
                          fontSize: 12,
                          color: expired ? '#A85050' : subColor,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fmtDate(coupon.validUntil)}
                        {expired && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#A85050',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Expired
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Active toggle */}
                    <td style={TD}>
                      <ActiveToggle
                        couponId={coupon._id}
                        isActive={coupon.isActive}
                        onToggle={(id, active) =>
                          toggleMutation.mutate({ id, isActive: active })
                        }
                        disabled={toggleMutation.isPending}
                      />
                    </td>

                    {/* Actions */}
                    <td style={{ ...TD, textAlign: 'right' as const }} />
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Coupon Drawer */}
      <CreateCouponDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={payload => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />
    </div>
  )
}
