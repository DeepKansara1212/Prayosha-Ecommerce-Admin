import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, Pencil, ChevronUp, ChevronDown, EyeOff, Eye, UploadCloud } from 'lucide-react'
import {
  getAdminBanners,
  createBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,
  reorderBanners,
  type HeroBanner,
} from '../../api/heroBanners.api'
import { useToast } from '../../store/toastStore'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif"

// ── Shared styles ─────────────────────────────────────────────────────────────

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
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  display: 'block',
  marginBottom: 6,
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
      title={confirming ? 'Click again to confirm' : 'Delete banner'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 30,
        padding: confirming ? '0 10px' : '0',
        width: confirming ? 'auto' : 30,
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

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        borderRadius: 10,
        background: active ? '#ECFDF5' : '#F3F4F6',
        color: active ? '#5A8A6A' : '#9E9590',
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: active ? '#5A8A6A' : '#9E9590',
          flexShrink: 0,
        }}
      />
      {active ? 'Live' : 'Hidden'}
    </span>
  )
}

// ── BannerDrawer ──────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  editing: HeroBanner | null
  onClose: () => void
  onSave: (form: FormData, id?: string) => void
  isPending: boolean
}

function BannerDrawer({ open, editing, onClose, onSave, isPending }: DrawerProps) {
  const [order, setOrder] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (editing) {
        setOrder(String(editing.order))
        setIsActive(editing.isActive)
        setImageFile(null)
        setImagePreview(editing.imageUrl)
      } else {
        setOrder('0')
        setIsActive(true)
        setImageFile(null)
        setImagePreview(null)
      }
    }
  }, [open, editing])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing && !imageFile) return

    const form = new FormData()
    if (imageFile) form.append('image', imageFile)
    form.append('order', order || '0')
    form.append('isActive', String(isActive))

    onSave(form, editing?._id)
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.4)', zIndex: 100 }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 480,
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
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: '#1C1A17' }}>
            {editing ? 'Edit Banner' : 'New Banner'}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9E9590',
              display: 'flex',
              padding: 4,
            }}
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
            <label style={LABEL}>
              Banner Image {!editing && <span style={{ color: '#A85050' }}>*</span>}
            </label>

            {/* Preview / drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed',
                borderColor: imagePreview ? '#C49A3C' : '#E2DAC8',
                borderRadius: 4,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => {
                if (!imagePreview) (e.currentTarget as HTMLDivElement).style.borderColor = '#C4B89A'
              }}
              onMouseLeave={e => {
                if (!imagePreview) (e.currentTarget as HTMLDivElement).style.borderColor = '#E2DAC8'
              }}
            >
              {imagePreview ? (
                <div style={{ position: 'relative', aspectRatio: '16/7' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(28,26,23,0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.15s',
                      fontFamily: FONT,
                      fontSize: 12,
                      color: 'transparent',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.background = 'rgba(28,26,23,0.45)'
                      el.style.color = '#F5F0E8'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.background = 'rgba(28,26,23,0)'
                      el.style.color = 'transparent'
                    }}
                  >
                    Click to change
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    aspectRatio: '16/7',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: '#C4B89A',
                  }}
                >
                  <UploadCloud size={28} strokeWidth={1.2} />
                  <div>
                    <p style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590', margin: 0, textAlign: 'center' }}>
                      Click to upload image
                    </p>
                    <p style={{ fontFamily: FONT, fontSize: 10, color: '#C4B89A', margin: '4px 0 0', textAlign: 'center' }}>
                      JPG, PNG, WebP — max 5 MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
          </div>

          {/* Live Preview */}
          {imagePreview && (
            <div>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={LABEL}>Live Preview</span>
                <div style={{ flex: 1, height: 1, background: '#E2DAC8' }} />
                <span style={{ fontFamily: FONT, fontSize: 10, color: '#C4B89A', letterSpacing: '0.04em' }}>
                  approximate
                </span>
              </div>

              {/* Hero mockup shell */}
              <div
                style={{
                  position: 'relative',
                  background: '#1C1A17',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid #2E2B25',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                }}
              >
                {/* Simulated navbar bar */}
                <div
                  style={{
                    height: 12,
                    background: '#1C1A17',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {/* Logo stub */}
                  <div style={{ width: 28, height: 3, background: 'rgba(255,255,255,0.18)', borderRadius: 1 }} />
                  <div style={{ flex: 1 }} />
                  {/* Nav links stubs */}
                  {[14, 18, 14, 10].map((w, i) => (
                    <div key={i} style={{ width: w, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
                  ))}
                  {/* Icon stubs */}
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                </div>

                {/* Banner image + overlay controls */}
                <div style={{ position: 'relative', aspectRatio: '16/7' }}>
                  <img
                    src={imagePreview}
                    alt="Hero preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />

                  {/* Left arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 22,
                      height: 22,
                      border: '1px solid rgba(255,255,255,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.45)',
                      background: 'rgba(28,26,23,0.25)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <svg viewBox="0 0 16 16" style={{ width: 8, height: 8 }} fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 12 6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Right arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 22,
                      height: 22,
                      border: '1px solid rgba(255,255,255,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.45)',
                      background: 'rgba(28,26,23,0.25)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <svg viewBox="0 0 16 16" style={{ width: 8, height: 8 }} fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 12l4-4-4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Dot indicators — active dot = this banner */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <div style={{ width: 16, height: 2.5, background: '#C49A3C', borderRadius: 1 }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
                  </div>
                </div>
              </div>

              <p style={{ fontFamily: FONT, fontSize: 10, color: '#9E9590', margin: '6px 0 0' }}>
                This is how the slide will appear in the homepage carousel.
              </p>
            </div>
          )}

          {/* Order + Active */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={LABEL}>Order</label>
              <input
                type="number"
                min={0}
                value={order}
                onChange={e => setOrder(e.target.value)}
                style={{ ...INPUT_BASE, width: '100%' }}
              />
              <span style={{ fontFamily: FONT, fontSize: 10, color: '#9E9590', marginTop: 4, display: 'block' }}>Lower = shown first</span>
            </div>
            <div>
              <label style={LABEL}>Visibility</label>
              <button
                type="button"
                onClick={() => setIsActive(v => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 14px',
                  border: '1px solid',
                  borderColor: isActive ? '#5A8A6A' : '#E2DAC8',
                  borderRadius: 4,
                  background: isActive ? '#ECFDF5' : 'transparent',
                  color: isActive ? '#5A8A6A' : '#9E9590',
                  fontFamily: FONT,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                {isActive ? 'Visible (live)' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || (!editing && !imageFile)}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              background: isPending || (!editing && !imageFile) ? '#C4B89A' : '#C49A3C',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 500,
              cursor: isPending || (!editing && !imageFile) ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              if (!isPending && (editing || imageFile))
                (e.currentTarget as HTMLButtonElement).style.background = '#B8892E'
            }}
            onMouseLeave={e => {
              if (!isPending && (editing || imageFile))
                (e.currentTarget as HTMLButtonElement).style.background = '#C49A3C'
            }}
          >
            {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Banner'}
          </button>
        </form>
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HeroBannersPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-hero-banners'],
    queryFn: getAdminBanners,
  })

  const saveMutation = useMutation({
    mutationFn: ({ form, id }: { form: FormData; id?: string }) =>
      id ? updateBanner(id, form) : createBanner(form),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-hero-banners'] })
      setDrawerOpen(false)
      setEditingBanner(null)
      toast.success(id ? 'Banner updated' : 'Banner created')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to save banner'
      toast.error(msg)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleBanner,
    onSuccess: (updated) => {
      qc.setQueryData(['admin-hero-banners'], (old: HeroBanner[] | undefined) =>
        (old ?? []).map(b => (b._id === updated._id ? updated : b))
      )
      toast.success(updated.isActive ? 'Banner is now live' : 'Banner hidden')
    },
    onError: () => toast.error('Failed to toggle banner'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hero-banners'] })
      toast.success('Banner deleted')
    },
    onError: () => toast.error('Failed to delete banner'),
  })

  const reorderMutation = useMutation({
    mutationFn: reorderBanners,
    onSuccess: (updated) => {
      qc.setQueryData(['admin-hero-banners'], updated)
    },
    onError: () => toast.error('Reorder failed'),
  })

  const banners = data ?? []

  const openCreate = () => { setEditingBanner(null); setDrawerOpen(true) }
  const openEdit = (b: HeroBanner) => { setEditingBanner(b); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setEditingBanner(null) }

  const swap = (banner: HeroBanner, dir: 'up' | 'down') => {
    const idx = banners.findIndex(b => b._id === banner._id)
    const sibIdx = dir === 'up' ? idx - 1 : idx + 1
    if (sibIdx < 0 || sibIdx >= banners.length) return
    const sib = banners[sibIdx]
    reorderMutation.mutate([
      { id: banner._id, order: sib.order },
      { id: sib._id, order: banner.order },
    ])
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 500, color: '#1C1A17', margin: 0 }}>
            Hero Banners
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590', margin: '4px 0 0' }}>
            {banners.length > 0
              ? `${banners.filter(b => b.isActive).length} live · ${banners.length} total`
              : 'Manage the homepage carousel'}
          </p>
        </div>
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
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#B8892E')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#C49A3C')}
        >
          + New Banner
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        /* Skeleton grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                background: '#EDE8DC',
                border: '1px solid #E2DAC8',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div style={{ aspectRatio: '16/7', background: '#E2DAC8', animation: 'pulse 1.5s ease infinite' }} />
              <div style={{ padding: 14 }}>
                <div style={{ height: 12, background: '#E2DAC8', borderRadius: 2, width: '60%', marginBottom: 8 }} />
                <div style={{ height: 10, background: '#E8E2D8', borderRadius: 2, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: '#EDE8DC',
            border: '1px solid #E2DAC8',
            borderRadius: 4,
            fontFamily: FONT,
            fontSize: 13,
            color: '#A85050',
          }}
        >
          Failed to load banners. Please refresh.
        </div>
      ) : banners.length === 0 ? (
        <div
          style={{
            padding: 64,
            textAlign: 'center',
            background: '#EDE8DC',
            border: '2px dashed #E2DAC8',
            borderRadius: 4,
          }}
        >
          <p style={{ fontFamily: FONT, fontSize: 14, color: '#6B6057', margin: '0 0 6px' }}>
            No banners yet
          </p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590', margin: 0 }}>
            Click "+ New Banner" to add the first homepage slide.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {banners.map((banner, idx) => (
            <div
              key={banner._id}
              style={{
                background: '#EDE8DC',
                border: '1px solid #E2DAC8',
                borderRadius: 4,
                overflow: 'hidden',
                opacity: banner.isActive ? 1 : 0.65,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', aspectRatio: '16/7', background: '#D4CDB8' }}>
                <img
                  src={banner.imageUrl}
                  alt={banner.title ?? `Banner ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {/* Status overlay badge */}
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <StatusBadge active={banner.isActive} />
                </div>

                {/* Order badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(28,26,23,0.55)',
                    backdropFilter: 'blur(4px)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontFamily: FONT,
                    fontSize: 10,
                    color: '#F5F0E8',
                    letterSpacing: '0.05em',
                  }}
                >
                  #{banner.order}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '12px 14px' }}>
                {/* Divider */}
                <div style={{ height: 1, background: '#E2DAC8', margin: '0 0 10px' }} />

                {/* Action row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Reorder */}
                  <button
                    onClick={() => swap(banner, 'up')}
                    disabled={idx === 0 || reorderMutation.isPending}
                    title="Move up"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      border: '1px solid #E2DAC8',
                      background: 'transparent',
                      color: idx === 0 ? '#D4CDB8' : '#9E9590',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      padding: 0,
                    }}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={() => swap(banner, 'down')}
                    disabled={idx === banners.length - 1 || reorderMutation.isPending}
                    title="Move down"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      border: '1px solid #E2DAC8',
                      background: 'transparent',
                      color: idx === banners.length - 1 ? '#D4CDB8' : '#9E9590',
                      cursor: idx === banners.length - 1 ? 'not-allowed' : 'pointer',
                      padding: 0,
                    }}
                  >
                    <ChevronDown size={13} />
                  </button>

                  <div style={{ flex: 1 }} />

                  {/* Toggle visibility */}
                  <button
                    onClick={() => toggleMutation.mutate(banner._id)}
                    disabled={toggleMutation.isPending}
                    title={banner.isActive ? 'Hide banner' : 'Make live'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 30,
                      height: 30,
                      borderRadius: 4,
                      border: '1px solid #E2DAC8',
                      background: 'transparent',
                      color: banner.isActive ? '#5A8A6A' : '#9E9590',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#F5F0E8')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                  >
                    {banner.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(banner)}
                    title="Edit banner"
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

                  {/* Delete */}
                  <DeleteButton
                    onConfirm={() => deleteMutation.mutate(banner._id)}
                    disabled={deleteMutation.isPending}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      <BannerDrawer
        open={drawerOpen}
        editing={editingBanner}
        onClose={closeDrawer}
        onSave={(form, id) => saveMutation.mutate({ form, id })}
        isPending={saveMutation.isPending}
      />
    </div>
  )
}
