# DentalCare · Supabase Auth + Staff Dashboard

This version adds **Supabase Auth (magic links)** and a protected **Staff Dashboard** to the Supabase-only app.

## Features
- Public marketing pages + forms (inquiries & appointment requests write to Supabase)
- Floating **AI Receptionist** that performs your checklist actions
- **Login** page (email magic links) — after login you can access `/dashboard`
- **Dashboard** shows:
  - Open inquiries
  - Today’s appointments
  - Daily checklist with toggle + “Init Today”

## Setup
1. Create a Supabase project and run your schema (the CRUD tables & policies you already created).
2. In **Authentication → URL Configuration**, add:
   - **Site URL:** `http://localhost:5173`
   - **Redirect URLs:** `http://localhost:5173/dashboard`
3. Configure env and run:
   ```bash
   cp .env.example .env
   # set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   npm install
   npm run dev
   ```

## Policies
- Anonymous users can insert **inquiries** and **appointments** (public forms).
- Authenticated users (staff) can read/write all operational tables.

Generated: 2025-08-15T10:54:47.347202Z
