// src/components/Home.jsx
import React from "react";
import {
  Calendar,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  Heart,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main>
      {/* Header / hero */}
      <section className="bg-gradient-to-b from-white to-teal-50/60">
        <div className="container py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full border border-teal-200 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              Safe &amp; Clean · Aseptic protocol
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Your Smile is Our <span className="text-teal-600">Priority</span>
            </h1>

            <p className="mt-4 text-muted max-w-prose">
              Experience exceptional dental care in a comfortable, modern
              environment. We’re committed to helping you achieve optimal oral
              health and a beautiful smile.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/appointment"
                className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 shadow-sm"
              >
                Book Your Appointment Today
              </Link>
              <Link
                to="/services"
                className="rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 px-4 py-2"
              >
                Learn More About Our Services
              </Link>
            </div>

            <div className="flex items-center gap-2 mt-5 text-sm text-gray-600">
              <Star className="h-4 w-4 text-amber-500" />
              500+ 5-star reviews · Open 7 days
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden border shadow-md bg-white">
              <img
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1600&auto=format&fit=crop"
                alt="Clinic"
                className="w-full h-[360px] object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white border rounded-xl shadow p-3 text-sm hidden md:block">
              <div className="font-medium">Easy Scheduling</div>
              <div className="text-gray-500">Book online 24/7</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-14">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">
            Our Dental Services
          </h2>
          <p className="text-center text-muted mt-2">
            Comprehensive care using modern technology and techniques.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[
              {
                title: "General Dentistry",
                desc: "Cleanings, exams, fillings, and routine care.",
                icon: <CheckCircle2 className="h-5 w-5" />,
              },
              {
                title: "Cosmetic Dentistry",
                desc: "Whitening, veneers, and smile makeovers.",
                icon: <Heart className="h-5 w-5" />,
              },
              {
                title: "Orthodontics",
                desc: "Clear aligners and braces for all ages.",
                icon: <Settings className="h-5 w-5" />,
              },
              {
                title: "Periodontal Care",
                desc: "Gum health, deep cleanings, and maintenance.",
                icon: <ShieldCheck className="h-5 w-5" />,
              },
              {
                title: "Emergency Care",
                desc: "Same-day toothache & urgent issues.",
                icon: <Clock className="h-5 w-5" />,
              },
              {
                title: "Oral Surgery",
                desc: "Extractions and surgical procedures.",
                icon: <Calendar className="h-5 w-5" />,
              },
            ].map((item) => (
              <div key={item.title} className="card hover:shadow-md transition">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 grid place-items-center mb-3">
                  {item.icon}
                </div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-muted mt-1">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/appointment"
              className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 shadow-sm"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
