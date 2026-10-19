import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Truck } from 'lucide-react'
import {
  getShippingProviders,
  updateShippingProvider,
  setDefaultShippingProvider,
  testShippingProviderConnection,
  type ShippingProvider,
} from '../../api/shippingProviders.api'
import { useToast } from '../../store/toastStore'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "var(--font-body)"

const INPUT_BASE: React.CSSProperties = {
  padding: '8px 10px',
  background: '#F5F0E8',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  fontFamily: FONT,
  fontSize: 13,
  color: '#1C1A17',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const LABEL: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 600,
  color: '#6B6057',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: 6,
}

// ── ActiveToggle ──────────────────────────────────────────────────────────────

function ActiveToggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 999, border: '1px solid #E2DAC8',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: value ? '#F2F4F8' : '#F4EFE7',
        color: value ? '#4F5B67' : '#7C736A',
        fontFamily: FONT, fontSize: 12, fontWeight: 500,
        opacity: disabled ? 0.6 : 1,
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: value ? '#6BBF9A' : '#D7C6AA',
          boxShadow: value ? '0 0 0 3px rgba(107, 191, 154, 0.18)' : '0 0 0 3px rgba(215, 198, 170, 0.18)',
          flexShrink: 0,
        }}
      />
      {value ? 'Active' : 'Inactive'}
    </button>
  )
}

// ── Credentials form (per provider — small fixed set, not schema-driven) ──────

interface CredentialsDrawerProps {
  open: boolean
  provider: ShippingProvider | null
  onClose: () => void
  onSave: (id: string, credentials: Record<string, string | number>) => void
  isPending: boolean
}

function CredentialsDrawer({ open, provider, onClose, onSave, isPending }: CredentialsDrawerProps) {
  const [shiprocket, setShiprocket] = useState({
    email: '', password: '', channelId: '', pickupLocation: '',
    defaultWeight: '', defaultLength: '', defaultBreadth: '', defaultHeight: '',
  })
  const [aftership, setAftership] = useState({ apiKey: '' })

  useEffect(() => {
    if (open) {
      setShiprocket({
        email: '', password: '', channelId: '', pickupLocation: '',
        defaultWeight: '', defaultLength: '', defaultBreadth: '', defaultHeight: '',
      })
      setAftership({ apiKey: '' })
    }
  }, [open, provider?._id])

  if (!provider) return null

  const handleSave = () => {
    if (provider.slug === 'shiprocket') {
      const creds: Record<string, string | number> = {
        email: shiprocket.email,
        password: shiprocket.password,
      }
      if (shiprocket.channelId) creds.channelId = shiprocket.channelId
      if (shiprocket.pickupLocation) creds.pickupLocation = shiprocket.pickupLocation
      if (shiprocket.defaultWeight) creds.defaultWeight = Number(shiprocket.defaultWeight)
      if (shiprocket.defaultLength) creds.defaultLength = Number(shiprocket.defaultLength)
      if (shiprocket.defaultBreadth) creds.defaultBreadth = Number(shiprocket.defaultBreadth)
      if (shiprocket.defaultHeight) creds.defaultHeight = Number(shiprocket.defaultHeight)
      onSave(provider._id, creds)
    } else {
      onSave(provider._id, { apiKey: aftership.apiKey })
    }
  }

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.4)', zIndex: 100 }} />
      )}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: 420,
          background: '#F5F0E8', borderLeft: '1px solid #E2DAC8', zIndex: 101,
          boxShadow: '-4px 0 24px rgba(28,26,23,0.12)', display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2DAC8' }}>
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: '#1C1A17' }}>
            Edit {provider.name} Credentials
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {provider.slug === 'shiprocket' ? (
            <>
              <div>
                <label style={LABEL}>Email</label>
                <input style={INPUT_BASE} value={shiprocket.email} onChange={e => setShiprocket(s => ({ ...s, email: e.target.value }))} placeholder="account@example.com" />
              </div>
              <div>
                <label style={LABEL}>Password</label>
                <input type="password" style={INPUT_BASE} value={shiprocket.password} onChange={e => setShiprocket(s => ({ ...s, password: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL}>Channel ID <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
                <input style={INPUT_BASE} value={shiprocket.channelId} onChange={e => setShiprocket(s => ({ ...s, channelId: e.target.value }))} />
              </div>
              <div>
                <label style={LABEL}>Pickup Location</label>
                <input style={INPUT_BASE} value={shiprocket.pickupLocation} onChange={e => setShiprocket(s => ({ ...s, pickupLocation: e.target.value }))} placeholder="Primary" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={LABEL}>Default Weight (kg)</label>
                  <input style={INPUT_BASE} value={shiprocket.defaultWeight} onChange={e => setShiprocket(s => ({ ...s, defaultWeight: e.target.value }))} placeholder="0.5" />
                </div>
                <div>
                  <label style={LABEL}>Default Length (cm)</label>
                  <input style={INPUT_BASE} value={shiprocket.defaultLength} onChange={e => setShiprocket(s => ({ ...s, defaultLength: e.target.value }))} placeholder="10" />
                </div>
                <div>
                  <label style={LABEL}>Default Breadth (cm)</label>
                  <input style={INPUT_BASE} value={shiprocket.defaultBreadth} onChange={e => setShiprocket(s => ({ ...s, defaultBreadth: e.target.value }))} placeholder="10" />
                </div>
                <div>
                  <label style={LABEL}>Default Height (cm)</label>
                  <input style={INPUT_BASE} value={shiprocket.defaultHeight} onChange={e => setShiprocket(s => ({ ...s, defaultHeight: e.target.value }))} placeholder="10" />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label style={LABEL}>API Key</label>
              <input style={INPUT_BASE} value={aftership.apiKey} onChange={e => setAftership({ apiKey: e.target.value })} placeholder="AfterShip Shipping API key" />
            </div>
          )}
          <p style={{ fontFamily: FONT, fontSize: 13, color: '#9E9590', margin: 0 }}>
            Credentials are encrypted before being stored and are never shown again after saving.
          </p>
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #E2DAC8', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #E2DAC8', borderRadius: 4, fontFamily: FONT, fontSize: 13, color: '#6B6057', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{ padding: '8px 16px', background: '#7B5EA7', border: 'none', borderRadius: 4, fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Saving…' : 'Save Credentials'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShippingProvidersPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [editing, setEditing] = useState<ShippingProvider | null>(null)

  const { data: providers, isLoading } = useQuery({
    queryKey: ['admin-shipping-providers'],
    queryFn: getShippingProviders,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-shipping-providers'] })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateShippingProvider(id, { isActive }),
    onSuccess: () => { invalidate(); toast.success('Provider updated') },
    onError: () => toast.error('Failed to update provider'),
  })

  const credentialsMutation = useMutation({
    mutationFn: ({ id, credentials }: { id: string; credentials: Record<string, string | number> }) =>
      updateShippingProvider(id, { credentials }),
    onSuccess: () => { invalidate(); toast.success('Credentials saved'); setEditing(null) },
    onError: () => toast.error('Failed to save credentials'),
  })

  const defaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultShippingProvider(id),
    onSuccess: () => { invalidate(); toast.success('Default provider updated') },
    onError: () => toast.error('Failed to set default provider'),
  })

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => testShippingProviderConnection(id),
    onSuccess: () => { invalidate(); toast.success('Provider connection verified') },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || 'Provider connection test failed')
    },
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, color: '#7B5EA7' }}>
          <Truck size={18} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, color: '#1C1A17', margin: 0 }}>
          Shipping Providers
        </h1>
      </div>

      {isLoading ? (
        <p style={{ fontFamily: FONT, fontSize: 13, color: '#9E9590', paddingTop: 8 }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, maxWidth: 760, alignItems: 'stretch' }}>
          {(providers ?? []).map(p => (
            <div
              key={p._id}
              style={{
                background: '#EFEAE0',
                border: '1px solid #DBD1BF',
                borderRadius: 12,
                padding: '18px 18px 14px',
                minHeight: 166,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 0 rgba(28,26,23,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: '#1C1A17', marginBottom: 4 }}>{p.name}</div>
                  {p.description && (
                    <div style={{ fontFamily: FONT, fontSize: 13, color: '#7E7269', lineHeight: 1.45 }}>{p.description}</div>
                  )}
                </div>
                {p.isDefault && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, background: '#F5E8C6', color: '#8A6A1F',
                    fontFamily: FONT, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                    border: '1px solid rgba(138, 106, 31, 0.15)'
                  }}>
                    Default
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 10, minHeight: 20 }}>
                <ActiveToggle
                  value={p.isActive}
                  disabled={toggleMutation.isPending || (!p.isActive && !p.isVerified)}
                  onChange={(v) => toggleMutation.mutate({ id: p._id, isActive: v })}
                />
                {!p.hasCredentials && (
                  <span style={{ fontFamily: FONT, fontSize: 12, color: '#8A6C67' }}>No credentials</span>
                )}
                {p.hasCredentials && (
                  <span style={{ fontFamily: FONT, fontSize: 12, color: p.isVerified ? '#467B5D' : '#8A6C67' }}>
                    {p.isVerified ? 'Connection verified' : 'Test connection required'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => testConnectionMutation.mutate(p._id)}
                  disabled={!p.hasCredentials || testConnectionMutation.isPending}
                  style={{
                    padding: '7px 12px', background: '#F5F0E8', border: '1px solid #D7CDBE', borderRadius: 6,
                    fontFamily: FONT, fontSize: 13, color: '#1C1A17',
                    cursor: !p.hasCredentials || testConnectionMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: !p.hasCredentials || testConnectionMutation.isPending ? 0.6 : 1,
                    minWidth: 92,
                  }}
                >
                  {testConnectionMutation.isPending ? 'Testing…' : 'Test'}
                </button>
                <button
                  onClick={() => setEditing(p)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px',
                    background: '#F5F0E8', border: '1px solid #D7CDBE', borderRadius: 6,
                    fontFamily: FONT, fontSize: 13, color: '#1C1A17', cursor: 'pointer',
                    minWidth: 92,
                  }}
                >
                  <Pencil size={12} /> Edit
                </button>
                {!p.isDefault && (
                  <button
                    onClick={() => defaultMutation.mutate(p._id)}
                    disabled={defaultMutation.isPending}
                    style={{
                      padding: '7px 12px', background: '#F5F0E8', border: '1px solid #D7CDBE', borderRadius: 6,
                      fontFamily: FONT, fontSize: 13, color: '#1C1A17', cursor: 'pointer',
                      minWidth: 92,
                    }}
                  >
                    Set
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CredentialsDrawer
        open={!!editing}
        provider={editing}
        onClose={() => setEditing(null)}
        onSave={(id, credentials) => credentialsMutation.mutate({ id, credentials })}
        isPending={credentialsMutation.isPending}
      />
    </div>
  )
}
