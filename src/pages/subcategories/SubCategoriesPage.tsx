import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageOff, Pencil, Trash2, X } from 'lucide-react'
import { getAdminCategories, type Category } from '../../api/categories.api'
import {
  createSubCategory,
  deleteSubCategory,
  getAdminSubCategories,
  updateSubCategory,
  type SubCategory,
  type SubCategoryPayload,
} from '../../api/subcategories.api'
import { useToast } from '../../store/toastStore'

const FONT = "'Jost', sans-serif"
const TH: React.CSSProperties = {
  padding: '10px 12px', fontFamily: FONT, fontSize: 10, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9E9590',
  textAlign: 'left', borderBottom: '1px solid #E2DAC8', background: '#EDE8DC', whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #E2DAC8', verticalAlign: 'middle' }
const INPUT: React.CSSProperties = {
  padding: '8px 10px', background: '#F5F0E8', border: '1px solid #E2DAC8', borderRadius: 4,
  fontFamily: FONT, fontSize: 12, color: '#1C1A17', outline: 'none', width: '100%', boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = {
  fontFamily: FONT, fontSize: 11, fontWeight: 600, color: '#6B6057', textTransform: 'uppercase',
  letterSpacing: '0.07em', display: 'block', marginBottom: 6,
}

function toSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function StatusToggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
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
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: value ? '#5A8A6A' : '#9E9590' }} />
      {value ? 'Active' : 'Inactive'}
    </button>
  )
}

function DeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false)
  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => confirming ? (onConfirm(), setConfirming(false)) : setConfirming(true)}
      title={confirming ? 'Click again to confirm delete' : 'Delete subcategory'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        width: confirming ? 'auto' : 30, height: 30, padding: confirming ? '0 10px' : 0,
        borderRadius: 4, border: '1px solid', borderColor: confirming ? '#A85050' : '#E2DAC8',
        background: confirming ? '#FEF2F2' : 'transparent', color: confirming ? '#A85050' : '#9E9590',
        fontFamily: FONT, fontSize: 11, cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {confirming ? 'Confirm?' : <Trash2 size={13} />}
    </button>
  )
}

function SubCategoryDrawer({
  open, editing, categories, onClose, onSave, isPending,
}: {
  open: boolean
  editing: SubCategory | null
  categories: Category[]
  onClose: () => void
  onSave: (data: FormData | SubCategoryPayload, id?: string) => void
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [parentCategory, setParentCategory] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [shippingWeight, setShippingWeight] = useState('')
  const [shippingLength, setShippingLength] = useState('')
  const [shippingBreadth, setShippingBreadth] = useState('')
  const [shippingHeight, setShippingHeight] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name)
      setSlug(editing.slug)
      setSlugManual(true)
      setParentCategory(typeof editing.parentCategory === 'string' ? editing.parentCategory : editing.parentCategory._id)
      setSortOrder(editing.sortOrder)
      setIsActive(editing.isActive)
      setShippingWeight(editing.shipping?.weight ?? '')
      setShippingLength(editing.shipping?.length ?? '')
      setShippingBreadth(editing.shipping?.breadth ?? '')
      setShippingHeight(editing.shipping?.height ?? '')
      setImagePreview(editing.image ?? null)
      setImageFile(null)
    } else {
      setName('')
      setSlug('')
      setSlugManual(false)
      setParentCategory('')
      setSortOrder(0)
      setIsActive(true)
      setShippingWeight('')
      setShippingLength('')
      setShippingBreadth('')
      setShippingHeight('')
      setImagePreview(null)
      setImageFile(null)
    }
  }, [open, editing])

  useEffect(() => {
    if (!slugManual) setSlug(toSlug(name))
  }, [name, slugManual])

  useEffect(() => {
    return () => {
      if (prevUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrlRef.current)
      }
    }
  }, [])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (prevUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(prevUrlRef.current)
    const url = URL.createObjectURL(file)
    prevUrlRef.current = url
    setImageFile(file)
    setImagePreview(url)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('slug', slug.trim())
    formData.append('parentCategory', parentCategory)
    formData.append('sortOrder', String(sortOrder))
    formData.append('isActive', String(isActive))
    formData.append('shippingWeight', shippingWeight.trim())
    formData.append('shippingLength', shippingLength.trim())
    formData.append('shippingBreadth', shippingBreadth.trim())
    formData.append('shippingHeight', shippingHeight.trim())
    if (imageFile) formData.append('image', imageFile)
    onSave(formData, editing?._id)
  }

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.4)', zIndex: 100 }} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 420, background: '#F5F0E8',
        borderLeft: '1px solid #E2DAC8', zIndex: 101, boxShadow: '-4px 0 24px rgba(28,26,23,0.12)',
        display: 'flex', flexDirection: 'column', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease',
      }}>
        <div style={{ height: 64, borderBottom: '1px solid #E2DAC8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: '#1C1A17' }}>{editing ? 'Edit Sub-Category' : 'Add Sub-Category'}</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9590', display: 'flex', padding: 4 }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 11, color: '#A85050', padding: 0 }}
              >
                Remove image
              </button>
            )}
          </div>
          <div>
            <label style={LABEL}>Parent Category *</label>
            <select required value={parentCategory} onChange={e => setParentCategory(e.target.value)} style={{ ...INPUT, appearance: 'auto', cursor: 'pointer' }}>
              <option value="">Select category…</option>
              {categories.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Name *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Crystal Bracelets" style={INPUT} />
          </div>
          <div>
            <label style={LABEL}>Slug</label>
            <input value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true) }} placeholder="auto-generated" style={{ ...INPUT, color: '#6B6057' }} />
          </div>
          <div>
            <label style={LABEL}>Sort Order</label>
            <input type="number" min={0} value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={{ ...INPUT, width: 100 }} />
          </div>
          <div>
            <label style={LABEL}>Shipping Details</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {([
                ['Weight', shippingWeight, setShippingWeight, 'Optional (e.g. 120 g)'],
                ['Length', shippingLength, setShippingLength, 'Optional'],
                ['Breadth', shippingBreadth, setShippingBreadth, 'Optional'],
                ['Height', shippingHeight, setShippingHeight, 'Optional'],
              ] as const).map(([label, value, setter, placeholder]) => (
                <div key={label}>
                  <span style={{ fontFamily: FONT, fontSize: 10, color: '#9E9590', marginBottom: 4, display: 'block' }}>
                    {label}
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={event => setter(event.target.value)}
                    placeholder={placeholder}
                    style={INPUT}
                  />
                </div>
              ))}
            </div>
            <span style={{ fontFamily: FONT, fontSize: 10, color: '#9E9590', marginTop: 6, display: 'block' }}>
              Optional product shipping defaults. Include a weight unit (for example, 120 g or 0.12 kg); dimensions are in centimeters.
            </span>
          </div>
          <div>
            <label style={LABEL}>Status</label>
            <StatusToggle value={isActive} onChange={setIsActive} />
          </div>
          <button type="submit" disabled={isPending || !parentCategory} style={{
            marginTop: 8, padding: '10px 20px', background: isPending ? '#C4B89A' : '#C49A3C', color: '#fff',
            border: 'none', borderRadius: 4, fontFamily: FONT, fontSize: 13, fontWeight: 500,
            cursor: isPending || !parentCategory ? 'not-allowed' : 'pointer',
          }}>{isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Sub-Category'}</button>
        </form>
      </div>
    </>
  )
}

export default function SubCategoriesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<SubCategory | null>(null)

  const { data: subcategories, isLoading, isError } = useQuery({ queryKey: ['admin-subcategories'], queryFn: getAdminSubCategories })
  const { data: categories = [] } = useQuery({ queryKey: ['admin-categories'], queryFn: getAdminCategories })

  const errorMessage = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: FormData | SubCategoryPayload; id?: string }) => id ? updateSubCategory(id, data) : createSubCategory(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-subcategories'] })
      setDrawerOpen(false)
      setEditing(null)
      toast.success(variables.id ? 'Sub-category updated' : 'Sub-category created')
    },
    onError: error => toast.error(errorMessage(error, 'Failed to save sub-category')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subcategories'] }); toast.success('Sub-category deleted') },
    onError: error => toast.error(errorMessage(error, 'Failed to delete sub-category')),
  })

  const rows = subcategories ?? []
  const categoryName = (value: SubCategory['parentCategory']) => typeof value === 'string' ? categories.find(c => c._id === value)?.name ?? value : value.name

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 500, color: '#1C1A17', margin: 0 }}>Sub-Categories</h1>
        <button onClick={() => { setEditing(null); setDrawerOpen(true) }} style={{ padding: '8px 18px', background: '#C49A3C', color: '#fff', border: 'none', borderRadius: 4, fontFamily: FONT, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Add Sub-Category</button>
      </div>
      <div style={{ background: '#EDE8DC', border: '1px solid #E2DAC8', borderRadius: 4, overflowX: 'auto' }}>
        {isLoading ? <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>Loading sub-categories…</div>
          : isError ? <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#A85050' }}>Failed to load sub-categories. Please try again.</div>
          : rows.length === 0 ? <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>No sub-categories yet. Add your first one above.</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={TH}>Name</th><th style={TH}>Parent Category</th><th style={{ ...TH, width: 70, textAlign: 'center' }}>Sort</th><th style={TH}>Status</th><th style={{ ...TH, textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>{rows.map(subcategory => <tr key={subcategory._id}>
              <td style={TD}><div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>{subcategory.name}</div><div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>/{subcategory.slug}</div></td>
              <td style={TD}><span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>{categoryName(subcategory.parentCategory)}</span></td>
              <td style={{ ...TD, textAlign: 'center' }}><span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>{subcategory.sortOrder}</span></td>
              <td style={TD}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 12, background: subcategory.isActive ? '#ECFDF5' : '#F3F4F6', color: subcategory.isActive ? '#5A8A6A' : '#9E9590', fontFamily: FONT, fontSize: 11, fontWeight: 500 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: subcategory.isActive ? '#5A8A6A' : '#9E9590' }} />{subcategory.isActive ? 'Active' : 'Inactive'}</span></td>
              <td style={{ ...TD, textAlign: 'right' }}><div style={{ display: 'inline-flex', gap: 6 }}><button type="button" onClick={() => { setEditing(subcategory); setDrawerOpen(true) }} title="Edit sub-category" style={{ width: 30, height: 30, border: '1px solid #E2DAC8', borderRadius: 4, background: 'transparent', color: '#9E9590', cursor: 'pointer' }}><Pencil size={13} /></button><DeleteButton disabled={deleteMutation.isPending} onConfirm={() => deleteMutation.mutate(subcategory._id)} /></div></td>
            </tr>)}</tbody>
          </table>}
      </div>
      <SubCategoryDrawer open={drawerOpen} editing={editing} categories={categories} onClose={() => { setDrawerOpen(false); setEditing(null) }} onSave={(data, id) => saveMutation.mutate({ data, id })} isPending={saveMutation.isPending} />
    </div>
  )
}
