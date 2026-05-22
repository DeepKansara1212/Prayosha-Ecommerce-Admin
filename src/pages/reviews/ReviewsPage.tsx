import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
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

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  tab,
  onApprove,
  onDelete,
  approving,
  deleting,
}: {
  review: Review
  tab: Tab
  onApprove: (review: Review) => void
  onDelete: (id: string) => void
  approving: boolean
  deleting: boolean
}) {
  const thumb = review.product?.images?.[0]

  return (
    <div
      style={{
        background: '#EDE8DC',
        border: '1px solid #E2DAC8',
        borderRadius: 4,
        padding: 16,
        display: 'flex',
        gap: 14,
      }}
    >
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

  const [activeTab, setActiveTab]   = useState<Tab>('pending')
  const [pendingPage, setPendingPage] = useState(1)
  const [approvedPage, setApprovedPage] = useState(1)

  // Optimistic approvals: reviews moved to approved before API confirms
  const [justApproved, setJustApproved] = useState<Review[]>([])

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

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleApprove = (review: Review) => {
    // Optimistic: move review to approved tab immediately
    setJustApproved(prev => [...prev, { ...review, isApproved: true }])
    setActiveTab('approved')

    approveMutation.mutate(review._id, {
      onSuccess: () => {
        setJustApproved(prev => prev.filter(r => r._id !== review._id))
        qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      },
      onError: () => {
        // Revert optimistic update
        setJustApproved(prev => prev.filter(r => r._id !== review._id))
        setActiveTab('pending')
      },
    })
  }

  const handleDelete = (id: string) => {
    // Also remove from justApproved if it was there
    setJustApproved(prev => prev.filter(r => r._id !== id))
    deleteMutation.mutate(id)
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  // Pending: exclude any that we optimistically moved to approved
  const pendingReviews = (pendingData?.reviews ?? []).filter(
    r => !justApproved.some(j => j._id === r._id),
  )

  // Approved: prepend optimistically approved reviews
  const approvedReviews = [...justApproved, ...(approvedData?.reviews ?? [])]

  const pendingPagination  = pendingData?.pagination
  const approvedPagination = approvedData?.pagination

  // ── Render ────────────────────────────────────────────────────────────────────

  const isCurrentLoading = activeTab === 'pending' ? pendingLoading : approvedLoading
  const currentReviews   = activeTab === 'pending' ? pendingReviews : approvedReviews
  const currentPagination = activeTab === 'pending' ? pendingPagination : approvedPagination
  const setCurrentPage   = activeTab === 'pending' ? setPendingPage : setApprovedPage
  const currentPage      = activeTab === 'pending' ? pendingPage : approvedPage

  const pendingCount  = (pendingData?.pagination.total ?? 0) - justApproved.length
  const approvedCount = approvedData?.pagination.total ?? 0

  return (
    <div>
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

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid #E2DAC8',
          marginBottom: 24,
        }}
      >
        {([
          { key: 'pending' as Tab, label: 'Pending Approval', count: pendingCount },
          { key: 'approved' as Tab, label: 'Approved', count: approvedCount },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
      </div>

      {/* Review list */}
      {isCurrentLoading ? (
        <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>
          Loading reviews…
        </div>
      ) : currentReviews.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: '#EDE8DC',
            border: '1px solid #E2DAC8',
            borderRadius: 4,
            fontFamily: FONT,
            fontSize: 13,
            color: '#9E9590',
          }}
        >
          {activeTab === 'pending' ? 'No reviews pending approval.' : 'No approved reviews yet.'}
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
    </div>
  )
}
