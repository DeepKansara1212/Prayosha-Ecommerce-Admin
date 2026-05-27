import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ShoppingBag, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { getCustomers, type Customer } from '../../api/customers.api'

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
  padding: '7px 10px',
  background: '#F5F0E8',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  fontFamily: FONT,
  fontSize: 12,
  color: '#1C1A17',
  outline: 'none',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-customers', debouncedSearch, page],
    queryFn: () =>
      getCustomers({
        search: debouncedSearch || undefined,
        page,
        limit: 20,
      }),
    placeholderData: prev => prev,
  })

  const customers = data?.customers ?? []
  const pagination = data?.pagination

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
        Customers
      </h1>

      {/* Search bar */}
      <div
        style={{
          background: '#EDE8DC',
          border: '1px solid #E2DAC8',
          borderRadius: 4,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 320px',
            maxWidth: 400,
          }}
        >
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9E9590',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              ...INPUT_BASE,
              paddingLeft: 28,
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {pagination && (
          <span
            style={{
              fontFamily: FONT,
              fontSize: 12,
              color: '#9E9590',
              marginLeft: 'auto',
            }}
          >
            {pagination.total} customer{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
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
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 13,
              color: '#9E9590',
            }}
          >
            Loading customers…
          </div>
        ) : isError ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 13,
              color: '#A85050',
            }}
          >
            Failed to load customers. Please try again.
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <Users size={48} style={{ margin: '0 auto 16px', color: '#9E9590', display: 'block' }} />
            <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 500, color: '#1C1A17', marginBottom: 8, marginTop: 0 }}>
              No customers found
            </h3>
            <p style={{ fontFamily: FONT, fontSize: 13, color: '#6B6057', marginBottom: 0, marginTop: 0 }}>
              Try a different search term.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 48 }} />
                <th style={TH}>Name</th>
                <th style={TH}>Email</th>
                <th style={TH}>Phone</th>
                <th style={TH}>Orders</th>
                <th style={TH}>Total Spent</th>
                <th style={TH}>Joined</th>
                <th style={{ ...TH, textAlign: 'right' as const }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer: Customer) => (
                <tr
                  key={customer._id}
                  onMouseEnter={e => {
                    const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                    cells.forEach(td => ((td as HTMLElement).style.background = '#F0EAF7'))
                  }}
                  onMouseLeave={e => {
                    const cells = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                    cells.forEach(td => ((td as HTMLElement).style.background = 'transparent'))
                  }}
                >
                  {/* Avatar */}
                  <td style={{ ...TD, paddingRight: 4 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#EDE8DC',
                        border: '1px solid #D8D0C0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: FONT,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#7B5EA7',
                        userSelect: 'none',
                        flexShrink: 0,
                      }}
                    >
                      {initials(customer.name)}
                    </div>
                  </td>

                  {/* Name */}
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: FONT,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1C1A17',
                      }}
                    >
                      {customer.name}
                    </span>
                  </td>

                  {/* Email */}
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                      {customer.email}
                    </span>
                  </td>

                  {/* Phone */}
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                      {customer.phone ?? '—'}
                    </span>
                  </td>

                  {/* Total Orders */}
                  <td style={TD}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: '#6B6057' }}>
                      {customer.totalOrders}
                    </span>
                  </td>

                  {/* Total Spent */}
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: FONT,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#C49A3C',
                      }}
                    >
                      {fmt(customer.totalSpent)}
                    </span>
                  </td>

                  {/* Joined */}
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: FONT,
                        fontSize: 12,
                        color: '#6B6057',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtDate(customer.createdAt)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ ...TD, textAlign: 'right' as const }}>
                    <Link
                      to={`/admin/orders?customer=${customer._id}`}
                      title="View orders"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: 4,
                        color: '#6B6057',
                        textDecoration: 'none',
                        border: '1px solid #E2DAC8',
                        background: 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e =>
                        ((e.currentTarget as HTMLAnchorElement).style.background = '#F5F0E8')
                      }
                      onMouseLeave={e =>
                        ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')
                      }
                    >
                      <ShoppingBag size={13} />
                    </Link>
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
            {pagination.total} customer{pagination.total !== 1 ? 's' : ''} · page{' '}
            {pagination.page} of {pagination.totalPages}
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
    </div>
  )
}
