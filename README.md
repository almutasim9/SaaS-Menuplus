# MenuPlus — SaaS Restaurant Management System

MenuPlus is a comprehensive restaurant management platform designed to streamline digital menus, order processing, and business analytics.

## 🚀 Features
- **Digital Menu**: Interactive, QR-code based menus for customers.
- **Admin Dashboard**: Real-time management of products, categories, and order statuses.
- **Multi-language Support**: Full RTL/LTR localization for Arabic, Kurdish (Sorani), and English.
- **Order Management**: Robust tracking of Dine-in, Takeaway, and Delivery orders.
- **Analytics & Insights**: Sales data, product performance, and visitor conversion rates.
- **Secure Authentication**: Email-based signup/login with password recovery flow.
- **Modern Tech Stack**: Built with Next.js 15, Supabase, Tailwind CSS, and Shadcn UI.

## 🛠️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com)
- **Localization**: Custom i18n implementation

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Supabase Account & Project

### 2. Environment Setup
Create a `.env.local` file in the root directory and add the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📱 Progressive Web App (PWA)
MenuPlus is PWA-ready. You can install it on your mobile device for a native-like experience.

## 📄 License
This project is licensed under the MIT License.
