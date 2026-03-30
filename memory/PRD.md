# Launch Local - E-Commerce Store PRD

## Original Problem Statement
Build an online store for Launch Local to sell items off Faire. Categories include: Home & Hardware, Cologne/Perfumes, Candles, Generators, Battery Packs, and Apparel.

## User Personas
1. **Shoppers** - Browse products, add to cart, checkout with Stripe
2. **Admin** - Manage products, view orders, track inventory

## Core Requirements
- Product catalog with 6 categories
- Shopping cart with persistent storage
- Stripe payment integration
- Admin dashboard for product/order management
- JWT authentication for admin access

## What's Been Implemented (Jan 2026)

### Backend (FastAPI + MongoDB)
- ✅ Products CRUD with categories, featured flag, stock tracking
- ✅ Categories endpoint (6 categories)
- ✅ Cart calculation endpoint
- ✅ Stripe checkout session creation
- ✅ Payment status polling
- ✅ Orders management
- ✅ Admin stats dashboard
- ✅ JWT authentication with bcrypt password hashing
- ✅ Admin seeding on startup
- ✅ Sample products seeding (18 products)

### Frontend (React + Tailwind)
- ✅ Homepage with hero, categories grid, featured products
- ✅ Shop page with filters (category, featured, search)
- ✅ Product detail page with add to cart
- ✅ Categories page (bento grid layout)
- ✅ Cart sidebar (Sheet component)
- ✅ Checkout page with Stripe redirect
- ✅ Success/Cancel pages with payment polling
- ✅ Login/Register pages
- ✅ Admin dashboard with tabs (Overview, Products, Orders)
- ✅ Product CRUD modal
- ✅ Order status management

### Design
- Organic & Earthy theme (#4A5D4E primary, #FAF9F6 background)
- Cabinet Grotesk + Manrope fonts
- Bento grid layouts
- Glassmorphism header
- Shadcn UI components

## P0 Features (MVP - DONE)
- [x] Product listing and detail pages
- [x] Shopping cart functionality
- [x] Stripe checkout integration
- [x] Admin authentication
- [x] Admin product management

## P1 Features (Next Phase)
- [ ] Order confirmation emails
- [ ] Customer accounts with order history
- [ ] Product image gallery
- [ ] Inventory alerts for low stock

## P2 Features (Future)
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Discount codes/coupons
- [ ] Analytics dashboard

## Technical Notes
- Backend: FastAPI on port 8001
- Frontend: React on port 3000
- Database: MongoDB (MONGO_URL in .env)
- Stripe: Test key sk_test_emergent
- Admin: admin@launchlocal.com / LaunchLocal2024!
