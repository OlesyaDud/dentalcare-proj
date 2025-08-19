🦷 DentalCare — AI Receptionist

DentalCare is a demo web app that shows how a 24/7 AI receptionist can answer patient questions, capture inquiries, and book appointments right from your website.
It also includes a simple staff dashboard for same-day booking and daily operations.

✨ Features
AI Receptionist widget on every public page (Ask a question • Schedule • Submit inquiry)
Smart scheduling: pick service → provider → date/time → confirm
Inquiry form with name, email, and phone capture
Staff Dashboard (magic-link login) for quick book + daily checklist
Upcoming appointments list with status & notes
Provider availability & conflict checks (no overlapping bookings)
Custom, code-driven flows (not locked to a proprietary chat template)

🖥 Pages
Marketing: Home, Services, About, Testimonials, Contact
Operations: Dashboard (staff-only, via magic link)
Widget: Floating “AI Receptionist” launcher on all public pages

🛠 Tech Stack
React + Vite – Fast, modern frontend
Tailwind CSS – Utility-first styling
Lucide Icons – Clean icon set
Supabase (Postgres + Auth + RLS) – Data & auth
OpenAI – Natural-language answers

<img width="385" height="367" alt="{9B445E62-BDAC-4D5F-BDB7-FAAB3333354D}" src="https://github.com/user-attachments/assets/7962b986-bd24-4e23-a7ac-48b9a07282f5" />

🧭 How the Chatbot Flow Works
Ask & Answer – Patients ask about hours, insurance, services, pricing basics, etc.
Schedule – Patient chooses service → provider → date/time → a temporary hold is placed.
Confirm – Patient enters name, email, and phone; booking is confirmed and saved to appointments.
Inquiry – If not ready to book, they can submit a message; it’s saved to inquiries.
Dashboard – Staff can also book directly (Quick Book), see today’s appointments, and tick off the daily checklist.

🔑 Authentication
Staff sign in with Supabase magic link.
Add http://localhost:5173/dashboard to Allowed Redirect URLs in Supabase → Auth Settings.

⚙️ Configuration (Mock Defaults)
Services: Checkup, Cleaning, Whitening, Orthodontics, Emergency, Consultation
Default time zone: America/New_York
Default appointment length: 30 minutes
Providers: Seed at least one (e.g., “Dr. Ivanov”) and map services in provider_services.

