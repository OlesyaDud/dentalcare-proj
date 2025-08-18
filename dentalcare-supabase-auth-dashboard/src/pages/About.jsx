// src/components/About.jsx
import React from "react";

export default function About() {
  return (
    <main className="container py-10 grid md:grid-cols-2 gap-8 items-start">
      <div>
        <div className="inline-flex items-center gap-2 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full border border-teal-200 mb-3">
          Our Practice
        </div>

        <h1 className="text-3xl font-semibold">
          About <span className="text-teal-600">DentalCare</span>
        </h1>

        <p className="mt-3 text-gray-600">
          For over 15 years, we’ve been dedicated to providing exceptional
          dental care to our community. Our team is committed to compassionate,
          patient-first care in a warm, welcoming environment.
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <li className="p-3 rounded-xl border border-teal-200 bg-white">
            <span className="font-medium text-teal-700">500+</span> Happy
            Patients
          </li>
          <li className="p-3 rounded-xl border border-teal-200 bg-white">
            <span className="font-medium text-teal-700">15+</span> Years
            Experience
          </li>
          <li className="p-3 rounded-xl border border-teal-200 bg-white">
            <span className="font-medium text-teal-700">24/7</span> Emergency
            Care
          </li>
          <li className="p-3 rounded-xl border border-teal-200 bg-white">
            <span className="font-medium text-teal-700">Full</span> Insurance
            Assistance
          </li>
        </ul>
      </div>

      <div className="rounded-2xl overflow-hidden border shadow bg-white">
        <img
          src="https://images.unsplash.com/photo-1629904853716-f0bc54eea481?q=80&w=1600&auto=format&fit=crop"
          alt="Team"
          className="w-full h-[360px] object-cover"
        />
      </div>
    </main>
  );
}
