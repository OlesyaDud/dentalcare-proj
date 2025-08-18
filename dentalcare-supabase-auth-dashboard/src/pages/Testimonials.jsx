import React from "react";
import { Star } from "lucide-react";

const cards = [
  {
    name: "Sarah Johnson",
    note: "The best dental experience I’ve ever had. Friendly, professional, and thorough!",
    tag: "Cosmetic Dentistry",
  },
  {
    name: "Michael Chen",
    note: "They handled my dental anxiety with so much care. Results exceeded expectations.",
    tag: "Root Canal",
  },
  {
    name: "Emily Rodriguez",
    note: "Great with kids! My son loved his visit — painless and fun.",
    tag: "Family Visits",
  },
  {
    name: "David Wilson",
    note: "Scheduling was super easy. I was seen the same week.",
    tag: "Cleanings",
  },
  {
    name: "Lisa Thompson",
    note: "Transparent, honest, and gentle. Five stars!",
    tag: "Checkup",
  },
  {
    name: "Robert Martinez",
    note: "Beautiful clinic and wonderful staff. Highly recommend.",
    tag: "Whitening",
  },
];

export default function Testimonials() {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold text-center">
        What Our Patients Say
      </h1>
      <p className="text-center text-gray-600 mt-2">
        Real feedback from our community
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {cards.map((c, i) => (
          <div key={i} className="p-5 rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center gap-1 text-amber-500 mb-2">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="h-4 w-4" />
              ))}
            </div>
            <p className="text-sm text-gray-700">{c.note}</p>
            <div className="mt-3 text-xs text-gray-500">
              {c.name} · <span className="italic">{c.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
