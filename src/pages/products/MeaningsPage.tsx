import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  createMeaning,
  deleteMeaning,
  getMeanings,
  updateMeaning,
  type Meaning,
} from '../../api/meanings.api'
import { useToast } from '../../store/toastStore'

const FONT = "var(--font-body)"
const INPUT: React.CSSProperties = {
  padding: '8px 10px', background: '#F5F0E8', border: '1px solid #E2DAC8', borderRadius: 4,
  fontFamily: FONT, fontSize: 13, color: '#1C1A17', outline: 'none',
}
const TH: React.CSSProperties = {
  padding: '10px 12px', fontFamily: FONT, fontSize: 13, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9E9590',
  textAlign: 'left', borderBottom: '1px solid #E2DAC8', background: '#EDE8DC', whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #E2DAC8', verticalAlign: 'middle' }

export default function MeaningsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<Meaning | null>(null)
  const [editName, setEditName] = useState('')
  const meaningsQuery = useQuery({ queryKey: ['admin-meanings'], queryFn: getMeanings })

  const saveMutation = useMutation({
    mutationFn: ({ name, id }: { name: string; id?: string }) =>
      id ? updateMeaning(id, { name }) : createMeaning({ name, active: true }),
    onSuccess: (_meaning, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-meanings'] })
      qc.invalidateQueries({ queryKey: ['collection-meanings'] })
      setNewName('')
      setEditing(null)
      toast.success(id ? 'Meaning updated' : 'Meaning created')
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message ?? 'Failed to save meaning')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateMeaning(id, { active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-meanings'] })
      qc.invalidateQueries({ queryKey: ['collection-meanings'] })
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message ?? 'Failed to update meaning')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMeaning,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-meanings'] })
      qc.invalidateQueries({ queryKey: ['collection-meanings'] })
      toast.success('Meaning deleted')
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message ?? 'Failed to delete meaning')
    },
  })

  const startEditing = (meaning: Meaning) => {
    setEditing(meaning)
    setEditName(meaning.name)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 500, color: '#1C1A17', margin: '0 0 6px' }}>Meanings</h1>
        <p style={{ fontFamily: FONT, fontSize: 13, color: '#9E9590', margin: 0 }}>
          Create reusable product meanings, then assign them to products for storefront filtering.
        </p>
      </div>

      <form
        onSubmit={event => {
          event.preventDefault()
          const name = newName.trim()
          if (name) saveMutation.mutate({ name })
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 20, maxWidth: 560 }}
      >
        <input
          value={newName}
          onChange={event => setNewName(event.target.value)}
          placeholder="Add a meaning, e.g. Calmness"
          aria-label="New meaning name"
          required
          minLength={2}
          maxLength={100}
          style={{ ...INPUT, flex: 1 }}
        />
        <button
          type="submit"
          disabled={saveMutation.isPending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#C49A3C', color: '#fff', border: 'none', borderRadius: 4, fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}
        >
          <Plus size={15} /> Add
        </button>
      </form>

      <div style={{ background: '#EDE8DC', border: '1px solid #E2DAC8', borderRadius: 4, overflowX: 'auto' }}>
        {meaningsQuery.isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>Loading meanings…</div>
        ) : meaningsQuery.isError ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#A85050' }}>Failed to load meanings. Please try again.</div>
        ) : (meaningsQuery.data ?? []).length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>No meanings yet. Add your first one above.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Meaning</th>
                <th style={TH}>Products</th>
                <th style={TH}>Status</th>
                <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(meaningsQuery.data ?? []).map(meaning => (
                <tr key={meaning._id}>
                  <td style={TD}>
                    {editing?._id === meaning._id ? (
                      <input value={editName} onChange={event => setEditName(event.target.value)} aria-label="Meaning name" maxLength={100} style={{ ...INPUT, width: '100%', maxWidth: 320 }} />
                    ) : (
                      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>{meaning.name}</span>
                    )}
                  </td>
                  <td style={{ ...TD, fontFamily: FONT, fontSize: 13, color: '#6B6057' }}>{meaning.mappedProductCount}</td>
                  <td style={TD}>
                    <button
                      type="button"
                      onClick={() => toggleMutation.mutate({ id: meaning._id, active: !meaning.active })}
                      disabled={toggleMutation.isPending}
                      style={{ padding: '4px 10px', border: 0, borderRadius: 12, background: meaning.active ? '#ECFDF5' : '#F3F4F6', color: meaning.active ? '#5A8A6A' : '#9E9590', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}
                    >
                      {meaning.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {editing?._id === meaning._id ? (
                        <>
                          <button type="button" title="Save meaning" onClick={() => {
                            const name = editName.trim()
                            if (name) saveMutation.mutate({ id: meaning._id, name })
                          }} disabled={saveMutation.isPending} style={{ ...actionButton, color: '#5A8A6A' }}><Check size={14} /></button>
                          <button type="button" title="Cancel editing" onClick={() => setEditing(null)} style={actionButton}><X size={14} /></button>
                        </>
                      ) : (
                        <button type="button" title="Edit meaning" onClick={() => startEditing(meaning)} style={actionButton}><Pencil size={13} /></button>
                      )}
                      <button
                        type="button"
                        title="Delete meaning"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete "${meaning.name}"? Products will no longer be filterable by this meaning.`)) {
                            deleteMutation.mutate(meaning._id)
                          }
                        }}
                        style={{ ...actionButton, color: '#A85050' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const actionButton: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30,
  borderRadius: 4, border: '1px solid #E2DAC8', background: 'transparent', color: '#6B6057', cursor: 'pointer',
}
