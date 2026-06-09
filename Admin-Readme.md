# Prayosha Admin

A full-featured admin dashboard for the **Prayosha Crystal** e-commerce platform. Built with React 19, TypeScript, and Vite 8. Manages products, orders, customers, content (blogs, hero banners), coupons, reviews, analytics, and store settings against the Prayosha backend API.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Getting started](#getting-started)
3. [Scripts](#scripts)
4. [Environment](#environment)
5. [Architecture](#architecture)
6. [Authentication & route protection](#authentication--route-protection)
7. [State management](#state-management)
8. [API layer](#api-layer)
9. [Pages & features](#pages--features)
10. [UI & design system](#ui--design-system)
11. [Folder structure](#folder-structure)
12. [Development notes](#development-notes)
13. [Useful references](#useful-references)

---

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 19 (functional components, hooks) |
| Build | Vite 8 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) + inline styles for admin chrome |
| Routing | React Router DOM 7 |
| Auth state | Zustand 5 + `persist` middleware → `localStorage` key `admin-auth` |
| Server state | TanStack React Query 5 (`staleTime`: 30s, `retry`: 1) |
| HTTP | Axios (`withCredentials: true`, Bearer token interceptor) |
| Forms | React Hook Form 7 + Zod 4 (`@hookform/resolvers`) |
| Charts | Recharts 3 (dashboard sales chart) |
| Icons | Lucide React |
| Login | Phone OTP + password (two-step flow) |

---

## Getting started

```bash
cd Admin
npm install
```

Create `.env.local` at the Admin project root:

```text
VITE_API_URL=http://localhost:8000
```

Start development:

```bash
npm run dev
```

Open the URL printed by Vite (default: `http://localhost:5173`).

Production build and preview:

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

---

## Scripts

| Script | Description |
|---|---|
| `dev` | Start Vite dev server |
| `build` | `tsc -b` then production bundle |
| `preview` | Serve production build locally |
| `lint` | ESLint across the project |

---

## Environment

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Recommended | Backend base URL. Defaults to `http://localhost:8000` in `src/api/client.ts` if unset. |

All admin API calls are prefixed with `/api/v1/...` on that base URL.

---

## Architecture

### Application bootstrap (`src/main.tsx`)

- `StrictMode`
- `BrowserRouter`
- `QueryClientProvider` (global React Query client)
- `App` → `AppRouter` (`src/router.tsx`)

### Routing (`src/router.tsx`)

| Route | Access | Page |
|---|---|---|
| `/admin/login` | Public | Admin login (OTP) |
| `/admin` | Protected | Redirect → `/admin/dashboard` |
| `/admin/dashboard` | Protected | Dashboard |
| `/admin/products` | Protected | Products list |
| `/admin/products/new` | Protected | Create product |
| `/admin/products/:id/edit` | Protected | Edit product (`:id` = product `_id`) |
| `/admin/categories` | Protected | Categories |
| `/admin/orders` | Protected | Orders list |
| `/admin/orders/:id` | Protected | Order detail |
| `/admin/customers` | Protected | Customers |
| `/admin/reviews` | Protected | Review moderation |
| `/admin/coupons` | Protected | Coupons |
| `/admin/blogs` | Protected | Blog posts |
| `/admin/banners` | Protected | Hero banners (homepage carousel) |
| `/admin/settings` | Protected | Admin settings |
| `*` | — | Redirect → `/admin/login` |

Protected routes use `ProtectedAdminRoute`: requires a logged-in user with `admin.role === 'admin'`; otherwise redirects to login (non-admin roles trigger `logout()`).

### Layout (`src/components/layout/AdminLayout.tsx`)

- **Sidebar** (240px fixed, `#EDE8DC`) — Prayosha Crystal branding, nav links with Lucide icons, admin name, logout
- **Topbar** (64px sticky) — dynamic page title, notification bell (UI only), avatar initial
- **Main** — `<Outlet />` for page content
- **Toaster** — global toast stack (`src/components/ui/Toaster.tsx`)

**Sidebar navigation (in order):**

Dashboard · Products · Categories · Orders · Customers · Reviews · Coupons · **Blogs** · **Banners** · Settings

---

## Authentication & route protection

### Login flow (`src/pages/auth/AdminLoginPage.tsx`)

Two-step OTP + password:

1. **Phone** — Zod-validated phone (`+?` optional, 10–15 digits). `POST /api/v1/auth/send-otp` with `{ phone, purpose: 'admin_login' }`.
2. **Verify** — 6-digit OTP + password. `POST /api/v1/auth/verify-otp` with `{ phone, otp, password }`. On success: `login(admin, accessToken)` → navigate to `/admin/dashboard`.
3. **Resend OTP** — same send-otp endpoint.

### Auth store (`src/store/adminAuthStore.ts`)

| Field | Type | Description |
|---|---|---|
| `admin` | `Admin \| null` | `_id`, `name`, `email`, `role`, optional `avatar` |
| `accessToken` | `string \| null` | JWT access token |

**Actions:** `login(admin, accessToken)`, `logout()`, `setAdmin(admin)`.

Persisted under `localStorage` key `admin-auth`.

### Axios client (`src/api/client.ts`)

- Base URL: `import.meta.env.VITE_API_URL` or `http://localhost:8000`
- Request: `Authorization: Bearer <accessToken>` when present
- Response: on **401**, calls `logout()` (protected routes then send user to login)

---

## State management

### Auth — `adminAuthStore` (Zustand + persist)

Described above.

### Toasts — `toastStore` (`src/store/toastStore.ts`)

| Piece | Description |
|---|---|
| `useToastStore` | Queue of `{ id, message, type: 'success' \| 'error' }` |
| `useToast()` | `success(message)`, `error(message)` |
| Auto-dismiss | 3.5 seconds |
| UI | `Toaster` in `AdminLayout` — bottom-right, dismiss via X |

Used across product save, settings, blogs, banners, coupons, reviews, and other mutations.

### Server state — React Query

- Default `staleTime`: 30_000 ms
- Query keys per feature (e.g. `admin-blogs`, `admin-hero-banners`, `products`, `orders`)
- Optimistic / cache updates where noted (reviews approve, coupon toggle, banner toggle/reorder)

---

## API layer

Shared client: `src/api/client.ts`.

### Module summary

| Module | Endpoints (relative to base) | Functions |
|---|---|---|
| `products.api.ts` | `/api/v1/products`, `.../products/:id`, `.../products/:id/images` | `getProducts`, `getProductBySlug`, `createProduct`, `updateProduct`, `deleteProduct`, `updateImages` |
| `categories.api.ts` | `/api/v1/categories`, `/api/v1/admin/categories` | `getCategories`, `getAdminCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| `orders.api.ts` | `/api/v1/admin/orders` | `getAllOrders`, `getOrderDetail`, `updateOrderStatus` |
| `customers.api.ts` | `/api/v1/admin/customers` | `getCustomers` |
| `reviews.api.ts` | `/api/v1/admin/reviews` | `getAllReviews`, `approveReview`, `deleteReview` |
| `coupons.api.ts` | `/api/v1/admin/coupons` | `getCoupons`, `createCoupon`, `updateCoupon` |
| `analytics.api.ts` | `/api/v1/admin/analytics/*` | `getOverview`, `getSalesOverTime`, `getOrdersByStatus`, `getLowStockProducts`, `getRecentOrders` |
| `blogs.api.ts` | `/api/v1/admin/blogs` | `getAdminBlogs`, `createBlog`, `updateBlog`, `deleteBlog` |
| `heroBanners.api.ts` | `/api/v1/admin/hero-banners` | `getAdminBanners`, `createBanner`, `updateBanner`, `toggleBanner`, `reorderBanners`, `deleteBanner` |
| `settings.api.ts` | `/api/v1/admin/settings` | `getAdminSettings`, `updateAdminSettings` |

Profile and password changes use inline calls: `PATCH /api/v1/auth/me`, `PATCH /api/v1/auth/change-password`.

Types are co-located in each API file (no shared `types/` folder).

---

## Pages & features

### Login (`/admin/login`)

- Phone → OTP + password
- React Hook Form + Zod validation
- Server error display
- Back to phone step from verify step

---

### Dashboard (`/admin/dashboard`)

- **KPI cards** — Total revenue, orders today, active products, new customers (`getOverview`)
- **Sales area chart** — Recharts; period toggle 7d / 30d / 90d (`getSalesOverTime`)
- **Recent orders table** — order #, customer, date, items, total, payment + order status (`getRecentOrders`)
- **Low stock** — products under threshold with link to edit (`getLowStockProducts`)
- Skeleton loaders while fetching

---

### Products (`/admin/products`)

- **Filters** — debounced search (400ms), category, stock (All / In Stock / Low Stock / Out of Stock), badge
- **Table** — thumbnail, name/SKU, category, price/compare, color-coded stock, active toggle, badge, edit/delete
- **Delete** — confirmation before delete
- **Pagination** — prev/next with counts

---

### Product form (`/admin/products/new`, `/admin/products/:id/edit`)

Six sections, shared create/edit:

| Section | Fields |
|---|---|
| Basic info | Name, slug (editable), SKU, short description (max 200) |
| Description | Full description, care instructions, metaphysical properties |
| Pricing & inventory | Price, compare price, cost price, stock, low stock threshold, weight |
| Categorization | Category, chakra, tags (Enter to add), badge |
| Images | Drag-drop (max 6), preview grid, reorder, delete; `updateImages` on save for new files |
| Visibility | Featured, Active |

- Zod + React Hook Form
- Create/update via JSON (`createProduct` / `updateProduct`); images via separate `POST .../images` with `FormData`
- Toast on success/error

---

### Categories (`/admin/categories`)

- Table: thumbnail, name/slug, description (truncated), sort order, status, edit/delete
- Slide-in drawer: image upload (`FormData`), name, auto slug, description, sort order, active toggle

---

### Orders (`/admin/orders`)

- **Filters** — status tabs (All, Placed, Confirmed, Processing, Shipped, Delivered, Cancelled), date range, search (order # or customer email)
- **Table** — order #, customer, date, items, total, payment badge, inline status dropdown, view link
- **Pagination**

---

### Order detail (`/admin/orders/:id`)

**Left (~65%)**

- Line items (image, name, SKU, qty, unit price, line total)
- Shipping address + tracking
- Status timeline (status, note, timestamp)

**Right (~35%)**

- Order summary (subtotal, discount, coupon, shipping, tax, total)
- Payment (method, status, Razorpay IDs when applicable)
- Status updater: dropdown, tracking (when shipped), optional note, submit

---

### Customers (`/admin/customers`)

- Debounced search (name/email)
- Table: avatar initials, name, email, phone, order count, total spent, joined date, link to orders
- Pagination

---

### Reviews (`/admin/reviews`)

- Tabs: **Pending** / **Approved** (count badges)
- Cards: product thumb, name, reviewer, verified badge, date, stars, title, body (4-line clamp)
- **Approve** — optimistic move to Approved tab
- **Delete** — with confirmation pattern

---

### Coupons (`/admin/coupons`)

- Table: code (copy), type (Flat ₹ / Percent %), value, min order, usage used/max, valid until, active toggle; expired styling
- Drawer: code, type radio, value, min order, max usage, valid from/until
- Optimistic active toggle with revert on error

---

### Blog posts (`/admin/blogs`)

Manage storefront blog content for `/blog/:slug`.

**List table**

| Column | Content |
|---|---|
| Emoji | Gradient swatch + emoji |
| Title | Title + `/blog/{slug}` |
| Category | Pill badge |
| Date | Date + read time |
| Status | Published / Draft |
| Featured | Yes/No |
| Actions | Edit, delete (double-click confirm) |

**Drawer form (560px)** — create & edit:

| Field | Notes |
|---|---|
| Title * | Auto-generates slug until slug edited manually |
| Slug | URL preview shown |
| Subtitle | Optional |
| Excerpt * | Listing card summary |
| Category * | Crystal Guides, Rituals, Wellness, Gemstone Spotlight, Spiritual Practice |
| Read time *, Date * | Free text (e.g. `5 min read`, `15 May 2025`) |
| Emoji * | Card icon |
| Card gradient * | 8 presets + custom CSS gradient input + preview |
| Featured / Published | Toggle chips |
| Article content | Ordered sections (see below) |

**Content sections** — add any of:

- `paragraph`, `heading`, `subheading`, `quote` (textarea)
- `list` (one item per line)

Each section: type selector, content editor, remove. Submit as JSON to `POST/PATCH /api/v1/admin/blogs`.

Toasts on create, update, delete.

---

### Hero banners (`/admin/banners`)

Manage homepage carousel slides.

**List view** — responsive card grid:

- 16:7 thumbnail, Live/Hidden badge, order `#n`
- Header stats: `X live · Y total`
- Per card: move up/down (swap order via `reorderBanners`), toggle visibility (`toggleBanner`), edit, delete (double-click confirm)
- Skeleton grid while loading; empty state CTA

**Drawer form (480px)** — create & edit:

| Field | Notes |
|---|---|
| Banner image * | Required on create; JPG/PNG/WebP; click-to-upload; 16:7 preview |
| Live preview | Approximate homepage hero mockup (navbar stub, arrows, dots) |
| Order | Number; lower = shown first |
| Visibility | Live / Hidden toggle |

Saves as `multipart/form-data` (`image`, `order`, `isActive`).

API model also supports `title`, `subtitle`, `ctaText`, `ctaLink` for future storefront overlays; current admin UI focuses on image + order + visibility.

Endpoints: `GET/POST /api/v1/admin/hero-banners`, `PATCH/DELETE .../:id`, `PATCH .../:id/toggle`, `PATCH .../reorder`.

---

### Settings (`/admin/settings`)

Three cards:

| Section | Features |
|---|---|
| Profile | Avatar initial, name, email, role; edit name → `PATCH /api/v1/auth/me`; updates Zustand `setAdmin` |
| Password | Current / new / confirm; show-hide; Zod min 6 + match → `PATCH /api/v1/auth/change-password` |
| Store settings | Free Gift toggle (`freeGiftEnabled`) → `GET/PATCH /api/v1/admin/settings`; React Query `admin-settings` |
| Store info | Read-only: store name, currency, country, payment provider, image storage |

Toasts on profile/password success and errors.

---

## UI & design system

### Colors

| Role | Hex |
|---|---|
| Background | `#F5F0E8`, `#EDE8DC` |
| Border | `#E2DAC8` |
| Text primary | `#1C1A17` |
| Text secondary | `#6B6057`, `#9E9590` |
| Accent purple | `#7B5EA7` |
| Accent gold | `#C49A3C` |
| Success | `#5A8A6A` |
| Danger | `#A85050` |

### Typography

- Headings / brand: **Cormorant Garamond**
- UI / body: **Jost**

### Global CSS (`src/index.css`)

- Tailwind `@import`
- `.admin-nav-item` — sidebar link hover/active (purple left border)
- `.admin-input:focus` — purple focus ring
- `@keyframes` — `fadeIn`, `spin`
- `.admin-table-row:hover` — table row highlight

Most page layouts use inline `React.CSSProperties` for precise admin chrome; Tailwind is available for utility classes.

---

## Folder structure

```text
Admin/
  public/
  src/
    api/
      client.ts
      analytics.api.ts
      blogs.api.ts              # blog CRUD
      categories.api.ts
      coupons.api.ts
      customers.api.ts
      heroBanners.api.ts        # homepage carousel
      orders.api.ts
      products.api.ts
      reviews.api.ts
      settings.api.ts           # store settings (free gift toggle)
    components/
      layout/
        AdminLayout.tsx
      ui/
        Toaster.tsx
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
      blog/
        BlogsPage.tsx
      banners/
        HeroBannersPage.tsx
      settings/
        SettingsPage.tsx
    store/
      adminAuthStore.ts
      toastStore.ts
    App.tsx
    App.css
    index.css
    main.tsx
    router.tsx
  .env.local                    # VITE_API_URL (not committed)
  Admin-Readme.md
  eslint.config.js
  index.html
  package.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
```

---

## Development notes

- Point `VITE_API_URL` at the running backend (e.g. `http://localhost:8000`).
- Tailwind 4 is wired via `@tailwindcss/vite` — no separate `tailwind.config.js`.
- Product images: up to 6 per product; `updateImages` sends `existingImages` JSON + new files in `FormData`.
- Hero banners: image upload required on create; optional on edit.
- Blog content is structured JSON (`BlogSection[]`), not raw HTML/Markdown in admin.
- Double-click delete confirmation pattern on blogs and banners (3s window).
- Types live next to API functions; import from `*.api.ts` in pages.
- `ProtectedAdminRoute` enforces `role === 'admin'` only.

### Recommended workflow

1. Pull latest code
2. Set `VITE_API_URL` in `.env.local`
3. `npm install`
4. `npm run dev` — log in at `/admin/login` with a seeded admin account
5. Develop under `Admin/src/`
6. Before push: `npm run build` && `npm run lint`

---

## Feature checklist (implemented)

| Module | List | Create | Edit | Delete | Extra |
|---|---|:---:|:---:|:---:|:---:|
| Auth (OTP login) | — | — | — | — | Persisted session, 401 logout |
| Dashboard | ✓ | — | — | — | KPIs, chart, recent orders, low stock |
| Products | ✓ | ✓ | ✓ | ✓ | Filters, pagination, images |
| Categories | ✓ | ✓ | ✓ | ✓ | Drawer, image upload |
| Orders | ✓ | — | ✓ | — | Filters, inline status |
| Order detail | ✓ | — | ✓ | — | Timeline, status + tracking |
| Customers | ✓ | — | — | — | Search, pagination |
| Reviews | ✓ | — | — | ✓ | Approve, tabs |
| Coupons | ✓ | ✓ | ✓ | — | Toggle active, copy code |
| Blogs | ✓ | ✓ | ✓ | ✓ | Section editor, gradients |
| Hero banners | ✓ | ✓ | ✓ | ✓ | Reorder, toggle, preview |
| Settings | ✓ | — | ✓ | — | Profile, password |

---

## Useful references

- [Vite](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)
- [Recharts](https://recharts.org)
- [Lucide](https://lucide.dev)
- [Tailwind CSS](https://tailwindcss.com)
