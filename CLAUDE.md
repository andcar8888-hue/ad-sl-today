# AD SL Today — Project Instructions

## Overview
Classified ads platform for Sri Lanka. Red & black theme. Family-friendly
content only (no adult ads). Sinhala-friendly UX, English/Sinhala mixed
labels where natural.

## Stack
- Frontend: React (Vite), Tailwind CSS
- Backend: Node.js, Express, MongoDB (Mongoose)
- Auth: JWT-based, bcrypt password hashing
- Image upload: Cloudinary or local /uploads (decide + document choice)

## Core User Flow
1. Register/Login
2. Post Ad form: title, description, images (multiple), whatsapp number,
   telegram username/number (optional), category
3. Submit -> redirected to Checkout page
4. Checkout page shows: bank account details + a generated unique user code
   tied to that ad submission
5. User pays manually (bank transfer) and sends payment receipt + user code
   to a WhatsApp number (outside the app, manual step)
6. Ad status = "pending_payment" until admin manually confirms
7. Super Admin approves the ad in the admin dashboard -> status = "approved"
   -> ad becomes publicly visible
8. Admin can also reject ads with a reason

## Ad Statuses
draft -> pending_payment -> approved | rejected -> expired

## Features
- Favourites (save ads per logged-in user)
- Share buttons (native share / copy link / social)
- Search + category filters
- Super Admin Dashboard: manage users, manage ads (approve/reject/delete),
  manage categories, view all submitted user codes/payments

## Conventions
- All API routes prefixed /api/v1
- Use async/await, no callback style
- Validate all inputs (express-validator or zod)
- Never trust client-side role checks — verify admin role server-side
- Write JSDoc comments for all controller functions
- Keep components small and reusable in frontend/src/components

## Do NOT
- Do not implement real payment gateway integration (this is manual
  bank-transfer + WhatsApp receipt confirmation flow only)
- Do not add adult/inappropriate ad categories
