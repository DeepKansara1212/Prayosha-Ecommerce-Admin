# Prayosha Admin

A full-featured admin dashboard for the Prayosha Crystal e-commerce platform, built with React, TypeScript, and Vite.

## Project highlights

- React 19 with functional components and hooks
- Vite 8 for fast development and production builds
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- React Router DOM 7 with protected route guards
- Zustand for auth state with localStorage persistence
- TanStack React Query for server-state caching
- Axios with automatic token injection and 401 auto-logout
- React Hook Form + Zod for all form validation
- Recharts for analytics charts
- Lucide React for icons
- OTP-based admin login flow

## Getting started

Install dependencies:

```bash
cd Admin
npm install
```

Create a `.env.local` file at the project root:

```text
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:5174
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Lint the project:

```bash
npm run lint
```

## Scripts

- `dev` — start the Vite dev server
- `build` — compile TypeScript and bundle for production
- `preview` — serve the production build locally
- `lint` — run ESLint across source files

## Architecture overview

### Routing

Defined in `src/router.tsx` using React Router DOM 7. All admin routes are wrapped in a `ProtectedAdminRoute` component that redirects unauthenticated users to `/admin/login`.

| Route | Page |
|---|---|
| `/admin/login` | Login (public) |
| `/admin` | Redirect → `/admin/dashboard` |
| `/admin/dashboard` | Dashboard |
| `/admin/products` | Products list |
| `/admin/products/new` | Create product |
| `/admin/products/:id/edit` | Edit product |
| `/admin/categories` | Categories |
| `/admin/orders` | Orders list |
| `/admin/orders/:id` | Order detail |
| `/admin/customers` | Customers |
| `/admin/reviews` | Reviews moderation |
| `/admin/coupons` | Coupons |
| `/admin/settings` | Settings |
| `*` | Redirect → `/admin/login` |

### Layout

`AdminLayout` wraps all protected pages and provides:

- **Sidebar** (240 px fixed) — Prayosha Crystal branding, navigation links with Lucide icons, logged-in admin name, logout button
- **Topbar** (64 px sticky) — page title, notification bell, admin avatar
- **Main area** — React Router `<Outlet />` for nested page content

Navigation items: Dashboard, Products, Categories, Orders, Customers, Reviews, Coupons, Settings.

### State management

**`src/store/adminAuthStore.ts`** — Zustand store persisted to `localStorage` key `admin-auth`:

| State | Type | Description |
|---|---|---|
| `admin` | `Admin \| null` | Logged-in admin profile |
| `accessToken` | `string \| null` | JWT access token |

Actions: `login(admin, accessToken)`, `logout()`, `setAdmin(admin)`.

The Axios client reads `accessToken` via `adminAuthStore.getState()` on every request. A 401 response triggers `logout()` and redirects to `/admin/login`.

### Data fetching

TanStack React Query is bootstrapped in `src/main.tsx` with a 30-second `staleTime`. API calls use typed async functions from `src/api/` modules, all backed by the shared Axios client at `src/api/client.ts`.

### API layer

**`src/api/client.ts`** — shared Axios instance:
- Base URL: `VITE_API_URL`
- `withCredentials: true`
- Request interceptor: attaches `Authorization: Bearer <token>`
- Response interceptor: calls `logout()` and redirects on 401

API modules:

| Module | Key functions |
|---|---|
| `products.api.ts` | `getProducts`, `getProductBySlug`, `createProduct`, `updateProduct`, `deleteProduct`, `uploadImages`, `deleteImage` |
| `orders.api.ts` | `getAllOrders`, `getOrderDetail`, `updateOrderStatus` |
| `categories.api.ts` | `getCategories`, `getAdminCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| `customers.api.ts` | `getCustomers` |
| `reviews.api.ts` | `getAllReviews`, `approveReview`, `deleteReview` |
| `coupons.api.ts` | `getCoupons`, `createCoupon`, `updateCoupon` |
| `analytics.api.ts` | `getOverview`, `getSalesOverTime`, `getOrdersByStatus`, `getLowStockProducts`, `getRecentOrders` |

## Pages

### Login (`/admin/login`)

Two-step OTP flow:

1. **Phone step** — enter phone number (10–15 digits, Zod-validated)
2. **Verify step** — enter 6-digit OTP + password with resend option

On success, stores the admin profile and access token in Zustand and redirects to `/admin/dashboard`.

### Dashboard (`/admin/dashboard`)

- **KPI cards** — Total Revenue, Orders Today, Active Products, New Customers
- **Sales area chart** — period selector (7 d / 30 d / 90 d), powered by Recharts
- **Recent orders table** — order number, customer, date, items, total, payment and order status
- **Low stock alerts** — products below their `lowStockThreshold` with direct link to edit
- Skeleton loaders during data fetch

### Products (`/admin/products`)

- **Filters** — debounced name search (400 ms), category dropdown, stock status (All / In Stock / Low Stock / Out of Stock), badge dropdown
- **Table columns** — thumbnail, name/SKU, category, price/compare price, color-coded stock count, active toggle, badge, edit/delete actions
- **Delete** — confirmation dialog before removal
- **Pagination** — Previous/Next with record count

### Product form (`/admin/products/new` and `/admin/products/:id/edit`)

Six sections, one form, shared for create and edit:

| Section | Fields |
|---|---|
| Basic info | Name, auto-generated slug, SKU, short description (200 char limit) |
| Description | Full description, care instructions, metaphysical properties |
| Pricing & inventory | Price, compare price, cost price, stock, low stock threshold, weight |
| Categorization | Category dropdown, chakra, tags (Enter to add), badge selector |
| Images | Drag-drop zone (max 6), preview grid with reorder arrows and delete, supports existing + new |
| Visibility | Featured toggle, Active toggle |

Submits as `FormData` to support image uploads. Shows toast notifications on save.

### Categories (`/admin/categories`)

- Table — thumbnail, name/slug, description (truncated), sort order, status badge, edit/delete
- Slide-in drawer form — image upload, name, auto-generated slug, description, sort order, status toggle

### Orders (`/admin/orders`)

- **Filters** — status tabs (All / Placed / Confirmed / Processing / Shipped / Delivered / Cancelled), date range (from/to), search by order number or customer email
- **Table columns** — order number, customer name/email, date, item count, total, payment status badge, order status dropdown, view link
- **Status dropdown** — update order status inline from the table row
- **Pagination** — Previous/Next

### Order detail (`/admin/orders/:id`)

Two-column layout:

**Left (65 %)**
- Line items table — thumbnail, product name, SKU, quantity, unit price, line total
- Shipping address card with tracking number
- Status timeline — chronological history with status, note, and timestamp

**Right (35 %)**
- Order summary — subtotal, discount, coupon code, shipping, tax, total
- Payment info — method, status, Razorpay order/payment IDs if applicable
- Status updater — status dropdown, tracking number field (shown for `shipped`), optional note, submit button

### Customers (`/admin/customers`)

- Debounced search by name or email
- Table — avatar initials, name, email, phone, total orders, total spent, joined date, view-orders link
- Pagination

### Reviews (`/admin/reviews`)

- **Tabs** — Pending Approval (count badge), Approved (count badge)
- **Review cards** — product thumbnail, product name, reviewer name, verified-purchase badge, date, star rating, title, body (truncated to 4 lines)
- **Actions** — Approve (moves card to Approved tab optimistically), Delete

### Coupons (`/admin/coupons`)

- Table — code (copy-to-clipboard), type badge (Flat ₹ / Percent %), value, min order, usage (used / max), valid until, active toggle, expired coupons shown with strikethrough
- Slide-in drawer form — code, discount type (radio), value, min order, max usage, valid from, valid until

### Settings (`/admin/settings`)

Three sections:

| Section | Description |
|---|---|
| Profile | Avatar, name, email, role badge; edit display name |
| Password | Current / new / confirm password with show/hide toggles, min 6 chars, match validation |
| Store info | Read-only grid — store name, currency, country, payment provider, image storage |

## Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| react | 19.x | UI library |
| react-dom | 19.x | DOM renderer |
| react-router-dom | 7.x | Client-side routing |
| zustand | 5.x | Auth state management |
| @tanstack/react-query | 5.x | Server-state caching |
| axios | 1.x | HTTP client |
| react-hook-form | 7.x | Form state |
| @hookform/resolvers | 5.x | Zod resolver bridge |
| zod | 4.x | Schema validation |
| recharts | 3.x | Sales area chart |
| lucide-react | 1.x | Icon set |
| tailwindcss | 4.x | Utility CSS |

### Dev

Vite 8, TypeScript 6, `@vitejs/plugin-react`, `@tailwindcss/vite`, ESLint 10 with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.

## Design system

**Colors (applied via Tailwind utilities and inline styles):**

| Role | Value |
|---|---|
| Background | `#F5F0E8`, `#EDE8DC` (warm cream) |
| Border | `#E2DAC8` |
| Text primary | `#1C1A17` |
| Text secondary | `#6B6057`, `#9E9590` |
| Accent purple | `#7B5EA7` |
| Accent gold | `#C49A3C` |
| Success | `#5A8A6A` |
| Warning | `#C49A3C` |
| Danger | `#A85050` |

**Typography:**
- Display / headings: Cormorant Garamond (serif)
- Body / labels / buttons: Jost (sans-serif)

## Folder structure

```text
Admin/
  public/
  src/
    api/
      client.ts             # shared Axios instance with interceptors
      analytics.api.ts
      categories.api.ts
      coupons.api.ts
      customers.api.ts
      orders.api.ts
      products.api.ts
      reviews.api.ts
    assets/
    components/
      layout/
        AdminLayout.tsx      # sidebar + topbar + outlet
    pages/
      auth/
        AdminLoginPage.tsx
      dashboard/
        DashboardPage.tsx
      products/
        ProductsPage.tsx
        ProductFormPage.tsx
      categories/
        CategoriesPage.tsx
      orders/
        OrdersPage.tsx
        OrderDetailPage.tsx
      customers/
        CustomersPage.tsx
      reviews/
        ReviewsPage.tsx
      coupons/
        CouponsPage.tsx
      settings/
        SettingsPage.tsx
    store/
      adminAuthStore.ts     # Zustand auth store (persisted)
    App.tsx
    App.css
    index.css
    main.tsx                # app bootstrap (QueryClientProvider, BrowserRouter)
    router.tsx              # all route definitions
  .env.local                # VITE_API_URL
  eslint.config.js
  package.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
```

## Development notes

- The admin app runs on port `5174` by default (set `VITE_API_URL` to `http://localhost:8000` to point at the local backend).
- Tailwind CSS 4 is integrated via the `@tailwindcss/vite` Vite plugin — no separate `tailwind.config.js` is needed.
- Types are co-located in their API module files rather than a shared `types/` directory.
- Optimistic updates are applied on review approval and coupon toggling; mutations revert on error.
- Product image uploads send a `FormData` payload; up to 6 images per product are supported.

## Recommended contribution workflow

1. Pull the latest branch
2. Set `VITE_API_URL` in `.env.local`
3. Run `npm install`
4. Run `npm run dev` (starts on port 5174)
5. Log in at `/admin/login` with a seeded admin account
6. Develop against `Admin/src/`
7. Validate with `npm run build` and `npm run lint` before pushing

## Useful references

- Vite: https://vitejs.dev
- React Router DOM: https://reactrouter.com
- TanStack Query: https://tanstack.com/query
- Zustand: https://zustand-demo.pmnd.rs
- React Hook Form: https://react-hook-form.com
- Zod: https://zod.dev
- Recharts: https://recharts.org
- Lucide React: https://lucide.dev
- Tailwind CSS: https://tailwindcss.com
