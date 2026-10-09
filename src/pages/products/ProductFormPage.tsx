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
  updateVideo,
  deleteVideo,
  type ProductPayload,
} from '../../api/products.api'
import { getCategories } from '../../api/categories.api'
import { getSubCategories } from '../../api/subcategories.api'
import { getRashis } from '../../api/rashis.api'
import { getPurposes } from '../../api/purposes.api'
import { getRashiProductMappings } from '../../api/rashiProductMappings.api'
import { getPurposeProductMappings } from '../../api/purposeProductMappings.api'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:                   z.string().min(1, 'Name is required'),
  slug:                   z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  sku:                    z.string().min(1, 'SKU is required'),
  shortDescription:       z.string().max(200, 'Max 200 characters'),
  description:            z.string().min(1, 'Description is required'),
  careInstructions:       z.string(),
  howToUse:               z.string(),
  metaphysicalProperties: z.string(),
  price:                  z.preprocess(
    value => value === '' || value === null ? undefined : value,
    z.coerce.number().min(0, 'Price cannot be negative').optional(),
  ),
  comparePrice:           z.string(),
  costPrice:              z.string(),
  stock:                  z.coerce.number().min(0, 'Stock cannot be negative'),
  lowStockThreshold:      z.coerce.number().min(0),
  useCategoryShipping:    z.boolean(),
  shippingWeight:         z.string(),
  shippingTotalWeight:    z.string().refine(
    value => !value.trim() || /^\s*\d+(?:\.\d+)?\s*(?:kg|kgs|kilograms?|g|grams?|mg|milligrams?|lb|lbs|pounds?|oz|ounces?)\s*$/i.test(value),
    'Enter a weight with units, for example 250 g or 1.2 kg',
  ),
  shippingLength:         z.string(),
  shippingBreadth:        z.string(),
  shippingHeight:         z.string(),
  productWeight:          z.string(),
  productLength:          z.string(),
  productBreadth:         z.string(),
  productHeight:          z.string(),
  productDimensions:      z.string(),
  productSize:            z.string(),
  category:               z.string().min(1, 'Category is required'),
  subCategory:            z.string(),
  tags:                   z.array(z.string()),
  chakra:                 z.string(),
  purposeTags:            z.array(z.string()),
  shape:                  z.string().max(100, 'Max 100 characters'),
  color:                  z.string().max(100, 'Max 100 characters'),
  rudrakshaFaces:         z.string().max(50, 'Max 50 characters'),
  beadSize:               z.string().max(50, 'Max 50 characters'),
  noOfSticks:             z.preprocess(
    value => value === '' ? undefined : value,
    z.coerce.number().int().min(1, 'Must be at least 1').optional(),
  ),
  rashiIds:               z.array(z.string()),
  purposeIds:             z.array(z.string()),
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
const ACCEPTED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']

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

// ── Multi-select chips (pick from a fixed list, e.g. Rashi/Purpose) ────────────

function MultiSelectChips({
  options,
  selected = [],
  onChange,
  placeholder,
}: {
  options: { id: string; label: string }[]
  selected?: string[]
  onChange: (ids: string[]) => void
  placeholder: string
}) {
  const available = options.filter(o => !selected.includes(o.id))
  const labelFor = (id: string) => options.find(o => o.id === id)?.label ?? id

  return (
    <div>
      <select
        value=""
        onChange={e => {
          if (e.target.value) onChange([...selected, e.target.value])
        }}
        className="admin-input"
        style={{ ...INPUT, appearance: 'auto', cursor: 'pointer' }}
      >
        <option value="">{placeholder}</option>
        {available.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {selected.map(id => (
            <span
              key={id}
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
              {labelFor(id)}
              <button
                type="button"
                onClick={() => onChange(selected.filter(s => s !== id))}
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
  const [video, setVideo]           = useState<{ url: string; file?: File; isExisting: boolean } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef                = useRef<HTMLInputElement>(null)

  // Keep a ref so the unmount cleanup can revoke blob URLs without a stale closure
  const imagesRef = useRef<ImageItem[]>([])
  useEffect(() => { imagesRef.current = images }, [images])
  useEffect(() => () => imagesRef.current.forEach(img => { if (!img.isExisting) URL.revokeObjectURL(img.url) }), [])
  useEffect(() => () => {
    if (video && !video.isExisting) URL.revokeObjectURL(video.url)
  }, [video])

  const totalImages = images.length

  const handleVideoFile = (file?: File) => {
    if (!file || !ACCEPTED_VIDEO.includes(file.type)) return
    setVideo(previous => {
      if (previous && !previous.isExisting) URL.revokeObjectURL(previous.url)
      return { url: URL.createObjectURL(file), file, isExisting: false }
    })
  }

  const removeVideo = () => {
    setVideo(previous => {
      if (previous && !previous.isExisting) URL.revokeObjectURL(previous.url)
      return null
    })
  }

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

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', slug: '', sku: '', shortDescription: '', description: '',
      careInstructions: '', howToUse: '', metaphysicalProperties: '',
      price: '', comparePrice: '', costPrice: '', stock: 0, lowStockThreshold: 5,
      useCategoryShipping: true, shippingWeight: '', shippingTotalWeight: '', shippingLength: '', shippingBreadth: '', shippingHeight: '',
      productWeight: '', productLength: '', productBreadth: '', productHeight: '', productDimensions: '', productSize: '',
      category: '', subCategory: '', tags: [], chakra: '', purposeTags: [], shape: '', color: '', rudrakshaFaces: '', beadSize: '', noOfSticks: '', rashiIds: [], purposeIds: [], badge: '', isFeatured: false, isActive: true, hasFreeGift: false,
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const watchName       = watch('name')
  const watchSlug       = watch('slug')
  const watchSubCategory = watch('subCategory')
  const watchBadge      = watch('badge')
  const watchTags       = watch('tags')
  const watchRashiIds   = watch('rashiIds')
  const watchPurposeIds = watch('purposeIds')
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

  const { data: rashis } = useQuery({
    queryKey: ['admin-rashis'],
    queryFn: getRashis,
    staleTime: 5 * 60_000,
  })

  const { data: purposes } = useQuery({
    queryKey: ['admin-purposes'],
    queryFn: getPurposes,
    staleTime: 5 * 60_000,
  })

  // Rashi/Purpose selections live in separate mapping collections, not on the
  // product itself — fetch this product's current mappings separately so the
  // form can pre-populate them when editing.
  const { data: existingRashiMappings } = useQuery({
    queryKey: ['rashi-mappings-for-product', product?._id],
    queryFn: () => getRashiProductMappings({ product: product!._id }),
    enabled: isEditing && !!product,
  })

  const { data: existingPurposeMappings } = useQuery({
    queryKey: ['purpose-mappings-for-product', product?._id],
    queryFn: () => getPurposeProductMappings({ product: product!._id }),
    enabled: isEditing && !!product,
  })

  useEffect(() => {
    if (existingRashiMappings) {
      setValue('rashiIds', existingRashiMappings.map(m => m.rashi._id))
    }
  }, [existingRashiMappings, setValue])

  useEffect(() => {
    if (existingPurposeMappings) {
      setValue('purposeIds', existingPurposeMappings.map(m => m.purpose._id))
    }
  }, [existingPurposeMappings, setValue])

  // The category and subcategory lists carry shipping defaults.
  // Fall back to the edited product's own populated category (covers the case where
  // its category is inactive and therefore missing from the public categories list).
  const productCategory = product && typeof product.category === 'object' ? product.category : undefined
  const selectedCategory =
    categories?.find(c => c._id === watchCategory) ??
    (productCategory?._id === watchCategory ? productCategory : undefined)
  const { data: subcategories = [], isFetched: subcategoriesFetched } = useQuery({
    queryKey: ['subcategories-for-category', selectedCategory?.slug],
    queryFn: () => getSubCategories(selectedCategory!.slug),
    enabled: !!selectedCategory?.slug,
    staleTime: 5 * 60_000,
  })
  const selectedSubCategory = subcategories.find(item => item._id === watchSubCategory)
  const selectedShipping = {
    ...selectedCategory?.shipping,
    ...selectedSubCategory?.shipping,
  }
  const isBraceletCategory = Boolean(
    selectedCategory && /bracelet/i.test(`${selectedCategory.name} ${selectedCategory.slug}`),
  )
  const isDhoopstickCategory = Boolean(
    selectedCategory && /dhoop\s*stick|incense/i.test(`${selectedCategory.name} ${selectedCategory.slug}`),
  )
  const isRudrakshaCategory = Boolean(
    selectedCategory && /rudraksha/i.test(`${selectedCategory.name} ${selectedCategory.slug}`),
  )

  useEffect(() => {
    if (!watchCategory || !subcategoriesFetched) return
    if (!subcategories.some(subcategory => subcategory._id === watch('subCategory'))) {
      setValue('subCategory', '')
    }
  }, [watchCategory, subcategories, subcategoriesFetched, setValue, watch])

  // Subcategory values override parent category defaults field by field.
  useEffect(() => {
    if (!watchUseCategoryShipping) return
    setValue('shippingWeight', selectedShipping.weight ?? '')
    setValue('shippingLength', selectedShipping.length ?? '')
    setValue('shippingBreadth', selectedShipping.breadth ?? '')
    setValue('shippingHeight', selectedShipping.height ?? '')
  }, [
    watchUseCategoryShipping,
    selectedShipping.weight,
    selectedShipping.length,
    selectedShipping.breadth,
    selectedShipping.height,
    setValue,
  ])

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
      howToUse:               product.howToUse ?? '',
      metaphysicalProperties: product.metaphysicalProperties ?? '',
      price:                  product.price,
      comparePrice:           product.comparePrice ? String(product.comparePrice) : '',
      costPrice:              '',
      stock:                  product.stock,
      lowStockThreshold:      product.lowStockThreshold,
      useCategoryShipping:    product.useCategoryShipping ?? true,
      shippingWeight:         product.shipping?.weight != null ? String(product.shipping.weight) : '',
      shippingTotalWeight:    product.shipping?.totalWeight ?? '',
      shippingLength:         product.shipping?.length != null ? String(product.shipping.length) : '',
      shippingBreadth:        product.shipping?.breadth != null ? String(product.shipping.breadth) : '',
      shippingHeight:         product.shipping?.height != null ? String(product.shipping.height) : '',
      productWeight:          product.productDetails?.weight ?? '',
      productLength:          product.productDetails?.length ?? '',
      productBreadth:         product.productDetails?.breadth ?? '',
      productHeight:          product.productDetails?.height ?? '',
      productDimensions:      product.productDetails?.dimensions ?? '',
      productSize:            product.productDetails?.size ?? '',
      category:               typeof product.category === 'object'
                                ? product.category._id
                                : product.category,
      subCategory:            typeof product.subCategory === 'object'
                ? product.subCategory._id
                : product.subCategory ?? '',
      tags:                   product.tags ?? [],
      chakra:                 product.chakra ?? '',
      purposeTags:            product.purposeTags ?? [],
      shape:                  product.shape ?? '',
      color:                  product.color ?? '',
      rudrakshaFaces:         product.rudrakshaFaces ?? '',
      beadSize:               product.beadSize ?? '',
      noOfSticks:             product.noOfSticks ?? '',
      rashiIds:               [],
      purposeIds:             [],
      badge:                  product.badge ?? '',
      isFeatured:             product.isFeatured,
      isActive:               product.isActive,
      hasFreeGift:            product.hasFreeGift,
    })
    setImages((product.images ?? []).map(url => ({ url, isExisting: true })))
    setVideo(product.video ? { url: product.video, isExisting: true } : null)
  }, [product, isEditing, reset])

  // ── Submit handler ─────────────────────────────────────────────────────────

  const onSubmit = async (data: FormValues) => {
    const payload: ProductPayload = {
      name:             data.name,
      slug:             data.slug,
      sku:              data.sku.toUpperCase(),
      description:      data.description,
      price:            data.price ?? null,
      stock:            data.stock,
      lowStockThreshold: data.lowStockThreshold,
      category:         data.category,
      subCategory: data.subCategory || null,
      tags:             data.tags,
      purposeTags:      data.purposeTags,
      rashiIds:         data.rashiIds,
      purposeIds:       data.purposeIds,
      isFeatured:       data.isFeatured,
      isActive:         data.isActive,
      hasFreeGift:      data.hasFreeGift,
      useCategoryShipping: data.useCategoryShipping,
      productDetails: {
        ...(data.productWeight.trim() && { weight: data.productWeight.trim() }),
        ...(data.productLength.trim() && { length: data.productLength.trim() }),
        ...(data.productBreadth.trim() && { breadth: data.productBreadth.trim() }),
        ...(data.productHeight.trim() && { height: data.productHeight.trim() }),
        ...(data.productDimensions.trim() && { dimensions: data.productDimensions.trim() }),
        ...(data.productSize.trim() && { size: data.productSize.trim() }),
      },
      ...(data.shortDescription       && { shortDescription: data.shortDescription }),
      ...(data.careInstructions       && { careInstructions: data.careInstructions }),
      ...(data.howToUse               && { howToUse: data.howToUse }),
      ...(data.metaphysicalProperties && { metaphysicalProperties: data.metaphysicalProperties }),
      ...(data.chakra                 && { chakra: data.chakra }),
      ...(data.shape                  && { shape: data.shape.trim() }),
      ...(data.color                  && { color: data.color.trim() }),
      ...(data.rudrakshaFaces         && { rudrakshaFaces: data.rudrakshaFaces.trim() }),
      ...(isBraceletCategory && data.beadSize.trim() && { beadSize: data.beadSize.trim() }),
      ...(isDhoopstickCategory && data.noOfSticks !== undefined && { noOfSticks: data.noOfSticks }),
      ...(data.badge                  && { badge: data.badge }),
      ...(data.comparePrice           && { comparePrice: +data.comparePrice }),
      ...(data.costPrice              && { costPrice: +data.costPrice }),
      shipping: {
        ...(data.useCategoryShipping ? {} : {
          ...(data.shippingWeight   && { weight: data.shippingWeight }),
          ...(data.shippingLength   && { length: data.shippingLength }),
          ...(data.shippingBreadth  && { breadth: data.shippingBreadth }),
          ...(data.shippingHeight   && { height: data.shippingHeight }),
        }),
        ...(data.shippingTotalWeight.trim() && { totalWeight: data.shippingTotalWeight.trim() }),
      },
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

        if (video?.file) {
          const updatedVideo = await updateVideo(product._id, video.file)
          setVideo({ url: updatedVideo, isExisting: true })
        } else if (!video && product.video) {
          await deleteVideo(product._id)
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
        if (video?.file) await updateVideo(created._id, video.file)
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
            <span style={{ display: 'block', marginTop: 6, fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
              Enter one point per line — each line will show as a bullet on the site.
            </span>
            {errors.description && <span style={ERR}>{errors.description.message}</span>}
          </div>

          <div style={GRID2}>
            <div style={FIELD}>
              <label style={LABEL}>Care Instructions</label>
              <textarea
                {...register('careInstructions')}
                placeholder="Enter each care instruction on a separate line…"
                className="admin-input"
                style={{ ...TEXTAREA, minHeight: 80 }}
              />
              <span style={{ display: 'block', marginTop: 6, fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
                Enter one instruction per line; each line appears as a bullet on the product page.
              </span>
            </div>

            <div style={FIELD}>
              <label style={LABEL}>How to Use</label>
              <textarea
                {...register('howToUse')}
                placeholder="Enter each usage step on a separate line…"
                className="admin-input"
                style={{ ...TEXTAREA, minHeight: 80 }}
              />
              <span style={{ display: 'block', marginTop: 6, fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
                Enter one step per line; each line appears as a bullet on the product page.
              </span>
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Properties &amp; Benefits</label>
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
              <label style={LABEL}>Price (₹)</label>
              <input
                {...register('price')}
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave blank to accept inquiries"
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

        {/* ── Section 3a: Product details ──────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>Product Details</p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: -12, marginBottom: 16 }}>
            Optional item measurements shown to customers. Include units, such as 120 g or 8 cm.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            {([
              ['productWeight', 'Weight'],
              ['productLength', 'Length'],
              ['productBreadth', 'Breadth'],
              ['productHeight', 'Height'],
              ['productDimensions', 'Dimensions'],
              ['productSize', 'Size'],
            ] as const).map(([field, label]) => (
              <div style={FIELD} key={field}>
                <label style={LABEL}>{label}</label>
                <input
                  {...register(field)}
                  type="text"
                  placeholder={
                    label === 'Weight' ? 'e.g. 120 g'
                      : label === 'Dimensions' ? 'e.g. 8 x 4 x 2 cm'
                      : label === 'Size' ? 'e.g. M / L or 7 inch'
                      : 'Optional'
                  }
                  className="admin-input"
                  style={INPUT}
                />
              </div>
            ))}
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
                Use Category &amp; Sub-Category Shipping
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
                Sub-category defaults override the parent category where provided
              </div>
            </div>
            <Toggle
              checked={watchUseCategoryShipping}
              onChange={() => setValue('useCategoryShipping', !watchUseCategoryShipping)}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            {([
              ['shippingWeight', 'Weight'],
              ['shippingLength', 'Length'],
              ['shippingBreadth', 'Breadth'],
              ['shippingHeight', 'Height'],
            ] as const).map(([field, label]) => (
              <div style={FIELD} key={field}>
                <label style={LABEL}>{label}</label>
                <input
                  {...register(field)}
                  type="text"
                  disabled={watchUseCategoryShipping}
                  placeholder={watchUseCategoryShipping ? '' : field === 'shippingWeight' ? 'e.g. 120 g or 0.12 kg' : 'Optional'}
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
          <div style={{ ...FIELD, marginTop: 18, maxWidth: 360 }}>
            <label style={LABEL}>Total Shipping Weight</label>
            <input
              {...register('shippingTotalWeight')}
              type="text"
              placeholder="For example, 250 g or 1.2 kg"
              className="admin-input"
              style={INPUT}
            />
            <span style={{ display: 'block', marginTop: 6, fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
              Per item: include the product, gift, and packaging. Supported units: g, kg, mg, lb, oz.
            </span>
            {errors.shippingTotalWeight && <span style={ERR}>{errors.shippingTotalWeight.message}</span>}
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

            {subcategories.length > 0 && (
              <div style={FIELD}>
                <label style={LABEL}>Sub-Category</label>
                <select
                  {...register('subCategory')}
                  className="admin-input"
                  style={{ ...INPUT, appearance: 'auto', cursor: 'pointer' }}
                >
                  <option value="">No sub-category</option>
                  {subcategories.map(subcategory => (
                    <option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>
                  ))}
                </select>
              </div>
            )}

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

          {(isBraceletCategory || isDhoopstickCategory || isRudrakshaCategory) && (
            <div style={GRID2}>
              {isBraceletCategory && (
                <div style={FIELD}>
                  <label style={LABEL}>Bead Size</label>
                  <input
                    {...register('beadSize')}
                    placeholder="e.g. 8mm or 8-10mm"
                    className="admin-input"
                    style={INPUT}
                  />
                </div>
              )}

              {isDhoopstickCategory && (
                <div style={FIELD}>
                  <label style={LABEL}>No. of Sticks</label>
                  <input
                    {...register('noOfSticks')}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 20"
                    className="admin-input"
                    style={INPUT}
                  />
                  {errors.noOfSticks && <span style={ERR}>{errors.noOfSticks.message}</span>}
                </div>
              )}

              {isRudrakshaCategory && (
                <div style={FIELD}>
                  <label style={LABEL}>Rudraksha Faces</label>
                  <input
                    {...register('rudrakshaFaces')}
                    placeholder="e.g. 5 or Gauri Shankar"
                    className="admin-input"
                    style={INPUT}
                  />
                </div>
              )}
            </div>
          )}

          <div style={GRID2}>
            {/* Rashi */}
            <div style={FIELD}>
              <label style={LABEL}>Rashi</label>
              <MultiSelectChips
                options={(rashis ?? []).map(r => ({ id: r._id, label: r.name }))}
                selected={watchRashiIds}
                onChange={ids => setValue('rashiIds', ids)}
                placeholder="Add a Rashi…"
              />
            </div>

            {/* Purpose */}
            <div style={FIELD}>
              <label style={LABEL}>Purpose</label>
              <MultiSelectChips
                options={(purposes ?? []).map(p => ({ id: p._id, label: p.name }))}
                selected={watchPurposeIds}
                onChange={ids => setValue('purposeIds', ids)}
                placeholder="Add a Purpose…"
              />
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Shape</label>
              <input
                {...register('shape')}
                placeholder="e.g. Round, Oval, Tumbled"
                className="admin-input"
                style={INPUT}
              />
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Color</label>
              <input
                {...register('color')}
                placeholder="e.g. Clear, Rose, Green"
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

        {/* ── Section 6: Product video ──────────────────────────────────────── */}
        <div style={SECTION}>
          <p style={SECTION_TITLE}>Product video</p>
          {video ? (
            <div style={{ position: 'relative', maxWidth: 360 }}>
              <video
                src={video.url}
                controls
                muted
                preload="metadata"
                style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'contain', display: 'block', borderRadius: 4, background: '#1C1A17' }}
              />
              <button
                type="button"
                onClick={removeVideo}
                title="Remove video"
                style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#A85050', border: '2px solid #F5F0E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
              {!video.isExisting && <p style={{ fontFamily: FONT, fontSize: 11, color: '#7B5EA7', marginTop: 8 }}>Pending upload</p>}
            </div>
          ) : (
            <label style={{ display: 'block', maxWidth: 420, cursor: 'pointer' }}>
              <div style={{ background: '#EDE8DC', border: '2px dashed #C4B89A', borderRadius: 4, padding: '28px 20px', textAlign: 'center' }}>
                <Upload size={22} color="#9E9590" style={{ marginBottom: 8 }} />
                <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', marginBottom: 4 }}>Click to upload a product video</p>
                <p style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>MP4, WebM, MOV · max 100 MB</p>
              </div>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                style={{ display: 'none' }}
                onChange={e => { handleVideoFile(e.target.files?.[0]); e.target.value = '' }}
              />
            </label>
          )}
        </div>

        {/* ── Section 7: Visibility ──────────────────────────────────────────── */}
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
