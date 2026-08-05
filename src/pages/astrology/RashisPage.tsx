import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, X } from 'lucide-react'
import { getRashis, updateRashi, type Rashi } from '../../api/rashis.api'
import { useToast } from '../../store/toastStore'

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

const LABEL: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 11,
  fontWeight: 600,
  color: '#6B6057',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  display: 'block',
  marginBottom: 6,
}

// ── RashiDrawer ───────────────────────────────────────────────────────────────

function RashiDrawer({
  open,
  editing,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean
  editing: Rashi | null
  onClose: () => void
  onSave: (data: { name: string; code: string }, id: string) => void
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    if (open && editing) {
      setName(editing.name)
      setCode(editing.code)
    }
  }, [open, editing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    onSave({ name, code }, editing._id)
  }

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.4)', zIndex: 100 }} />
      )}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: 400,
          background: '#F5F0E8', borderLeft: '1px solid #E2DAC8', zIndex: 101,
          boxShadow: '-4px 0 24px rgba(28,26,23,0.12)', display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease',
        }}
      >
        <div style={{ height: 64, borderBottom: '1px solid #E2DAC8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: '#1C1A17' }}>Edit Rashi</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9590', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={LABEL}>Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} style={INPUT_BASE} />
          </div>
          <div>
            <label style={LABEL}>Code *</label>
            <input type="text" required value={code} onChange={e => setCode(e.target.value.toUpperCase())} style={INPUT_BASE} />
            <span style={{ fontFamily: FONT, fontSize: 10, color: '#9E9590', marginTop: 4, display: 'block' }}>
              Internal sidereal Rashi code — never shown to customers.
            </span>
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
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RashisPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Rashi | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-rashis'],
    queryFn: getRashis,
  })

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; code: string } }) => updateRashi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rashis'] })
      setDrawerOpen(false)
      setEditing(null)
      toast.success('Rashi updated')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save Rashi'
      toast.error(msg)
    },
  })

  const rashis = data ?? []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 500, color: '#1C1A17', margin: 0 }}>Rashis</h1>
      </div>
      <p style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590', marginTop: 0, marginBottom: 20 }}>
        Fixed reference data for the 12 Vedic Moon Rashis, seeded once. Names are editable; the set itself is not.
      </p>

      <div style={{ background: '#EDE8DC', border: '1px solid #E2DAC8', borderRadius: 4, overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>Loading Rashis…</div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#A85050' }}>Failed to load Rashis. Please try again.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Name</th>
                <th style={TH}>Code</th>
                <th style={TH}>Mapped Products</th>
                <th style={{ ...TH, textAlign: 'right' as const }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rashis.map(rashi => (
                <tr key={rashi._id}>
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>{rashi.name}</span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>{rashi.code}</span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>{rashi.mappedProductCount}</span>
                  </td>
                  <td style={{ ...TD, textAlign: 'right' as const }}>
                    <button
                      onClick={() => { setEditing(rashi); setDrawerOpen(true) }}
                      title="Edit"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: 4, border: '1px solid #E2DAC8',
                        background: 'transparent', color: '#6B6057', cursor: 'pointer',
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RashiDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        onSave={(data, id) => saveMutation.mutate({ id, data })}
        isPending={saveMutation.isPending}
      />
    </div>
  )
}
