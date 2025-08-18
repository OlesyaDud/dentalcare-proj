// src/pages/Contact.jsx
import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "react-toastify";

export default function Contact() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submitContact = async () => {
    if (!contactMsg.trim()) {
      toast.error("Please enter a message.");
      return;
    }
    if (!contactEmail && !contactPhone) {
      toast.error("Provide at least email or phone.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("create_patient_and_inquiry", {
      p_email: contactEmail || null,
      p_phone: contactPhone || null,
      p_subject: "Website contact",
      p_message: contactMsg,
      p_name: contactName || null,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Thanks! Inquiry logged and linked to a patient.");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactMsg("");
  };

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold">Contact Us</h1>
      <p className="text-muted mt-2">We’ll reach out within 24 hours.</p>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border bg-gray-50">
              <Phone className="h-4 w-4" />
              <div className="text-sm mt-1">(123) 456-7890</div>
            </div>
            <div className="p-4 rounded-xl border bg-gray-50">
              <Mail className="h-4 w-4" />
              <div className="text-sm mt-1">info@dentalcare.com</div>
            </div>
            <div className="p-4 rounded-xl border bg-gray-50">
              <MapPin className="h-4 w-4" />
              <div className="text-sm mt-1">123 Main St, City</div>
            </div>
            <div className="p-4 rounded-xl border bg-gray-50">
              <Clock className="h-4 w-4" />
              <div className="text-sm mt-1">Mon–Sat 9am–7pm</div>
            </div>
          </div>

          {/* Lead capture fields */}
          <div className="mt-4 grid sm:grid-cols-4 gap-3">
            <input
              className="input sm:col-span-2"
              placeholder="Your name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <input
              className="input sm:col-span-1"
              placeholder="Your email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <input
              className="input sm:col-span-1"
              placeholder="Your phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <textarea
            className="mt-3 w-full input h-28"
            placeholder="How can we help?"
            value={contactMsg}
            onChange={(e) => setContactMsg(e.target.value)}
          />

          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => (window.location.href = "tel:+11234567890")}
              className="btn-secondary"
              type="button"
            >
              Call Now
            </button>
            <button
              onClick={submitContact}
              className=" bg-teal-600 flex text-white hover:bg-teal-500 items-center justify-center gap-2 disabled:opacity-60"
              disabled={loading}
              type="button"
            >
              <Send className="h-4 w-4" />
              {loading ? "Sending…" : "Send Inquiry"}
            </button>
          </div>
        </div>

        <div className="card">
          <iframe
            title="Map"
            className="rounded-xl w-full h-80"
            src="https://maps.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed"
          />
        </div>
      </div>
    </main>
  );
}
