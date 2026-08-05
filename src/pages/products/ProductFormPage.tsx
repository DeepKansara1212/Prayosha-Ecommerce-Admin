import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, ArrowUp, ArrowDown, Upload, CheckCircle, AlertCircle, Lock, Unlock } from 'lucide-react'
import {
  getProductBySlug,
  createProduct,
  updateProduct,
  updateImages,
  type ProductPayload,
} from '../../api/products.api'
import { getCategories } from '../../api/categories.api'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:                   z.string().min(1, 'Name is required'),
  slug:                   z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  sku:                    z.string().min(1, 'SKU is required'),
  shortDescription:       z.string().max(200, 'Max 200 characters'),
  description:            z.string().min(1, 'Description is required'),
  careInstructions:       z.string(),
  metaphysicalProperties: z.string(),
  price:                  z.coerce.number().min(0.01, 'Price is required'),
  comparePrice:           z.string(),
  costPrice:              z.string(),
  stock:                  z.coerce.number().min(0, 'Stock cannot be negative'),
  lowStockThreshold:      z.coerce.number().min(0),
  useCategoryShipping:    z.boolean(),
  shippingWeight:         z.string(),
  shippingLength:         z.string(),
  shippingBreadth:        z.string(),
  shippingHeight:         z.string(),
  category:               z.string().min(1, 'Category is required'),
  tags:                   z.array(z.string()),
  chakra:                 z.string(),
  badge:                  z.string(),
  isFeatured:             z.boolean(),
  isActive:               z.boolean(),
  hasFreeGift:            z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif"

const BADGE_OPTIONS = ['', 'BESTSELLER', 'NEW', 'LIMITED', 'RARE', 'GIFT SET'] as const

const BADGE_COLOR: Record<string, string> = {
  BESTSELLER: '#C49A3C',
  NEW:        '#5A8A6A',
  LIMITED:    '#7B5EA7',
  RARE:       '#A85050',
  'GIFT SET': '#0369A1',
}
const BADGE_BG: Record<string, string> = {
  BESTSELLER: '#FEF9EC',
  NEW:        '#ECFDF5',
  LIMITED:    '#F0EAF7',
  RARE:       '#FEF2F2',
  'GIFT SET': '#E0F2FE',
}

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// ── Shared styles ─────────────────────────────────────────────────────────────

const SECTION: React.CSSProperties = {
  background: '#EDE8DC',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  padding: 24,
  marginBottom: 20,
}

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#9E9590',
  marginBottom: 16,
  paddingBottom: 10,
  borderBottom: '1px solid #E2DAC8',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontFamily: FONT,
  fontSize: 12,
  fontWeight: 500,
  color: '#6B6057',
  marginBottom: 5,
}

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  background: '#F5F0E8',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  fontFamily: FONT,
  fontSize: 13,
  color: '#1C1A17',
  outline: 'none',
  boxSizing: 'border-box',
}

const TEXTAREA: React.CSSProperties = {
  ...INPUT,
  resize: 'vertical',
  minHeight: 90,
  lineHeight: 1.6,
}

const ERR: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 11,
  color: '#A85050',
  marginTop: 4,
  display: 'block',
}

const GRID2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}

const FIELD: React.CSSProperties = { marginBottom: 16 }

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={e => e.key === ' ' && onChange()}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? '#7B5EA7' : '#D4CFC8',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────

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

// ── Slug helper ───────────────────────────────────────────────────────────────

const toSlug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const { id: slugParam } = useParams<{ id?: string }>()
  const navigate          = useNavigate()
  const qc                = useQueryClient()
  const isEditing         = !!slugParam

  // ── Toast state ────────────────────────────────────────────────────────────

  const [toast, setToast]       = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimer              = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, message })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // ── Image state ────────────────────────────────────────────────────────────

  type ImageItem = { url: string; file?: File; isExisting: boolean }

  const [images, setImages]         = useState<ImageItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef                = useRef<HTMLInputElement>(null)

  // Keep a ref so the unmount cleanup can revoke blob URLs without a stale closure
  const imagesRef = useRef<ImageItem[]>([])
  useEffect(() => { imagesRef.current = images }, [images])
  useEffect(() => () => imagesRef.current.forEach(img => { if (!img.isExisting) URL.revokeObjectURL(img.url) }), [])

  const totalImages = images.length

  const handleFiles = (files: File[]) => {
    const valid     = files.filter(f => ACCEPTED.includes(f.type))
    const remaining = 6 - totalImages
    if (remaining <= 0) return
    const newItems: ImageItem[] = valid.slice(0, remaining).map(f => ({
      url: URL.createObjectURL(f),
      file: f,
      isExisting: false,
    }))
    setImages(prev => [...prev, ...newItems])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const removeImage = (idx: number) => {
    setImages(prev => {
      const item = prev[idx]
      if (item && !item.isExisting) URL.revokeObjectURL(item.url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const moveImage = (idx: number, dir: -1 | 1) => {
    setImages(prev => {
      const arr  = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= arr.length) return prev
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return arr
    })
  }

  // ── Tag state ──────────────────────────────────────────────────────────────

  const [tagInput, setTagInput] = useState('')

  // ── Form ───────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', slug: '', sku: '', shortDescription: '', description: '',
      careInstructions: '', metaphysicalProperties: '',
      price: 0, comparePrice: '', costPrice: '', stock: 0, lowStockThreshold: 5,
      useCategoryShipping: true, shippingWeight: '', shippingLength: '', shippingBreadth: '', shippingHeight: '',
      category: '', tags: [], chakra: '', badge: '', isFeatured: false, isActive: true, hasFreeGift: false,
    },
  })

  const watchName       = watch('name')
  const watchSlug       = watch('slug')
  const watchBadge      = watch('badge')
  const watchTags       = watch('tags')
  const watchFeatured   = watch('isFeatured')
  const watchActive     = watch('isActive')
  const watchHasFreeGift = watch('hasFreeGift')
  const watchCategory    = watch('category')
  const watchUseCategoryShipping = watch('useCategoryShipping')

  // Slug lock/edit state
  // On create: start unlocked (auto-gen active). On edit: start locked (preserve existing slug).
  const [slugLocked, setSlugLocked]         = useState(isEditing)
  const [slugTakenError, setSlugTakenError] = useState<string | null>(null)
  const slugEditedManually                  = useRef(isEditing)

  // Clear 409 error when user changes the slug
  useEffect(() => { setSlugTakenError(null) }, [watchSlug])

  // Auto-generate slug from name (500ms debounce via RHF subscription).
  // Using subscription instead of reactive watchName to avoid RHF's synthetic
  // input-event dispatch (isTrusted=false) from setValue incorrectly locking the slug.
  useEffect(() => {
    if (isEditing) return
    let timer: ReturnType<typeof setTimeout>
    const { unsubscribe } = watch((values, { name: field }) => {
      if (field !== 'name') return
      if (slugEditedManually.current) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        setValue('slug', toSlug(values.name ?? ''), { shouldValidate: false })
      }, 500)
    })
    return () => { unsubscribe(); clearTimeout(timer) }
  }, [isEditing, watch, setValue])

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', slugParam],
    queryFn: () => getProductBySlug(slugParam!),
    enabled: isEditing,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })

  // The category dropdown's list already carries `shipping` — no extra fetch needed.
  // Fall back to the edited product's own populated category (covers the case where
  // its category is inactive and therefore missing from the public categories list).
  const productCategory = product && typeof product.category === 'object' ? product.category : undefined
  const selectedCategoryShipping =
    categories?.find(c => c._id === watchCategory)?.shipping ??
    (productCategory?._id === watchCategory ? productCategory.shipping : undefined)

  // Auto-fill shipping fields from the selected category whenever the category
  // changes or "Use Category Shipping" is (re-)enabled.
  useEffect(() => {
    if (!watchUseCategoryShipping || !selectedCategoryShipping) return
    setValue('shippingWeight', selectedCategoryShipping.weight != null ? String(selectedCategoryShipping.weight) : '')
    setValue('shippingLength', selectedCategoryShipping.length != null ? String(selectedCategoryShipping.length) : '')
    setValue('shippingBreadth', selectedCategoryShipping.breadth != null ? String(selectedCategoryShipping.breadth) : '')
    setValue('shippingHeight', selectedCategoryShipping.height != null ? String(selectedCategoryShipping.height) : '')
  }, [watchUseCategoryShipping, selectedCategoryShipping, setValue])

  // Pre-fill form when product loads
  useEffect(() => {
    if (!product || !isEditing) return
    reset({
      name:                   product.name,
      slug:                   product.slug,
      sku:                    product.sku,
      shortDescription:       product.shortDescription ?? '',
      description:            product.description,
      careInstructions:       product.careInstructions ?? '',
      metaphysicalProperties: product.metaphysicalProperties ?? '',
      price:                  product.price,
      comparePrice:           product.comparePrice ? String(product.comparePrice) : '',
      costPrice:              '',
      stock:                  product.stock,
      lowStockThreshold:      product.lowStockThreshold,
      useCategoryShipping:    product.useCategoryShipping ?? true,
      shippingWeight:         product.shipping?.weight != null ? String(product.shipping.weight) : '',
      shippingLength:         product.shipping?.length != null ? String(product.shipping.length) : '',
      shippingBreadth:        product.shipping?.breadth != null ? String(product.shipping.breadth) : '',
      shippingHeight:         product.shipping?.height != null ? String(product.shipping.height) : '',
      category:               typeof product.category === 'object'
                                ? product.category._id
                                : product.category,
      tags:                   product.tags ?? [],
      chakra:                 product.chakra ?? '',
      badge:                  product.badge ?? '',
      isFeatured:             product.isFeatured,
      isActive:               product.isActive,
      hasFreeGift:            product.hasFreeGift,
    })
    setImages((product.images ?? []).map(url => ({ url, isExisting: true })))
  }, [product, isEditing, reset])

  // ── Submit handler ─────────────────────────────────────────────────────────

  const onSubmit = async (data: FormValues) => {
    const payload: ProductPayload = {
      name:             data.name,
      slug:             data.slug,
      sku:              data.sku.toUpperCase(),
      description:      data.description,
      price:            data.price,
      stock:            data.stock,
      lowStockThreshold: data.lowStockThreshold,
      category:         data.category,
      tags:             data.tags,
      isFeatured:       data.isFeatured,
      isActive:         data.isActive,
      hasFreeGift:      data.hasFreeGift,
      useCategoryShipping: data.useCategoryShipping,
      ...(data.shortDescription       && { shortDescription: data.shortDescription }),
      ...(data.careInstructions       && { careInstructions: data.careInstructions }),
      ...(data.metaphysicalProperties && { metaphysicalProperties: data.metaphysicalProperties }),
      ...(data.chakra                 && { chakra: data.chakra }),
      ...(data.badge                  && { badge: data.badge }),
      ...(data.comparePrice           && { comparePrice: +data.comparePrice }),
      ...(data.costPrice              && { costPrice: +data.costPrice }),
      ...(!data.useCategoryShipping && {
        shipping: {
          ...(data.shippingWeight   && { weight: +data.shippingWeight }),
          ...(data.shippingLength   && { length: +data.shippingLength }),
          ...(data.shippingBreadth  && { breadth: +data.shippingBreadth }),
          ...(data.shippingHeight   && { height: +data.shippingHeight }),
        },
      }),
    }

    try {
      if (isEditing && product) {
        await updateProduct(product._id, payload)

        const existingUrls  = images.filter(i => i.isExisting).map(i => i.url)
        const newImageFiles = images.filter(i => !i.isExisting && i.file).map(i => i.file!)
        const imagesChanged =
          newImageFiles.length > 0 ||
          existingUrls.length !== (product.images?.length ?? 0) ||
          existingUrls.some((url, i) => url !== (product.images ?? [])[i])

        if (imagesChanged) {
          // Revoke blob URLs before state replacement
          images.forEach(img => { if (!img.isExisting) URL.revokeObjectURL(img.url) })
          const updatedImages = await updateImages(product._id, existingUrls, newImageFiles)
          setImages(updatedImages.map(url => ({ url, isExisting: true })))
        }

        qc.invalidateQueries({ queryKey: ['admin-products'] })
        qc.invalidateQueries({ queryKey: ['product', slugParam] })
        showToast('success', 'Product updated successfully')
        navigate('/admin/products')
      } else {
        // Create
        const created      = await createProduct(payload)
        const newImgFiles  = images.filter(i => !i.isExisting && i.file).map(i => i.file!)
        if (newImgFiles.length > 0) {
          await updateImages(created._id, [], newImgFiles)
        }
        navigate('/admin/products')
      }
    } catch (err) {
      const axErr = err as { response?: { status?: number; data?: { message?: string } } }
      if (axErr?.response?.status === 409) {
        setSlugTakenError('This slug is already taken. Please choose a different one.')
        return
      }
      const msg = axErr?.response?.data?.message ?? (err instanceof Error ? err.message : 'Something went wrong')
      showToast('error', msg)
    }
  }

  // ── Tag helpers ────────────────────────────────────────────────────────────

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const tag = tagInput.trim().toLowerCase()
    if (tag && !watchTags.includes(tag)) {
      setValue('tags', [...watchTags, tag])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => setValue('tags', watchTags.filter(t => t !== tag))

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isEditing && productLoading) {
    return (
      <div style={{ fontFamily: FONT, fontSize: 13, color: '#9E9590', padding: 40, textAlign: 'center' }}>
        Loading product…
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Page heading */}
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 500,
          color: '#1C1A17',
          marginBottom: 24,
        }}
      >
        {isEditing ? `Edit: ${product?.name ?? ''}` : 'New Product'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Section 1: Basic Info ──────────────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>Basic Info</p>

          <div style={GRID2}>
            <div style={FIELD}>
              <label style={LABEL}>Name <span style={{ color: '#A85050' }}>*</span></label>
              <input
                {...register('name')}
                placeholder="e.g. Rose Quartz Tumble"
                className="admin-input"
                style={INPUT}
              />
              {errors.name && <span style={ERR}>{errors.name.message}</span>}
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Slug <span style={{ color: '#A85050' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('slug')}
                  readOnly={slugLocked}
                  placeholder="rose-quartz-tumble"
                  className="admin-input"
                  style={{
                    ...INPUT,
                    paddingRight: 34,
                    ...(slugLocked
                      ? { background: '#EDE8DC', color: '#9E9590', cursor: 'default' }
                      : {}),
                  }}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    if (e.nativeEvent.isTrusted) slugEditedManually.current = true
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    slugEditedManually.current = true
                    setSlugLocked(v => !v)
                  }}
                  title={slugLocked ? 'Unlock to edit slug' : 'Lock slug'}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: slugLocked ? '#9E9590' : '#7B5EA7',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {slugLocked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
              </div>
              {errors.slug && <span style={ERR}>{errors.slug.message}</span>}
              {slugTakenError && <span style={ERR}>{slugTakenError}</span>}
            </div>
          </div>

          <div style={GRID2}>
            <div style={FIELD}>
              <label style={LABEL}>SKU <span style={{ color: '#A85050' }}>*</span></label>
              <input
                {...register('sku')}
                placeholder="RQT-001"
                className="admin-input"
                style={INPUT}
              />
              {errors.sku && <span style={ERR}>{errors.sku.message}</span>}
            </div>

            <div style={{ ...FIELD, display: 'flex', flexDirection: 'column' }}>
              <label style={LABEL}>
                Short Description
                <span style={{ color: '#9E9590', fontWeight: 400, marginLeft: 6 }}>
                  ({watchName ? 200 - (watch('shortDescription')?.length ?? 0) : 200} left)
                </span>
              </label>
              <textarea
                {...register('shortDescription')}
                placeholder="Brief product summary shown in cards…"
                className="admin-input"
                style={{ ...TEXTAREA, minHeight: 70, flex: 1 }}
              />
              {errors.shortDescription && <span style={ERR}>{errors.shortDescription.message}</span>}
            </div>
          </div>
        </div>

        {/* ── Section 2: Description ─────────────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>Description</p>

          <div style={FIELD}>
            <label style={LABEL}>Full Description <span style={{ color: '#A85050' }}>*</span></label>
            <textarea
              {...register('description')}
              placeholder="Detailed product description…"
              className="admin-input"
              style={{ ...TEXTAREA, minHeight: 130 }}
            />
            {errors.description && <span style={ERR}>{errors.description.message}</span>}
          </div>

          <div style={GRID2}>
            <div style={FIELD}>
              <label style={LABEL}>Care Instructions</label>
              <textarea
                {...register('careInstructions')}
                placeholder="How to care for this crystal…"
                className="admin-input"
                style={{ ...TEXTAREA, minHeight: 80 }}
              />
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Metaphysical Properties</label>
              <textarea
                {...register('metaphysicalProperties')}
                placeholder="Healing properties, chakras, intentions…"
                className="admin-input"
                style={{ ...TEXTAREA, minHeight: 80 }}
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Pricing & Inventory ────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>Pricing &amp; Inventory</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={FIELD}>
              <label style={LABEL}>Price (₹) <span style={{ color: '#A85050' }}>*</span></label>
              <input
                {...register('price')}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="admin-input"
                style={INPUT}
              />
              {errors.price && <span style={ERR}>{errors.price.message}</span>}
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Compare Price (₹)</label>
              <input
                {...register('comparePrice')}
                type="number"
                min="0"
                step="0.01"
                placeholder="Strikethrough price"
                className="admin-input"
                style={INPUT}
              />
            </div>

            <div style={FIELD}>
              <label style={LABEL}>
                Cost Price (₹)
                <span
                  style={{
                    display: 'block',
                    fontWeight: 400,
                    fontSize: 10,
                    color: '#9E9590',
                    marginTop: 1,
                  }}
                >
                  Not shown to customers
                </span>
              </label>
              <input
                {...register('costPrice')}
                type="number"
                min="0"
                step="0.01"
                placeholder="Your cost"
                className="admin-input"
                style={INPUT}
              />
            </div>
          </div>

          <div style={GRID2}>
            <div style={FIELD}>
              <label style={LABEL}>Stock <span style={{ color: '#A85050' }}>*</span></label>
              <input
                {...register('stock')}
                type="number"
                min="0"
                placeholder="0"
                className="admin-input"
                style={INPUT}
              />
              {errors.stock && <span style={ERR}>{errors.stock.message}</span>}
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Low Stock Threshold</label>
              <input
                {...register('lowStockThreshold')}
                type="number"
                min="0"
                className="admin-input"
                style={INPUT}
              />
            </div>
          </div>
        </div>

        {/* ── Section 3b: Shipping Details ─────────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>Shipping Details</p>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>
                Use Category Shipping
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
                Inherit weight and dimensions from the selected category
              </div>
            </div>
            <Toggle
              checked={watchUseCategoryShipping}
              onChange={() => setValue('useCategoryShipping', !watchUseCategoryShipping)}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            {([
              ['shippingWeight', 'Weight (g)'],
              ['shippingLength', 'Length (cm)'],
              ['shippingBreadth', 'Breadth (cm)'],
              ['shippingHeight', 'Height (cm)'],
            ] as const).map(([field, label]) => (
              <div style={FIELD} key={field}>
                <label style={LABEL}>{label}</label>
                <input
                  {...register(field)}
                  type="number"
                  min="0"
                  step="any"
                  disabled={watchUseCategoryShipping}
                  placeholder={watchUseCategoryShipping ? '' : 'Optional'}
                  className="admin-input"
                  style={{
                    ...INPUT,
                    ...(watchUseCategoryShipping
                      ? { background: '#EDE8DC', color: '#9E9590', cursor: 'not-allowed' }
                      : {}),
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 4: Categorization ──────────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>Categorization</p>

          <div style={GRID2}>
            {/* Category */}
            <div style={FIELD}>
              <label style={LABEL}>Category <span style={{ color: '#A85050' }}>*</span></label>
              <select
                {...register('category')}
                className="admin-input"
                style={{ ...INPUT, appearance: 'auto', cursor: 'pointer' }}
              >
                <option value="">Select category…</option>
                {categories?.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {errors.category && <span style={ERR}>{errors.category.message}</span>}
            </div>

            {/* Chakra */}
            <div style={FIELD}>
              <label style={LABEL}>Chakra</label>
              <input
                {...register('chakra')}
                placeholder="e.g. Heart, Crown"
                className="admin-input"
                style={INPUT}
              />
            </div>
          </div>

          {/* Tags */}
          <div style={FIELD}>
            <label style={LABEL}>Tags</label>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Type a tag and press Enter…"
              className="admin-input"
              style={INPUT}
            />
            {watchTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {watchTags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      background: '#EDE8DC',
                      border: '1px solid #E2DAC8',
                      borderRadius: 2,
                      fontFamily: FONT,
                      fontSize: 11,
                      color: '#1C1A17',
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: '#9E9590',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Badge */}
          <div style={FIELD}>
            <label style={LABEL}>Badge</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <select
                {...register('badge')}
                className="admin-input"
                style={{ ...INPUT, appearance: 'auto', cursor: 'pointer', maxWidth: 220 }}
              >
                {BADGE_OPTIONS.map(b => (
                  <option key={b} value={b}>{b || 'None'}</option>
                ))}
              </select>

              {watchBadge && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    borderRadius: 3,
                    background: BADGE_BG[watchBadge] ?? '#F3F4F6',
                    color: BADGE_COLOR[watchBadge] ?? '#6B7280',
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    border: `1px solid ${BADGE_COLOR[watchBadge] ?? '#E2DAC8'}`,
                  }}
                >
                  {watchBadge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 5: Images ─────────────────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>
            Images
            <span style={{ fontWeight: 400, marginLeft: 8, color: '#C4B89A' }}>
              {totalImages}/6
            </span>
          </p>

          {/* Drop zone */}
          {totalImages < 6 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                background: isDragging ? '#F0EAF7' : '#EDE8DC',
                border: `2px dashed ${isDragging ? '#7B5EA7' : '#C4B89A'}`,
                borderRadius: 4,
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: 16,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <Upload size={22} color={isDragging ? '#7B5EA7' : '#9E9590'} style={{ marginBottom: 8 }} />
              <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', marginBottom: 4 }}>
                Drop images here or click to browse
              </p>
              <p style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
                JPG, PNG, WebP · max {6 - totalImages} more
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files) handleFiles(Array.from(e.target.files))
                  e.target.value = ''
                }}
              />
            </div>
          )}

          {/* Preview grid */}
          {images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {images.map((img, idx) => (
                <div
                  key={img.url}
                  style={{
                    position: 'relative',
                    width: 120,
                    height: 120,
                    borderRadius: 4,
                    border: img.isExisting ? '1px solid #E2DAC8' : '2px dashed #7B5EA7',
                    overflow: 'visible',
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: img.isExisting ? 4 : 3,
                      display: 'block',
                      opacity: img.isExisting ? 1 : 0.85,
                    }}
                  />
                  {/* Order arrows */}
                  <div style={{ position: 'absolute', bottom: 4, left: 4, display: 'flex', gap: 2 }}>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, -1)}
                      disabled={idx === 0}
                      title="Move left"
                      style={{
                        width: 22,
                        height: 22,
                        background: 'rgba(255,255,255,0.85)',
                        border: '1px solid #E2DAC8',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        opacity: idx === 0 ? 0.4 : 1,
                      }}
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 1)}
                      disabled={idx === images.length - 1}
                      title="Move right"
                      style={{
                        width: 22,
                        height: 22,
                        background: 'rgba(255,255,255,0.85)',
                        border: '1px solid #E2DAC8',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: idx === images.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: idx === images.length - 1 ? 0.4 : 1,
                      }}
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    title="Remove image"
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#A85050',
                      border: '2px solid #F5F0E8',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={10} />
                  </button>
                  {idx === 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        background: 'rgba(0,0,0,0.55)',
                        borderRadius: 2,
                        padding: '1px 5px',
                        fontFamily: FONT,
                        fontSize: 9,
                        color: '#fff',
                        letterSpacing: '0.06em',
                      }}
                    >
                      MAIN
                    </span>
                  )}
                  {!img.isExisting && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        fontFamily: FONT,
                        fontSize: 9,
                        color: '#7B5EA7',
                        background: 'rgba(255,255,255,0.8)',
                      }}
                    >
                      Pending upload
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 6: Visibility ──────────────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>Visibility</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>
                  Featured
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
                  Show in featured products section on the storefront
                </div>
              </div>
              <Toggle
                checked={watchFeatured}
                onChange={() => setValue('isFeatured', !watchFeatured)}
              />
            </label>

            <div style={{ height: 1, background: '#E2DAC8' }} />

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>
                  Active
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
                  Inactive products are hidden from the storefront
                </div>
              </div>
              <Toggle
                checked={watchActive}
                onChange={() => setValue('isActive', !watchActive)}
              />
            </label>

            <div style={{ height: 1, background: '#E2DAC8' }} />

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>
                  Free Gift
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
                  Orders containing this product will include a free gift
                </div>
              </div>
              <Toggle
                checked={watchHasFreeGift}
                onChange={() => setValue('hasFreeGift', !watchHasFreeGift)}
              />
            </label>
          </div>
        </div>

        {/* ── Sticky footer ──────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            marginLeft: -40,
            marginRight: -40,
            marginBottom: -32,
            padding: '14px 40px',
            background: '#F5F0E8',
            borderTop: '1px solid #E2DAC8',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            zIndex: 20,
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            style={{
              padding: '9px 20px',
              background: 'transparent',
              border: '1px solid #E2DAC8',
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 12,
              color: '#6B6057',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '9px 24px',
              background: isSubmitting ? '#D4B97A' : '#C49A3C',
              border: 'none',
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.15s',
            }}
          >
            {isSubmitting
              ? (isEditing ? 'Updating…' : 'Creating…')
              : (isEditing ? 'Update Product' : 'Save Product')}
          </button>
        </div>
      </form>
    </div>
  )
}
