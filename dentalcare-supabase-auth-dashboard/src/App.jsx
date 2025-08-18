// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import AIReceptionist from "./components/AIReceptionist";
import Home from "./pages/Home";
import Services from "./pages/Services";
import About from "./pages/About";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import Appointment from "./pages/Appointment";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Private({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <main className="container py-10">Loading…</main>;
  if (!user) {
    // preserve destination so we can send them back after login
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" theme="colored" />
      <div className="min-h-screen bg-white text-gray-900">
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/contact" element={<Contact />} />

          {/* Staff-only */}
          <Route
            path="/appointment"
            element={
              <Private>
                <Appointment />
              </Private>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Private>
                <Dashboard />
              </Private>
            }
          />

          {/* Public */}
          <Route path="/login" element={<Login />} />
        </Routes>
        <Footer />
        <AIReceptionist />
      </div>
    </AuthProvider>
  );
}
