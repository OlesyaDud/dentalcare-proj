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

![App Preview](https://github.com/user-attachments/assets/10b66574-929b-48ed-adae-604e4d9febe4)
![App Preview](https://github.com/user-attachments/assets/c92bf358-9b57-43c3-87f6-1be2671bcec5)
![App Preview](https://github.com/user-attachments/assets/dc87880d-1a3a-41f4-a8d9-48765a07c815)
![App Preview](https://github.com/user-attachments/assets/735f5e7b-b48d-46b6-a3ae-15c93dbab005)
![App Preview](https://github.com/user-attachments/assets/5dada84d-e8a3-4aee-b945-5916d6fd7f14)
![App Preview](https://github.com/user-attachments/assets/e479132c-19ed-47d2-a1ca-de6c42c3e471)
![App Preview](https://github.com/user-attachments/assets/cbf63ddb-a61a-48bd-84dc-7c665e9d6af3)
![App Preview](https://github.com/user-attachments/assets/bd988f29-3b66-4c30-89ae-34894c429242)
![App Preview](https://github.com/user-attachments/assets/95b00589-4092-4a17-b6f6-b0abfc47ca94)
![App Preview](https://github.com/user-attachments/assets/f53ee675-d7c9-44ad-abe9-acdb5506dbf5)


