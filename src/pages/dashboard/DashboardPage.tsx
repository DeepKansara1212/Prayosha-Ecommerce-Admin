import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingBag, Package, Users, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getOverview,
  getSalesOverTime,
  getLowStockProducts,
  getRecentOrders,
} from '../../api/analytics.api'

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIODS = ['7d', '30d', '90d'] as const
type Period = (typeof PERIODS)[number]

const CARD: React.CSSProperties = {
  background: '#EDE8DC',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  padding: 24,
}

const TD: React.CSSProperties = {
  padding: '10px 8px',
  borderBottom: '1px solid #E2DAC8',
  verticalAlign: 'middle',
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  placed:     { bg: '#EBF3FF', color: '#2563EB' },
  confirmed:  { bg: '#ECFDF5', color: '#059669' },
  processing: { bg: '#FFF7ED', color: '#D97706' },
  shipped:    { bg: '#F0EAF7', color: '#7B5EA7' },
  delivered:  { bg: '#D1FAE5', color: '#065F46' },
  cancelled:  { bg: '#FEF2F2', color: '#DC2626' },
  refunded:   { bg: '#F3F4F6', color: '#6B7280' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatINR = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

const formatAxisDate = (v: unknown) => {
  try {
    return new Date(v as string).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(v)
  }
}

const formatTooltipLabel = (l: unknown) => {
  try {
    return new Date(l as string).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(l)
  }
}

// ── Small Components ──────────────────────────────────────────────────────────

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="animate-pulse"
      style={{ background: '#E2DAC8', borderRadius: 4, ...style }}
    />
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  subLabel,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  subLabel?: string
}) {
  return (
    <div style={{ ...CARD, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16, opacity: 0.7 }}>
        <Icon size={16} color="#9E9590" />
      </div>
      <p
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6B6057',
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 36,
          fontWeight: 500,
          color: '#1C1A17',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {subLabel && (
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 11,
            color: '#9E9590',
            marginTop: 10,
          }}
        >
          {subLabel}
        </p>
      )}
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div style={{ ...CARD }}>
      <Skeleton style={{ width: 80, height: 10, marginBottom: 14 }} />
      <Skeleton style={{ width: 120, height: 36, marginBottom: 10 }} />
      <Skeleton style={{ width: 90, height: 10 }} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span
      style={{
        display: 'inline-block',
        background: s.bg,
        color: s.color,
        fontFamily: "'Jost', sans-serif",
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 500,
        padding: '3px 8px',
        borderRadius: 2,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: getOverview,
  })

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['analytics-sales', period],
    queryFn: () => getSalesOverTime(period),
  })

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['analytics-low-stock'],
    queryFn: getLowStockProducts,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: getRecentOrders,
  })

  const recentOrders = ordersData?.orders ?? []
  const lowStockProducts = lowStockData?.products ?? []
  const salesPoints = salesData?.data ?? []

  return (
    <div>
      {/* ── Row 1: KPI Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {overviewLoading ? (
          Array.from({ length: 4 }, (_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="Total Revenue"
              value={formatINR(overview?.totalRevenue ?? 0)}
              icon={TrendingUp}
              subLabel={`${formatINR(overview?.revenueToday ?? 0)} today`}
            />
            <KpiCard
              label="Orders Today"
              value={overview?.ordersToday ?? 0}
              icon={ShoppingBag}
              subLabel={`${overview?.totalOrders ?? 0} total orders`}
            />
            <KpiCard
              label="Active Products"
              value={overview?.totalProducts ?? 0}
              icon={Package}
              subLabel={
                overview?.lowStockCount
                  ? `${overview.lowStockCount} low stock`
                  : 'All well stocked'
              }
            />
            <KpiCard
              label="New Customers"
              value={overview?.newCustomersThisMonth ?? 0}
              icon={Users}
              subLabel="This month"
            />
          </>
        )}
      </div>

      {/* ── Row 2: Sales Chart ── */}
      <div style={{ ...CARD, marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: '#1C1A17',
            }}
          >
            Sales Overview
          </span>

          <div style={{ display: 'flex', gap: 4 }}>
            {PERIODS.map((p) => {
              const active = period === p
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '4px 12px',
                    background: active ? '#7B5EA7' : 'transparent',
                    color: active ? '#fff' : '#6B6057',
                    border: `1px solid ${active ? '#7B5EA7' : '#E2DAC8'}`,
                    borderRadius: 2,
                    fontFamily: "'Jost', sans-serif",
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>

        {salesLoading ? (
          <Skeleton style={{ height: 250 }} />
        ) : salesPoints.length === 0 ? (
          <div
            style={{
              height: 250,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Jost', sans-serif",
              fontSize: 13,
              color: '#9E9590',
            }}
          >
            No sales data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={salesPoints}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7B5EA7" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#7B5EA7" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#E2DAC8" vertical={false} strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                tick={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: 10,
                  fill: '#9E9590',
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAxisDate}
                interval="preserveStartEnd"
              />

              <YAxis
                tick={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: 10,
                  fill: '#9E9590',
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatINR(v as number)}
                width={76}
              />

              <Tooltip
                contentStyle={{
                  background: '#EDE8DC',
                  border: '1px solid #E2DAC8',
                  borderRadius: 2,
                  fontFamily: "'Jost', sans-serif",
                  boxShadow: 'none',
                }}
                labelStyle={{ fontSize: 11, color: '#6B6057', marginBottom: 4 }}
                itemStyle={{ fontSize: 14, color: '#1C1A17' }}
                formatter={(v) => [formatINR(v as number), 'Revenue']}
                labelFormatter={formatTooltipLabel}
                cursor={{ stroke: '#7B5EA7', strokeWidth: 1, strokeDasharray: '4 4' }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7B5EA7"
                strokeWidth={2}
                fill="url(#areaFill)"
                dot={false}
                activeDot={{ r: 4, fill: '#7B5EA7', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Row 3: Recent Orders + Low Stock ── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}
      >
        {/* Recent Orders */}
        <div style={CARD}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: '#1C1A17',
              }}
            >
              Recent Orders
            </span>
            <Link
              to="/admin/orders"
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 11,
                color: '#7B5EA7',
                textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
              View all →
            </Link>
          </div>

          {ordersLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} style={{ height: 44 }} />
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Order #', 'Customer', 'Total', 'Status', 'Date'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          fontFamily: "'Jost', sans-serif",
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#9E9590',
                          fontWeight: 400,
                          textAlign: 'left',
                          padding: '0 8px 12px',
                          borderBottom: '1px solid #E2DAC8',
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '28px 8px',
                        textAlign: 'center',
                        fontFamily: "'Jost', sans-serif",
                        fontSize: 13,
                        color: '#9E9590',
                      }}
                    >
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const customerName =
                      order.user && typeof order.user === 'object'
                        ? order.user.name
                        : order.shippingAddress.fullName
                    return (
                      <tr key={order._id} className="admin-table-row">
                        <td style={TD}>
                          <span
                            style={{
                              fontFamily: "'Jost', sans-serif",
                              fontSize: 12,
                              fontWeight: 500,
                              color: '#1C1A17',
                            }}
                          >
                            {order.orderNumber}
                          </span>
                        </td>
                        <td style={TD}>
                          <span
                            style={{
                              fontFamily: "'Jost', sans-serif",
                              fontSize: 13,
                              color: '#1C1A17',
                            }}
                          >
                            {customerName}
                          </span>
                        </td>
                        <td style={TD}>
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: 16,
                              color: '#C4A35A',
                            }}
                          >
                            {formatINR(order.total)}
                          </span>
                        </td>
                        <td style={TD}>
                          <StatusBadge status={order.status} />
                        </td>
                        <td style={TD}>
                          <span
                            style={{
                              fontFamily: "'Jost', sans-serif",
                              fontSize: 12,
                              color: '#9E9590',
                            }}
                          >
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div style={CARD}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} color="#C49A3C" />
            <span
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: '#1C1A17',
              }}
            >
              Low Stock
            </span>
            {!overviewLoading && overview && overview.lowStockCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: '#FFF3CD',
                  color: '#C49A3C',
                  fontFamily: "'Jost', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: 2,
                }}
              >
                {overview.lowStockCount} items
              </span>
            )}
          </div>

          {lowStockLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} style={{ height: 40 }} />
              ))}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 13,
                color: '#9E9590',
                padding: '16px 0',
              }}
            >
              All products are well stocked
            </p>
          ) : (
            <div>
              {lowStockProducts.slice(0, 8).map((product) => (
                <div
                  key={product._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #E2DAC8',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
                    <p
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: 13,
                        color: '#1C1A17',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {product.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: 10,
                        color: '#9E9590',
                        marginTop: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {product.sku}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#A85050',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/admin/products"
            style={{
              display: 'block',
              marginTop: 16,
              fontFamily: "'Jost', sans-serif",
              fontSize: 11,
              color: '#7B5EA7',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            Manage Inventory →
          </Link>
        </div>
      </div>
    </div>
  )
}
