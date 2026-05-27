import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import {
  getProducts,
  updateProduct,
  deleteProduct,
  type Product,
} from '../../api/products.api'
import { getCategories } from '../../api/categories.api'

// ── Constants ─────────────────────────────────────────────────────────────────

type StockStatus = 'all' | 'inStock' | 'lowStock' | 'outOfStock'

const BADGE_OPTS = ['', 'BESTSELLER', 'NEW', 'LIMITED', 'RARE', 'GIFT SET'] as const

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  BESTSELLER: { bg: '#FEF9EC', color: '#C49A3C' },
  NEW:        { bg: '#ECFDF5', color: '#5A8A6A' },
  LIMITED:    { bg: '#F0EAF7', color: '#7B5EA7' },
  RARE:       { bg: '#FEF2F2', color: '#A85050' },
  'GIFT SET': { bg: '#E0F2FE', color: '#0369A1' },
}

const FONT = "'Jost', sans-serif"

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function getStockColor(p: Product) {
  if (p.stock === 0) return '#A85050'
  if (p.stock <= p.lowStockThreshold) return '#C49A3C'
  return '#5A8A6A'
}

function filterByStock(products: Product[], status: StockStatus): Product[] {
  switch (status) {
    case 'inStock':    return products.filter(p => p.stock > p.lowStockThreshold)
    case 'lowStock':   return products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold)
    case 'outOfStock': return products.filter(p => p.stock === 0)
    default:           return products
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  padding: '7px 10px',
  background: '#F5F0E8',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  fontFamily: FONT,
  fontSize: 12,
  color: '#1C1A17',
  outline: 'none',
}

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

// ── Delete dialog ─────────────────────────────────────────────────────────────

function DeleteDialog({
  product,
  onCancel,
  onConfirm,
  isLoading,
}: {
  product: Product
  onCancel: () => void
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,26,23,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#F5F0E8',
          border: '1px solid #E2DAC8',
          borderRadius: 4,
          padding: 32,
          maxWidth: 420,
          width: '90%',
        }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: '#1C1A17', marginBottom: 8 }}>
          Delete product?
        </p>
        <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', marginBottom: 24, lineHeight: 1.6 }}>
          "{product.name}" will be deactivated and removed from the storefront. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '8px 18px',
              background: '#A85050',
              border: 'none',
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 12,
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const qc = useQueryClient()

  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter]   = useState('')
  const [stockFilter, setStockFilter]         = useState<StockStatus>('all')
  const [badgeFilter, setBadgeFilter]         = useState('')
  const [page, setPage]                       = useState(1)
  const [confirmDelete, setConfirmDelete]     = useState<Product | null>(null)

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [categoryFilter, badgeFilter, stockFilter])

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-products', debouncedSearch, categoryFilter, badgeFilter, page],
    queryFn: () =>
      getProducts({
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        badge: badgeFilter || undefined,
        page,
        limit: 20,
      }),
    placeholderData: (prev) => prev,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateProduct(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      setConfirmDelete(null)
    },
  })

  // ── Derived data ──────────────────────────────────────────────────────────────

  const rawProducts = data?.products ?? []
  const products    = filterByStock(rawProducts, stockFilter)
  const pagination  = data?.pagination

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 500,
            color: '#1C1A17',
          }}
        >
          Products
        </h1>
        <Link to="/admin/products/new" style={{ textDecoration: 'none' }}>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              background: '#C49A3C',
              border: 'none',
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            <Plus size={14} />
            Add Product
          </button>
        </Link>
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: '#EDE8DC',
          border: '1px solid #E2DAC8',
          borderRadius: 4,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="admin-input"
          style={{ ...INPUT_BASE, minWidth: 200, flex: '1 1 200px' }}
        />

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="admin-input"
          style={{ ...INPUT_BASE, minWidth: 160 }}
        >
          <option value="">All Categories</option>
          {categories?.map(c => (
            <option key={c._id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        {/* Stock status */}
        <div style={{ display: 'flex', gap: 0, border: '1px solid #E2DAC8', borderRadius: 4, overflow: 'hidden' }}>
          {(['all', 'inStock', 'lowStock', 'outOfStock'] as StockStatus[]).map(s => {
            const label = s === 'all' ? 'All' : s === 'inStock' ? 'In Stock' : s === 'lowStock' ? 'Low Stock' : 'Out of Stock'
            const active = stockFilter === s
            return (
              <button
                key={s}
                onClick={() => setStockFilter(s)}
                style={{
                  padding: '7px 12px',
                  background: active ? '#1C1A17' : '#F5F0E8',
                  border: 'none',
                  borderRight: '1px solid #E2DAC8',
                  fontFamily: FONT,
                  fontSize: 11,
                  color: active ? '#fff' : '#6B6057',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Badge */}
        <select
          value={badgeFilter}
          onChange={e => setBadgeFilter(e.target.value)}
          className="admin-input"
          style={{ ...INPUT_BASE, minWidth: 140 }}
        >
          <option value="">All Badges</option>
          {BADGE_OPTS.filter(Boolean).map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
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
            Loading products…
          </div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontSize: 13, color: '#A85050' }}>
            Failed to load products. Please try again.
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <Package size={48} style={{ margin: '0 auto 16px', color: '#9E9590', display: 'block' }} />
            <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 500, color: '#1C1A17', marginBottom: 8, marginTop: 0 }}>
              No products found
            </h3>
            <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', marginBottom: 24, marginTop: 0 }}>
              Try adjusting your filters or add a new product.
            </p>
            <Link to="/admin/products/new" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  background: '#C49A3C',
                  border: 'none',
                  borderRadius: 4,
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#fff',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                Add Product
              </button>
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 60 }}>Image</th>
                <th style={TH}>Name / SKU</th>
                <th style={TH}>Category</th>
                <th style={TH}>Price</th>
                <th style={TH}>Stock</th>
                <th style={TH}>Status</th>
                <th style={TH}>Badge</th>
                <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr
                  key={product._id}
                  style={{ cursor: 'default' }}
                  onMouseEnter={e => {
                    const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                    cells.forEach(td => ((td as HTMLElement).style.background = '#F0EAF7'))
                  }}
                  onMouseLeave={e => {
                    const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                    cells.forEach(td => ((td as HTMLElement).style.background = 'transparent'))
                  }}
                >
                  {/* Image */}
                  <td style={TD}>
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 3,
                          border: '1px solid #E2DAC8',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 3,
                          border: '1px solid #E2DAC8',
                          background: '#F5F0E8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#C4B89A',
                          fontSize: 10,
                          fontFamily: FONT,
                        }}
                      >
                        No img
                      </div>
                    )}
                  </td>

                  {/* Name + SKU */}
                  <td style={TD}>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17', marginBottom: 2 }}>
                      {product.name}
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590' }}>
                      {product.sku}
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ ...TD }}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                      {product.category?.name ?? '—'}
                    </span>
                  </td>

                  {/* Price */}
                  <td style={TD}>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#C49A3C' }}>
                      {fmt(product.price)}
                    </div>
                    {product.comparePrice && (
                      <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', textDecoration: 'line-through' }}>
                        {fmt(product.comparePrice)}
                      </div>
                    )}
                  </td>

                  {/* Stock */}
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: getStockColor(product) }}>
                      {product.stock}
                    </span>
                  </td>

                  {/* Status toggle */}
                  <td style={TD}>
                    <button
                      onClick={() =>
                        toggleStatus.mutate({ id: product._id, isActive: !product.isActive })
                      }
                      disabled={toggleStatus.isPending}
                      title="Toggle active / inactive"
                      style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        border: 'none',
                        cursor: toggleStatus.isPending ? 'wait' : 'pointer',
                        background: product.isActive ? '#ECFDF5' : '#F3F4F6',
                        color: product.isActive ? '#059669' : '#9E9590',
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: 500,
                        transition: 'background 0.15s',
                      }}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  {/* Badge */}
                  <td style={TD}>
                    {product.badge ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: 2,
                          background: BADGE_STYLE[product.badge]?.bg ?? '#F3F4F6',
                          color: BADGE_STYLE[product.badge]?.color ?? '#6B7280',
                          fontFamily: FONT,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {product.badge}
                      </span>
                    ) : (
                      <span style={{ color: '#C4B89A', fontSize: 12 }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      <Link
                        to={`/admin/products/${product.slug}/edit`}
                        title="Edit"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 30,
                          height: 30,
                          borderRadius: 4,
                          color: '#6B6057',
                          textDecoration: 'none',
                          background: 'transparent',
                          border: '1px solid #E2DAC8',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#F5F0E8')}
                        onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')}
                      >
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(product)}
                        title="Delete"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 30,
                          height: 30,
                          borderRadius: 4,
                          background: 'transparent',
                          border: '1px solid #E2DAC8',
                          color: '#A85050',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
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
            {pagination.total} products · page {pagination.page} of {pagination.totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
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
                color: pagination.hasPrev ? '#1C1A17' : '#C4B89A',
                cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
              }}
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext}
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
                color: pagination.hasNext ? '#1C1A17' : '#C4B89A',
                cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
              }}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <DeleteDialog
          product={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => removeMutation.mutate(confirmDelete._id)}
          isLoading={removeMutation.isPending}
        />
      )}
    </div>
  )
}
