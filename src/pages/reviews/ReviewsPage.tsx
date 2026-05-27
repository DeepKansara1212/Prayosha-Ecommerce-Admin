import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, CheckCircle, AlertCircle, Trash2, ChevronLeft, ChevronRight, MessageSquare, CheckSquare } from 'lucide-react'
import {
  getAllReviews,
  approveReview,
  deleteReview,
  type Review,
} from '../../api/reviews.api'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif"

type Tab = 'pending' | 'approved'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={13}
          style={{
            fill: i < rating ? '#C49A3C' : 'transparent',
            stroke: i < rating ? '#C49A3C' : '#D1C5A8',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ type, message }: { type: 'success' | 'error' | 'warning'; message: string }) {
  const bg = type === 'error' ? '#A85050' : '#1C1A17'
  const icon =
    type === 'success' ? <CheckCircle size={15} color="#5A8A6A" /> :
    type === 'warning' ? <AlertCircle  size={15} color="#C49A3C" /> :
                         <AlertCircle  size={15} color="#fff" />
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
        background: bg,
        borderRadius: 4,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        maxWidth: 380,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {icon}
      <span style={{ fontFamily: FONT, fontSize: 13, color: '#fff' }}>{message}</span>
    </div>
  )
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  tab,
  onApprove,
  onDelete,
  approving,
  deleting,
  selected,
  onToggle,
}: {
  review: Review
  tab: Tab
  onApprove: (review: Review) => void
  onDelete: (id: string) => void
  approving: boolean
  deleting: boolean
  selected: boolean
  onToggle: () => void
}) {
  const thumb = review.product?.images?.[0]

  return (
    <div
      style={{
        background: selected ? '#F0EAF7' : '#EDE8DC',
        border: `1px solid ${selected ? '#C4B0E0' : '#E2DAC8'}`,
        borderRadius: 4,
        padding: 16,
        display: 'flex',
        gap: 14,
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      {/* Checkbox */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', paddingTop: 3 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          style={{ cursor: 'pointer', accentColor: '#7B5EA7', width: 14, height: 14 }}
        />
      </div>

      {/* Product thumbnail */}
      <div style={{ flexShrink: 0 }}>
        {thumb ? (
          <img
            src={thumb}
            alt={review.product?.name ?? ''}
            style={{
              width: 56,
              height: 56,
              objectFit: 'cover',
              borderRadius: 3,
              border: '1px solid #E2DAC8',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 3,
              border: '1px solid #E2DAC8',
              background: '#F5F0E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C4B89A',
              fontSize: 9,
              fontFamily: FONT,
              textAlign: 'center',
            }}
          >
            No img
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Product name */}
        <div
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#7B5EA7',
            marginBottom: 6,
          }}
        >
          {review.product?.name ?? '—'}
        </div>

        {/* Reviewer meta row */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#1C1A17' }}>
            {review.user?.name ?? 'Unknown'}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
            {fmtDate(review.createdAt)}
          </span>
          {review.isVerifiedPurchase && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 7px',
                background: '#ECFDF5',
                color: '#5A8A6A',
                borderRadius: 12,
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              <CheckCircle size={10} />
              Verified Purchase
            </span>
          )}
        </div>

        {/* Star rating */}
        <div style={{ marginBottom: 6 }}>
          <StarRating rating={review.rating} />
        </div>

        {/* Title + body */}
        <div
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 600,
            color: '#1C1A17',
            marginBottom: 4,
          }}
        >
          {review.title}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 12,
            color: '#6B6057',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {review.body}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {tab === 'pending' && (
            <button
              onClick={() => onApprove(review)}
              disabled={approving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                background: 'transparent',
                border: '1px solid #5A8A6A',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 500,
                color: '#5A8A6A',
                cursor: approving ? 'not-allowed' : 'pointer',
                opacity: approving ? 0.6 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (!approving) (e.currentTarget as HTMLButtonElement).style.background = '#ECFDF5'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <CheckCircle size={12} />
              {approving ? 'Approving…' : 'Approve'}
            </button>
          )}
          <button
            onClick={() => onDelete(review._id)}
            disabled={deleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid #A85050',
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 500,
              color: '#A85050',
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.6 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              if (!deleting) (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            <Trash2 size={12} />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const qc = useQueryClient()

  const [activeTab, setActiveTab]     = useState<Tab>('pending')
  const [pendingPage, setPendingPage] = useState(1)
  const [approvedPage, setApprovedPage] = useState(1)

  // Optimistic approvals: reviews moved to approved before API confirms
  const [justApproved, setJustApproved] = useState<Review[]>([])

  // ── Bulk selection ────────────────────────────────────────────────────────────

  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set())
  const [bulkPending, setBulkPending]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const selectAllRef                    = useRef<HTMLInputElement>(null)

  // ── Toast ─────────────────────────────────────────────────────────────────────

  const [toast, setToast]   = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const toastTimer          = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, message })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // ── Queries ───────────────────────────────────────────────────────────────────

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-reviews', 'pending', pendingPage],
    queryFn: () => getAllReviews({ status: 'pending', page: pendingPage, limit: 10 }),
    placeholderData: (prev) => prev,
  })

  const { data: approvedData, isLoading: approvedLoading } = useQuery({
    queryKey: ['admin-reviews', 'approved', approvedPage],
    queryFn: () => getAllReviews({ status: 'approved', page: approvedPage, limit: 10 }),
    placeholderData: (prev) => prev,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveReview(id),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
  })

  // ── Single-item handlers ──────────────────────────────────────────────────────

  const handleApprove = (review: Review) => {
    setJustApproved(prev => [...prev, { ...review, isApproved: true }])
    setActiveTab('approved')

    approveMutation.mutate(review._id, {
      onSuccess: () => {
        setJustApproved(prev => prev.filter(r => r._id !== review._id))
        qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      },
      onError: () => {
        setJustApproved(prev => prev.filter(r => r._id !== review._id))
        setActiveTab('pending')
      },
    })
  }

  const handleDelete = (id: string) => {
    setJustApproved(prev => prev.filter(r => r._id !== id))
    deleteMutation.mutate(id)
  }

  // ── Bulk action handlers ──────────────────────────────────────────────────────

  const handleApproveAll = async () => {
    const ids = [...selectedIds]
    setBulkPending(true)
    const results = await Promise.allSettled(ids.map(id => approveReview(id)))
    const fulfilled = results.filter(r => r.status === 'fulfilled').length
    const failed    = results.filter(r => r.status === 'rejected').length
    setBulkPending(false)
    setSelectedIds(new Set())
    qc.invalidateQueries({ queryKey: ['admin-reviews'] })
    if (failed === 0) {
      showToast('success', `Approved ${fulfilled} review${fulfilled !== 1 ? 's' : ''}`)
    } else {
      showToast('warning', `${fulfilled} approved, ${failed} failed`)
    }
  }

  const handleDeleteAll = async () => {
    setConfirmDelete(false)
    const ids = [...selectedIds]
    setBulkPending(true)
    const results = await Promise.allSettled(ids.map(id => deleteReview(id)))
    const fulfilled = results.filter(r => r.status === 'fulfilled').length
    const failed    = results.filter(r => r.status === 'rejected').length
    setBulkPending(false)
    setSelectedIds(new Set())
    qc.invalidateQueries({ queryKey: ['admin-reviews'] })
    if (failed === 0) {
      showToast('success', `Deleted ${fulfilled} review${fulfilled !== 1 ? 's' : ''}`)
    } else {
      showToast('warning', `${fulfilled} deleted, ${failed} failed`)
    }
  }

  // ── Tab switching clears selection ────────────────────────────────────────────

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSelectedIds(new Set())
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  const pendingReviews = (pendingData?.reviews ?? []).filter(
    r => !justApproved.some(j => j._id === r._id),
  )
  const approvedReviews = [...justApproved, ...(approvedData?.reviews ?? [])]

  const pendingPagination  = pendingData?.pagination
  const approvedPagination = approvedData?.pagination

  const isCurrentLoading  = activeTab === 'pending' ? pendingLoading : approvedLoading
  const currentReviews    = activeTab === 'pending' ? pendingReviews : approvedReviews
  const currentPagination = activeTab === 'pending' ? pendingPagination : approvedPagination
  const setCurrentPage    = activeTab === 'pending' ? setPendingPage : setApprovedPage
  const currentPage       = activeTab === 'pending' ? pendingPage : approvedPage

  const pendingCount  = (pendingData?.pagination.total ?? 0) - justApproved.length
  const approvedCount = approvedData?.pagination.total ?? 0

  // ── Select-all indeterminate state ────────────────────────────────────────────

  const allSelected  = currentReviews.length > 0 && currentReviews.every(r => selectedIds.has(r._id))
  const someSelected = !allSelected && currentReviews.some(r => selectedIds.has(r._id))

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
      selectAllRef.current.checked       = allSelected
    }
  }, [allSelected, someSelected])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(currentReviews.map(r => r._id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: selectedIds.size > 0 ? 72 : 0 }}>
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Header */}
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 500,
          color: '#1C1A17',
          marginBottom: 24,
        }}
      >
        Reviews
      </h1>

      {/* Tabs + Select-all */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '2px solid #E2DAC8',
          marginBottom: 24,
        }}
      >
        {([
          { key: 'pending' as Tab, label: 'Pending Approval', count: pendingCount },
          { key: 'approved' as Tab, label: 'Approved',        count: approvedCount },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #7B5EA7' : '2px solid transparent',
              marginBottom: -2,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#7B5EA7' : '#6B6057',
              cursor: 'pointer',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 18,
                padding: '0 6px',
                borderRadius: 10,
                background: activeTab === tab.key ? '#7B5EA7' : '#E2DAC8',
                color: activeTab === tab.key ? '#fff' : '#6B6057',
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}

        {/* Select all — pushed to right */}
        {currentReviews.length > 0 && !isCurrentLoading && (
          <label
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 4px 0 12px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              ref={selectAllRef}
              type="checkbox"
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer', accentColor: '#7B5EA7', width: 14, height: 14 }}
            />
            <span style={{ fontFamily: FONT, fontSize: 11, color: '#6B6057' }}>Select all</span>
          </label>
        )}
      </div>

      {/* Review list */}
      {isCurrentLoading ? (
        <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>
          Loading reviews…
        </div>
      ) : currentReviews.length === 0 ? (
        <div
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            background: '#EDE8DC',
            border: '1px solid #E2DAC8',
            borderRadius: 4,
          }}
        >
          {activeTab === 'pending' ? (
            <MessageSquare size={48} style={{ margin: '0 auto 16px', color: '#9E9590', display: 'block' }} />
          ) : (
            <CheckSquare size={48} style={{ margin: '0 auto 16px', color: '#9E9590', display: 'block' }} />
          )}
          <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 500, color: '#1C1A17', marginBottom: 8, marginTop: 0 }}>
            {activeTab === 'pending' ? 'No pending reviews' : 'No approved reviews'}
          </h3>
          <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', marginBottom: 0, marginTop: 0 }}>
            {activeTab === 'pending'
              ? 'All caught up! No reviews waiting for approval.'
              : 'Approved reviews will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentReviews.map(review => (
            <ReviewCard
              key={review._id}
              review={review}
              tab={review.isApproved ? 'approved' : activeTab}
              onApprove={handleApprove}
              onDelete={handleDelete}
              approving={approveMutation.isPending && approveMutation.variables === review._id}
              deleting={deleteMutation.isPending && deleteMutation.variables === review._id}
              selected={selectedIds.has(review._id)}
              onToggle={() => toggleOne(review._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {currentPagination && currentPagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            padding: '10px 0',
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590' }}>
            {currentPagination.total} review{currentPagination.total !== 1 ? 's' : ''} · page {currentPage} of {currentPagination.totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!currentPagination.hasPrev}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: '#EDE8DC',
                border: '1px solid #E2DAC8',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 12,
                color: currentPagination.hasPrev ? '#1C1A17' : '#C4B89A',
                cursor: currentPagination.hasPrev ? 'pointer' : 'not-allowed',
              }}
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!currentPagination.hasNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: '#EDE8DC',
                border: '1px solid #E2DAC8',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 12,
                color: currentPagination.hasNext ? '#1C1A17' : '#C4B89A',
                cursor: currentPagination.hasNext ? 'pointer' : 'not-allowed',
              }}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Sticky bulk-action bar ──────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            background: '#1C1A17',
            borderTop: '1px solid #2C2A27',
            padding: '0 32px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 13, color: '#C4B89A', flex: 1 }}>
            {selectedIds.size} review{selectedIds.size !== 1 ? 's' : ''} selected
          </span>

          {activeTab === 'pending' && (
            <button
              onClick={handleApproveAll}
              disabled={bulkPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                background: bulkPending ? '#3A5C47' : '#2D6248',
                border: 'none',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 500,
                color: '#fff',
                cursor: bulkPending ? 'not-allowed' : 'pointer',
                opacity: bulkPending ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
            >
              <CheckCircle size={13} />
              {bulkPending ? 'Approving…' : 'Approve All'}
            </button>
          )}

          <button
            onClick={() => setConfirmDelete(true)}
            disabled={bulkPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              background: bulkPending ? '#7A3838' : '#A85050',
              border: 'none',
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              cursor: bulkPending ? 'not-allowed' : 'pointer',
              opacity: bulkPending ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
          >
            <Trash2 size={13} />
            Delete All
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            disabled={bulkPending}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: FONT,
              fontSize: 12,
              color: '#9E9590',
              cursor: bulkPending ? 'default' : 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* ── Confirm-delete modal ────────────────────────────────────────────── */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            background: 'rgba(28,26,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            style={{
              background: '#F5F0E8',
              border: '1px solid #E2DAC8',
              borderRadius: 6,
              padding: '28px 28px 24px',
              maxWidth: 380,
              width: '90%',
              boxShadow: '0 8px 32px rgba(28,26,23,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 600,
                color: '#1C1A17',
                marginBottom: 10,
              }}
            >
              Delete {selectedIds.size} review{selectedIds.size !== 1 ? 's' : ''}?
            </p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', marginBottom: 24 }}>
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '8px 18px',
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
                onClick={handleDeleteAll}
                style={{
                  padding: '8px 18px',
                  background: '#A85050',
                  border: 'none',
                  borderRadius: 4,
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
