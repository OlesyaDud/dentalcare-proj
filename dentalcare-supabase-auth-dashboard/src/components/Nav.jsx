import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Calendar, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function Nav() {
  const { user } = useAuth();
  const linkClass = ({ isActive }) =>
    "hover:text-teal-600 " + (isActive ? "text-teal-600" : "text-gray-700");
  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b">
      <div className="container py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-teal-600 text-white grid place-items-center font-bold">
            D
          </div>
          <span className="font-semibold">DentalCare</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/services" className={linkClass}>
            Services
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
          <NavLink to="/testimonials" className={linkClass}>
            Testimonials
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            Contact
          </NavLink>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          {/* <Link to="/appointment" className="btn-primary text-sm">
            <Calendar className="h-4 w-4"/> Book Appointment
          </Link> */}
          {user ? (
            <button
              className="btn-secondary text-sm"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          ) : (
            <Link to="/login" className="btn-secondary text-sm">
              <LogIn className="h-4 w-4" /> Staff Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
