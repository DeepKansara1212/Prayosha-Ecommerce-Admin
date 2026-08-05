import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, X } from 'lucide-react'
import { getPurposes, createPurpose, updatePurpose, deletePurpose, type Purpose } from '../../api/purposes.api'
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
  fontFamily: FONT, fontSize: 12, color: '#1C1A17', outline: 'none', width: '100%', boxSizing: 'border-box',
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
      title={confirming ? 'Click again to confirm delete' : 'Delete purpose'}
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

// ── PurposeDrawer ─────────────────────────────────────────────────────────────

function PurposeDrawer({
  open, editing, onClose, onSave, isPending,
}: {
  open: boolean
  editing: Purpose | null
  onClose: () => void
  onSave: (data: { name: string; active: boolean }, id?: string) => void
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setActive(editing?.active ?? true)
    }
  }, [open, editing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, active }, editing?._id)
  }

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.4)', zIndex: 100 }} />}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: 400,
          background: '#F5F0E8', borderLeft: '1px solid #E2DAC8', zIndex: 101,
          boxShadow: '-4px 0 24px rgba(28,26,23,0.12)', display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease',
        }}
      >
        <div style={{ height: 64, borderBottom: '1px solid #E2DAC8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: '#1C1A17' }}>{editing ? 'Edit Purpose' : 'Add Purpose'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9590', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={LABEL}>Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Career Growth" style={INPUT_BASE} />
          </div>
          <div>
            <label style={LABEL}>Status</label>
            <ActiveToggle value={active} onChange={setActive} />
          </div>
          <button
            type="submit"
            disabled={isPending}
            style={{
              marginTop: 8, padding: '10px 20px', background: isPending ? '#C4B89A' : '#C49A3C',
              color: '#fff', border: 'none', borderRadius: 4, fontFamily: FONT, fontSize: 13,
              fontWeight: 500, cursor: isPending ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
            }}
          >
            {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Purpose'}
          </button>
        </form>
      </div>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PurposesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Purpose | null>(null)

  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-purposes'], queryFn: getPurposes })

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: { name: string; active: boolean }; id?: string }) =>
      id ? updatePurpose(id, data) : createPurpose(data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-purposes'] })
      setDrawerOpen(false)
      setEditing(null)
      toast.success(id ? 'Purpose updated' : 'Purpose created')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save purpose'
      toast.error(msg)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updatePurpose(id, { active }),
    onMutate: async ({ id, active }) => {
      await qc.cancelQueries({ queryKey: ['admin-purposes'] })
      const previous = qc.getQueryData<Purpose[]>(['admin-purposes'])
      qc.setQueryData<Purpose[]>(['admin-purposes'], old =>
        old?.map(p => (p._id === id ? { ...p, active } : p)))
      return { previous }
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previous) qc.setQueryData(['admin-purposes'], context.previous)
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update status'
      toast.error(msg)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin-purposes'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePurpose,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-purposes'] })
      toast.success('Purpose deleted')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete purpose'
      toast.error(msg)
    },
  })

  const purposes = data ?? []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 500, color: '#1C1A17', margin: 0 }}>Purposes</h1>
        <button
          onClick={() => { setEditing(null); setDrawerOpen(true) }}
          style={{
            padding: '8px 18px', background: '#C49A3C', color: '#fff', border: 'none', borderRadius: 4,
            fontFamily: FONT, fontSize: 13, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          + Add Purpose
        </button>
      </div>

      <div style={{ background: '#EDE8DC', border: '1px solid #E2DAC8', borderRadius: 4, overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>Loading purposes…</div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#A85050' }}>Failed to load purposes. Please try again.</div>
        ) : purposes.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>No purposes yet. Add your first one above.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Name</th>
                <th style={TH}>Status</th>
                <th style={TH}>Mapped Rudraksha Types</th>
                <th style={{ ...TH, textAlign: 'right' as const }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purposes.map(purpose => (
                <tr key={purpose._id}>
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>{purpose.name}</span>
                  </td>
                  <td style={TD}>
                    <ActiveToggle value={purpose.active} onChange={active => toggleMutation.mutate({ id: purpose._id, active })} />
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>{purpose.mappedRudrakshaCount}</span>
                  </td>
                  <td style={{ ...TD, textAlign: 'right' as const }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => { setEditing(purpose); setDrawerOpen(true) }}
                        title="Edit"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 4, border: '1px solid #E2DAC8', background: 'transparent', color: '#6B6057', cursor: 'pointer' }}
                      >
                        <Pencil size={13} />
                      </button>
                      <DeleteButton onConfirm={() => deleteMutation.mutate(purpose._id)} disabled={deleteMutation.isPending} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PurposeDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        onSave={(data, id) => saveMutation.mutate({ data, id })}
        isPending={saveMutation.isPending}
      />
    </div>
  )
}
