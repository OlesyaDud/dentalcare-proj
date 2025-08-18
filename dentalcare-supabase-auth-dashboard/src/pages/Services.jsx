import React from "react";

export default function Services() {
  const items = [
    {
      title: "General Dentistry",
      bullets: ["Cleanings & exams", "Fillings", "Preventive care"],
    },
    {
      title: "Cosmetic Dentistry",
      bullets: ["Veneers", "Whitening", "Smile makeovers"],
    },
    {
      title: "Orthodontics",
      bullets: ["Clear aligners", "Traditional braces"],
    },
    { title: "Periodontal Care", bullets: ["Deep cleaning", "Maintenance"] },
    {
      title: "Emergency Care",
      bullets: ["Toothache", "Chipped tooth", "Urgent swelling"],
    },
    { title: "Oral Surgery", bullets: ["Extractions", "Surgical procedures"] },
  ];
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold">Our Services</h1>
      <p className="text-gray-600 mt-2">
        We provide comprehensive dental care with modern techniques.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {items.map((s) => (
          <div
            key={s.title}
            className="p-5 rounded-2xl border bg-white shadow-sm"
          >
            <div className="font-medium">{s.title}</div>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
              {s.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
