# Menu Plus — SaaS Restaurant Management Platform

Menu Plus is a full-featured, multi-tenant SaaS platform that empowers restaurants to go digital instantly. Restaurant owners get a branded storefront with QR menu, order management, delivery zones, coupons, analytics, and more — all from a single dashboard. Built with Next.js, Supabase, and a focus on multi-language (Arabic, English, Kurdish) markets.

---

## Table of Contents

- [Features](#features)
  - [Menu Management](#1-menu-management)
  - [Order Management](#2-order-management)
  - [Delivery Management](#3-delivery-management)
  - [Discounts & Coupons](#4-discounts--coupons)
  - [Restaurant Settings & Branding](#5-restaurant-settings--branding)
  - [Analytics & Insights](#6-analytics--insights)
  - [Authentication & Security](#7-authentication--security)
  - [Multi-language & Localization](#8-multi-language--localization)
  - [Storefront (Customer-Facing Menu)](#9-storefront-customer-facing-menu)
  - [Subscriptions & Feature Gating](#10-subscriptions--feature-gating)
  - [Admin Platform](#11-admin-platform)
  - [Notifications & Messaging](#12-notifications--messaging)
  - [Technical & Infrastructure](#13-technical--infrastructure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)

---

## Features

### 1. Menu Management

**Products**
- Create, edit, and delete products with full multilingual support (Arabic, English, Kurdish Sorani)
- Product fields: name, description, price, compare-at price (sale price), image, calories, prep time
- **Product Variants** — define size/type options (e.g., Small / Medium / Large) each with its own price
- **Product Add-ons** — define optional extras (e.g., extra cheese, extra sauce) each with its own price
- **Product Availability Scheduling** — enable/disable a product by day of week and time range (e.g., breakfast only 7am–11am)
- Mark products as hidden or out of stock without deleting them
- Stock/inventory count tracking with atomic decrement to prevent overselling
- View count tracking per product (used in analytics)
- Soft delete (data preserved, hidden from customers)

**Categories**
- Create, edit, and delete categories with multilingual names
- Drag-to-reorder sort order management
- Toggle category visibility (hide/show)
- Soft delete support

---

### 2. Order Management

**Order Types**
- **Dine-in** — customer provides table number and number of people
- **Takeaway** — basic customer info (name, phone)
- **Delivery** — full address, area selection, nearest landmark, delivery fee auto-calculated

**Order Lifecycle**
- Statuses: `pending → confirmed → preparing → delivered/completed` (or `cancelled / rejected`)
- Real-time active orders view for restaurant owners
- Full order history with search and status filtering
- Order details: itemized list, variants, add-ons, subtotal, discount, delivery fee, total

**Order Controls**
- Enable/disable each order type independently (dine-in, takeaway, delivery)
- Server-side price verification on every order (prevents client-side price manipulation)
- Rate limiting: max 5 orders per IP per 15 minutes, max 2 orders per phone per 2 minutes
- Monthly order limit enforcement per subscription plan
- Client IP tracking for spam prevention

**Push Notifications**
- Real-time push notifications to restaurant owner when a new order arrives (via Firebase Cloud Messaging)

---

### 3. Delivery Management

**Delivery Zones**
- Create, edit, and delete named delivery zones
- Flat-rate delivery fee per zone
- Free delivery threshold per zone (e.g., free delivery on orders above $20)
- Minimum order amount per zone
- Estimated delivery time configuration
- Activate/deactivate zones individually

**Delivery Areas**
- Assign one or more delivery areas (districts/neighborhoods) to each zone
- Areas linked to master governorate/city data

**Out-of-Zone Orders**
- Toggle: accept or reject orders from outside defined zones
- Configurable minimum order amount for out-of-zone customers

**Delivery Hours**
- Set delivery working hours per day of week
- All-day operation toggle
- Multiple time slots per day

**Location Hierarchy**
- Master governorate (province) list with multilingual names
- Master area/district list linked to governorates
- Restaurant assigned to a governorate and city from master data

---

### 4. Discounts & Coupons

- Create, edit, and delete coupon codes
- Discount types:
  - **Percentage** (e.g., 10% off)
  - **Fixed amount** (e.g., $5 off)
  - **Free delivery**
- Applies to: entire cart or a specific product
- Minimum order amount requirement per coupon
- Usage limit (max number of redemptions)
- Expiration date
- Global coupon flag (platform-wide coupon usable across restaurants)
- Coupon code: custom input or auto-generated
- Plan-based limits: Free (3 coupons), Pro (20), Business (unlimited)
- Active/inactive toggle; soft delete support

---

### 5. Restaurant Settings & Branding

**Appearance & Theme**
- Logo upload (stored in Supabase Storage)
- Banner image upload
- Primary and secondary color customization
- Theme mode: light / dark / system
- Product layout: grid or list view
- Category navigation: pill tabs
- Font family selection
- Search bar visibility toggle
- Custom welcome message displayed on menu

**Social Media & Contact**
- Facebook, Instagram, Twitter/X, TikTok link fields
- WhatsApp phone number configuration
- Toggle: enable/disable WhatsApp ordering

**Working Hours**
- Set open/close time per day of week
- Mark specific days as closed
- Multiple time slots per day

**Domain**
- URL slug customization (e.g., `menuplus.com/menu/my-restaurant`)
- Custom domain support (Business plan)

**Onboarding Checklist**
- Step-by-step setup guide for new restaurants:
  - Add first category
  - Add first product
  - Customize appearance
  - Share QR menu link

---

### 6. Analytics & Insights

**Restaurant Owner Analytics**
- Total orders (all-time)
- Total revenue (all-time and by period)
- Revenue trend chart (last 7 days)
- Top 5 best-selling products
- Pending orders count

**Intent & Conversion Analytics** *(Pro / Business)*
- Product view count tracking
- Product sales count
- Conversion rate per product (sales ÷ views)
- Product-level performance ranking

**Visit Analytics** *(Pro / Business)*
- Total storefront visits
- Visit source breakdown: QR code scan vs. direct link
- Visit trend chart (last 7 days)
- QR code effectiveness measurement

---

### 7. Authentication & Security

- Email/password signup with restaurant creation in one flow
- Restaurant slug generation and collision detection at signup
- Login with email/password; redirect to dashboard
- Forgot password and email-based reset flow
- Role-based access control:
  - `owner` — full access to own restaurant
  - `manager` — operational access
  - `cashier` — order management
  - `kitchen` — order status updates
  - `super_admin` — platform-wide admin
- Auth guard on all server actions: `requireAuth()`, `requireRestaurantOwnership()`, `requireSuperAdmin()`
- Row-Level Security (RLS) on every database table
- Multi-tenant isolation: every query is scoped to the authenticated restaurant
- Public read access for storefront (menu, products) without authentication

---

### 8. Multi-language & Localization

- **Supported languages:** Arabic (ar), English (en), Kurdish Sorani (ku)
- Full RTL support for Arabic and Kurdish; LTR for English
- 400+ translation keys per locale covering every UI surface
- Per-user language preference; language switcher in dashboard and storefront
- Server-side translation support (Next.js server components)
- All product/category names and descriptions stored in three languages simultaneously
- Direction-aware CSS layout (RTL/LTR auto-switch)

---

### 9. Storefront (Customer-Facing Menu)

**Menu Page** (`/menu/[slug]`)
- Dynamic, branded storefront per restaurant
- Products displayed by category with category filter pills
- Search bar for finding products by name
- Real-time product availability checking (respects scheduling rules)
- Product view count increment on each item click
- Visit tracking (QR scan vs. direct link)

**Product Cards**
- Product image, name, description (in customer's language)
- Price and optional compare-at (sale) price display
- Calorie and prep time display
- Availability badge (out of stock, available only at certain times)
- Add to cart button; opens customization modal if variants/add-ons exist

**Product Customization Modal**
- Variant selection (required — e.g., choose size)
- Add-on selection (optional — e.g., extra toppings)
- Quantity selector
- Live price calculation as options are selected
- Add to cart with full customization context

**Cart**
- Persistent cart per restaurant (survives page refresh via localStorage)
- Floating cart button with item count badge
- Cart drawer: item list, quantity adjustment, remove item, subtotal

**Checkout**
- Order type selection (dine-in / takeaway / delivery) — only shows enabled types
- Dynamic form based on selected order type
- Delivery: area selector from active zones, address, landmark, auto-calculated delivery fee
- Dine-in: table number, number of guests
- Coupon code input with real-time validation and discount display
- Order summary: subtotal, discount, delivery fee, total
- Order submission with server-side price verification

**QR Code**
- Restaurant owners can generate and download a QR code linking to their menu
- One-click copy of menu link

---

### 10. Subscriptions & Feature Gating

| Feature | Free | Pro | Business |
|---|:---:|:---:|:---:|
| Products | 15 | 100 | Unlimited |
| Orders/month | 50 | 500 | Unlimited |
| Coupons | 3 | 20 | Unlimited |
| QR Menu | ✓ | ✓ | ✓ |
| All order types | ✓ | ✓ | ✓ |
| Basic analytics | ✓ | ✓ | ✓ |
| Advanced analytics | — | ✓ | ✓ |
| Theme customization | — | ✓ | ✓ |
| WhatsApp ordering | — | ✓ | ✓ |
| Coupons & discounts | — | ✓ | ✓ |
| Product scheduling | — | ✓ | ✓ |
| Custom domain | — | — | ✓ |
| Priority support | — | — | ✓ |

- Usage warnings displayed at 80% of any limit
- Hard block with upgrade prompt at 100% utilization
- Trial period management (14-day default)
- Feature access checked server-side on every action

---

### 11. Admin Platform

**Platform Dashboard** (`/admin`)
- Total restaurants, orders, users, revenue (all-time)
- Active restaurants (had orders in last 7 days)
- Monthly Recurring Revenue (MRR) with growth % vs. prior month
- Plan distribution: count of free / pro / business restaurants
- Churn rate calculation
- New restaurants this month vs. last month
- Revenue trend chart (last 30 days)
- Restaurant growth trend chart
- Top 5 restaurants by order volume
- Active orders in last 24 hours

**Restaurant Management** (`/admin/restaurants`)
- Full directory with search (by name/slug), filter by plan, filter by status, filter by location
- Pagination
- Export restaurant list to Excel
- Per-restaurant: view, edit, upgrade/downgrade plan, suspend, reactivate
- Edit restaurant info: name, slug, governorate, city, subscription plan

**Restaurant Onboarding Tracking** (`/admin/onboarding`)
- See which restaurants have completed each setup step

**Subscription Management** (`/admin/subscriptions`)
- View and modify all subscriptions
- Assign/change plans; manage trial periods
- Track upgrade/downgrade history

**Locations Management** (`/admin/locations`)
- Manage master governorate and area/district lists
- Import locations from Excel file

**Support Tickets** (`/admin/support`)
- View all tickets across all restaurants
- Filter by status (open / in_progress / closed) and priority (low / medium / high)
- Reply to tickets; update status
- Open ticket count badge

**Broadcast Announcements** (`/admin/announcements`)
- Send platform-wide announcements to all restaurant dashboards
- Types: info / warning / success / error
- Set expiration date; toggle active/inactive

**Activity Logs**
- System-wide log of all significant actions
- Action type, description, metadata (JSON), performed-by user, associated restaurant
- Searchable and filterable

---

### 12. Notifications & Messaging

- Notification bell in dashboard with unread count badge
- In-app notifications for:
  - Usage limit warnings (80% and 100%)
  - Subscription expiry reminders
  - Plan upgrade suggestions
  - Platform announcements from admin
- Firebase Cloud Messaging (FCM) push notifications for new orders (background delivery)
- Global announcement banner: dismissible, type-styled (info/warning/success/error)

---

### 13. Technical & Infrastructure

- **Progressive Web App (PWA)** — installable on mobile for native-like experience
- **Responsive design** — optimized for mobile, tablet, and desktop
- **RTL/LTR layout switching** — fully bidirectional CSS
- **Server Actions** — all mutations handled server-side (Next.js Server Actions)
- **Row-Level Security** — all database tables protected via Supabase RLS policies
- **Soft deletes** — products, categories, coupons retain data after deletion
- **Atomic database operations** — view count increment and stock decrement via SQL functions (concurrency-safe)
- **Image storage** — Supabase Storage with file type and size validation
- **Rate limiting** — IP-based and phone-based order rate limiting
- **Server-side price verification** — all order totals recalculated on the server
- **Zustand cart store** — persistent per-restaurant cart with localStorage sync
- **Real-time updates** — Supabase Realtime for live order notifications
- **SEO** — per-restaurant metadata, dynamic Open Graph tags
- **Mobile navigation** — bottom tab bar and mobile-optimized header for dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Styling | Tailwind CSS v4 |
| UI Components | Shadcn UI + Radix UI |
| State Management | Zustand |
| Validation | Zod |
| Push Notifications | Firebase Admin SDK (FCM) |
| Charts | Recharts |
| Animations | Framer Motion |
| QR Code | qrcode.react |
| Toast Notifications | Sonner |
| Drag & Drop | dnd-kit |
| Data Fetching | TanStack React Query |
| Date Utilities | date-fns |
| Theme | next-themes |

---

## Getting Started

### Prerequisites

- Node.js v18+
- Supabase project
- Firebase project (for push notifications)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_service_account_json
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Run the SQL migration files in `/supabase/` against your Supabase project in order:

1. `schema.sql` — core tables and RLS policies
2. `add_locations_schema.sql` — governorates and areas
3. `add_zone_details.sql` — delivery zone enhancements
4. `update_delivery_settings.sql` — delivery configuration
5. `update_out_of_zone_settings.sql` — out-of-zone order settings
6. `add_activity_logs.sql` — platform activity logging
7. `add_admin_announcements.sql` — broadcast announcements
8. `create_support_tickets.sql` — support ticket system
9. `create_hidden_locations.sql` — location visibility settings

---

## License

This project is proprietary. All rights reserved.
