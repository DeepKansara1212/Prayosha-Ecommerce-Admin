import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { getRashis } from '../../api/rashis.api'
import {
  getRashiProductMappings,
  createRashiProductMapping,
  updateRashiProductMapping,
  deleteRashiProductMapping,
  type RashiProductMapping,
} from '../../api/rashiProductMappings.api'
import { getProducts } from '../../api/products.api'
import { useToast } from '../../store/toastStore'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif"

const TH: React.CSSProperties = {
  padding: '10px 12px', fontFamily: FONT, fontSize: 10, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9E9590',
  textAlign: 'left', borderBottom: '1px solid #E2DAC8', background: '#EDE8DC', whiteSpace: 'nowrap',
}

const TD: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #E2DAC8', verticalAlign: 'middle' }

const INPUT_BASE: React.CSSProperties = {
  padding: '8px 10px', background: '#F5F0E8', border: '1px solid #E2DAC8', borderRadius: 4,
  fontFamily: FONT, fontSize: 12, color: '#1C1A17', outline: 'none',
}

const LABEL: React.CSSProperties = {
  fontFamily: FONT, fontSize: 11, fontWeight: 600, color: '#6B6057',
  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6,
}

// ── ActiveToggle ──────────────────────────────────────────────────────────────

function ActiveToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 12,
        border: 'none', cursor: 'pointer', background: value ? '#ECFDF5' : '#F3F4F6',
        color: value ? '#5A8A6A' : '#9E9590', fontFamily: FONT, fontSize: 11, fontWeight: 500,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: value ? '#5A8A6A' : '#9E9590', flexShrink: 0 }} />
      {value ? 'Active' : 'Inactive'}
    </button>
  )
}

// ── DeleteButton ──────────────────────────────────────────────────────────────

function DeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = () => {
    if (confirming) {
      onConfirm()
      setConfirming(false)
    } else {
      setConfirming(true)
      timerRef.current = setTimeout(() => setConfirming(false), 3000)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={confirming ? 'Click again to confirm remove' : 'Remove mapping'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: confirming ? 'auto' : 30, height: 30, padding: confirming ? '0 10px' : '0',
        borderRadius: 4, border: '1px solid', borderColor: confirming ? '#A85050' : '#E2DAC8',
        background: confirming ? '#FEF2F2' : 'transparent', color: confirming ? '#A85050' : '#9E9590',
        fontFamily: FONT, fontSize: 11, fontWeight: confirming ? 500 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', gap: 4,
      }}
    >
      {confirming ? 'Confirm?' : <Trash2 size={13} />}
    </button>
  )
}

// ── PriorityInput ─────────────────────────────────────────────────────────────

function PriorityInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState(String(value))
  useEffect(() => setLocal(String(value)), [value])
  return (
    <input
      type="number"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const n = Number(local)
        if (!Number.isNaN(n) && n !== value) onCommit(n)
      }}
      style={{ ...INPUT_BASE, width: 64 }}
    />
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RashiProductMappingsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [selectedRashi, setSelectedRashi] = useState('')
  const [newProduct, setNewProduct] = useState('')
  const [newPriority, setNewPriority] = useState(0)

  const { data: rashis } = useQuery({ queryKey: ['admin-rashis'], queryFn: getRashis })
  const { data: productsResponse } = useQuery({
    queryKey: ['admin-products-picker'],
    queryFn: () => getProducts({ limit: 48 }),
  })
  const products = productsResponse?.products ?? []

  const { data: mappings, isLoading } = useQuery({
    queryKey: ['admin-rashi-mappings', selectedRashi],
    queryFn: () => getRashiProductMappings({ rashi: selectedRashi }),
    enabled: !!selectedRashi,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-rashi-mappings', selectedRashi] })

  const createMutation = useMutation({
    mutationFn: createRashiProductMapping,
    onSuccess: () => {
      invalidate()
      setNewProduct('')
      setNewPriority(0)
      toast.success('Product mapped to Rashi')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add mapping'
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ priority: number; active: boolean }> }) =>
      updateRashiProductMapping(id, data),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update mapping'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRashiProductMapping,
    onSuccess: () => {
      invalidate()
      toast.success('Mapping removed')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to remove mapping'
      toast.error(msg)
    },
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRashi || !newProduct) return
    createMutation.mutate({ rashi: selectedRashi, product: newProduct, priority: newPriority, active: true })
  }

  return (
    <div>
      <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 500, color: '#1C1A17', marginTop: 0, marginBottom: 8 }}>
        Rashi → Bracelet Mappings
      </h1>
      <p style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590', marginTop: 0, marginBottom: 20 }}>
        Choose a Rashi, then manage which bracelet products the calculator recommends for it.
      </p>

      <div style={{ marginBottom: 20, maxWidth: 320 }}>
        <label style={LABEL}>Rashi</label>
        <select value={selectedRashi} onChange={e => setSelectedRashi(e.target.value)} style={{ ...INPUT_BASE, width: '100%' }}>
          <option value="">Select a Rashi…</option>
          {(rashis ?? []).map(r => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
      </div>

      {selectedRashi && (
        <>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <label style={LABEL}>Product</label>
              <select value={newProduct} onChange={e => setNewProduct(e.target.value)} style={{ ...INPUT_BASE, width: 280 }}>
                <option value="">Select a product…</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL}>Priority</label>
              <input type="number" value={newPriority} onChange={e => setNewPriority(Number(e.target.value))} style={{ ...INPUT_BASE, width: 80 }} />
            </div>
            <button
              type="submit"
              disabled={!newProduct || createMutation.isPending}
              style={{
                padding: '8px 18px', background: !newProduct || createMutation.isPending ? '#C4B89A' : '#C49A3C',
                color: '#fff', border: 'none', borderRadius: 4, fontFamily: FONT, fontSize: 13,
                fontWeight: 500, cursor: !newProduct || createMutation.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              + Add Mapping
            </button>
          </form>

          <div style={{ background: '#EDE8DC', border: '1px solid #E2DAC8', borderRadius: 4, overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>Loading mappings…</div>
            ) : (mappings ?? []).length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>No products mapped to this Rashi yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>Product</th>
                    <th style={TH}>Price</th>
                    <th style={TH}>Stock</th>
                    <th style={TH}>Priority</th>
                    <th style={TH}>Status</th>
                    <th style={{ ...TH, textAlign: 'right' as const }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(mappings as RashiProductMapping[]).map(m => (
                    <tr key={m._id}>
                      <td style={TD}>
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>{m.product?.name ?? '—'}</span>
                      </td>
                      <td style={TD}><span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>₹{m.product?.price}</span></td>
                      <td style={TD}>
                        <span style={{ fontFamily: FONT, fontSize: 12, color: m.product?.stock > 0 ? '#6B6057' : '#A85050' }}>
                          {m.product?.stock > 0 ? m.product.stock : 'Out of stock'}
                        </span>
                      </td>
                      <td style={TD}>
                        <PriorityInput value={m.priority} onCommit={priority => updateMutation.mutate({ id: m._id, data: { priority } })} />
                      </td>
                      <td style={TD}>
                        <ActiveToggle value={m.active} onChange={active => updateMutation.mutate({ id: m._id, data: { active } })} />
                      </td>
                      <td style={{ ...TD, textAlign: 'right' as const }}>
                        <DeleteButton onConfirm={() => deleteMutation.mutate(m._id)} disabled={deleteMutation.isPending} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
