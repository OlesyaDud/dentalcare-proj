import React from "react";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container py-8 grid md:grid-cols-4 gap-6 text-sm text-gray-600">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded-xl bg-teal-600 text-white grid place-items-center">
              D
            </div>{" "}
            DentalCare
          </div>
          <p className="mt-3">
            Providing modern dental care with a friendly touch. Insurance
            assistance available.
          </p>
        </div>
        <div>
          <div className="font-medium mb-2">Our Services</div>
          <ul className="space-y-1">
            <li>General Dentistry</li>
            <li>Cosmetic Dentistry</li>
            <li>Orthodontics</li>
            <li>Emergency Care</li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-2">Quick Links</div>
          <ul className="space-y-1">
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/services">Services</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
            {/* <li><a href="/appointment">Appointment</a></li> */}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-2">Contact Info</div>
          <ul className="space-y-1">
            <li>(123) 456-7890</li>
            <li>info@dentalcare.com</li>
            <li>123 Main St, City</li>
          </ul>
        </div>
      </div>
      <div className="text-xs text-gray-500 text-center pb-8">
        © {new Date().getFullYear()} DentalCare. All rights reserved.
      </div>
    </footer>
  );
}
