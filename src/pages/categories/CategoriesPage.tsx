import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, X, ImageOff } from 'lucide-react'
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '../../api/categories.api'

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ── ActiveToggle ──────────────────────────────────────────────────────────────

function ActiveToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        background: value ? '#ECFDF5' : '#F3F4F6',
        color: value ? '#5A8A6A' : '#9E9590',
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 500,
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: value ? '#5A8A6A' : '#9E9590',
          flexShrink: 0,
        }}
      />
      {value ? 'Active' : 'Inactive'}
    </button>
  )
}

// ── CategoryDrawer ────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  editing: Category | null
  onClose: () => void
  onSave: (fd: FormData, id?: string) => void
  isPending: boolean
}

function CategoryDrawer({ open, editing, onClose, onSave, isPending }: DrawerProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name)
        setSlug(editing.slug)
        setSlugManual(true)
        setDescription(editing.description ?? '')
        setSortOrder(editing.sortOrder)
        setIsActive(editing.isActive)
        setImagePreview(editing.image ?? null)
        setImageFile(null)
      } else {
        setName('')
        setSlug('')
        setSlugManual(false)
        setDescription('')
        setSortOrder(0)
        setIsActive(true)
        setImagePreview(null)
        setImageFile(null)
      }
    }
  }, [open, editing])

  useEffect(() => {
    if (!slugManual) setSlug(toSlug(name))
  }, [name, slugManual])

  // Clean up object URL on unmount / preview change
  useEffect(() => {
    return () => {
      if (prevUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrlRef.current)
      }
    }
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (prevUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(prevUrlRef.current)
    const url = URL.createObjectURL(file)
    prevUrlRef.current = url
    setImageFile(file)
    setImagePreview(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('name', name)
    fd.append('slug', slug)
    if (description) fd.append('description', description)
    fd.append('sortOrder', String(sortOrder))
    fd.append('isActive', String(isActive))
    if (imageFile) fd.append('image', imageFile)
    onSave(fd, editing?._id)
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
          width: 420,
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
        {/* Header */}
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
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: '#1C1A17' }}>
            {editing ? 'Edit Category' : 'Add Category'}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9590', display: 'flex', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* Image upload */}
          <div>
            <label style={LABEL}>Image</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                height: 140,
                border: '1.5px dashed #C4B89A',
                borderRadius: 6,
                background: '#EDE8DC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#9E9590' }}>
                  <ImageOff size={28} style={{ marginBottom: 6, opacity: 0.5 }} />
                  <div style={{ fontFamily: FONT, fontSize: 11 }}>Click to upload image</div>
                  <div style={{ fontFamily: FONT, fontSize: 10, marginTop: 2 }}>JPG, PNG, WebP · max 5MB</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {imagePreview && (
              <button
                type="button"
                onClick={() => { setImagePreview(null); setImageFile(null) }}
                style={{
                  marginTop: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  fontSize: 11,
                  color: '#A85050',
                  padding: 0,
                }}
              >
                Remove image
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label style={LABEL}>Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Amethyst"
              style={INPUT_BASE}
            />
          </div>

          {/* Slug */}
          <div>
            <label style={LABEL}>Slug</label>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
              placeholder="auto-generated"
              style={{ ...INPUT_BASE, color: '#6B6057' }}
            />
            <span style={{ fontFamily: FONT, fontSize: 10, color: '#9E9590', marginTop: 4, display: 'block' }}>
              Used in URLs. Auto-generated from name unless overridden.
            </span>
          </div>

          {/* Description */}
          <div>
            <label style={LABEL}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional short description"
              style={{
                ...INPUT_BASE,
                resize: 'vertical',
                lineHeight: 1.5,
                fontFamily: FONT,
              }}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label style={LABEL}>Sort Order</label>
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={e => setSortOrder(Number(e.target.value))}
              style={{ ...INPUT_BASE, width: 100 }}
            />
            <span style={{ fontFamily: FONT, fontSize: 10, color: '#9E9590', marginTop: 4, display: 'block' }}>
              Lower numbers appear first.
            </span>
          </div>

          {/* Active */}
          <div>
            <label style={LABEL}>Status</label>
            <ActiveToggle value={isActive} onChange={setIsActive} />
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
            {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Category'}
          </button>
        </form>
      </div>
    </>
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
      title={confirming ? 'Click again to confirm delete' : 'Delete category'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: confirming ? 'auto' : 30,
        height: 30,
        padding: confirming ? '0 10px' : '0',
        borderRadius: 4,
        border: '1px solid',
        borderColor: confirming ? '#A85050' : '#E2DAC8',
        background: confirming ? '#FEF2F2' : 'transparent',
        color: confirming ? '#A85050' : '#9E9590',
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: confirming ? 500 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        gap: 4,
      }}
    >
      {confirming ? 'Confirm?' : <Trash2 size={13} />}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  })

  const saveMutation = useMutation({
    mutationFn: ({ fd, id }: { fd: FormData; id?: string }) =>
      id ? updateCategory(id, fd) : createCategory(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      setDrawerOpen(false)
      setEditingCategory(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  })

  const openCreate = () => { setEditingCategory(null); setDrawerOpen(true) }
  const openEdit = (cat: Category) => { setEditingCategory(cat); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setEditingCategory(null) }

  const categories = data ?? []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 500, color: '#1C1A17', margin: 0 }}>
          Categories
        </h1>
        <button
          onClick={openCreate}
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
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#B8892E')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#C49A3C')}
        >
          + Add Category
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
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>
            Loading categories…
          </div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#A85050' }}>
            Failed to load categories. Please try again.
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>
            No categories yet. Add your first one above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 52 }}>Image</th>
                <th style={TH}>Name</th>
                <th style={TH}>Description</th>
                <th style={{ ...TH, width: 70, textAlign: 'center' as const }}>Sort</th>
                <th style={TH}>Status</th>
                <th style={{ ...TH, textAlign: 'right' as const }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat: Category) => (
                <tr
                  key={cat._id}
                  onMouseEnter={e => {
                    const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                    cells.forEach(td => ((td as HTMLElement).style.background = '#F0EAF7'))
                  }}
                  onMouseLeave={e => {
                    const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                    cells.forEach(td => ((td as HTMLElement).style.background = 'transparent'))
                  }}
                >
                  {/* Thumbnail */}
                  <td style={TD}>
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 4,
                          objectFit: 'cover',
                          border: '1px solid #E2DAC8',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 4,
                          background: '#F5F0E8',
                          border: '1px solid #E2DAC8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#C4B89A',
                        }}
                      >
                        <ImageOff size={14} />
                      </div>
                    )}
                  </td>

                  {/* Name + Slug */}
                  <td style={TD}>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>
                      {cat.name}
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
                      /{cat.slug}
                    </div>
                  </td>

                  {/* Description */}
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: FONT,
                        fontSize: 12,
                        color: '#6B6057',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        maxWidth: 260,
                      }}
                    >
                      {cat.description ?? <span style={{ color: '#C4B89A' }}>—</span>}
                    </span>
                  </td>

                  {/* Sort Order */}
                  <td style={{ ...TD, textAlign: 'center' as const }}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                      {cat.sortOrder}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={TD}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: cat.isActive ? '#ECFDF5' : '#F3F4F6',
                        color: cat.isActive ? '#5A8A6A' : '#9E9590',
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: cat.isActive ? '#5A8A6A' : '#9E9590',
                        }}
                      />
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ ...TD, textAlign: 'right' as const }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => openEdit(cat)}
                        title="Edit"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 30,
                          height: 30,
                          borderRadius: 4,
                          border: '1px solid #E2DAC8',
                          background: 'transparent',
                          color: '#6B6057',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#F5F0E8')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                      >
                        <Pencil size={13} />
                      </button>
                      <DeleteButton
                        onConfirm={() => deleteMutation.mutate(cat._id)}
                        disabled={deleteMutation.isPending}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      <CategoryDrawer
        open={drawerOpen}
        editing={editingCategory}
        onClose={closeDrawer}
        onSave={(fd, id) => saveMutation.mutate({ fd, id })}
        isPending={saveMutation.isPending}
      />
    </div>
  )
}
