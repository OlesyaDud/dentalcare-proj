// src/components/AIReceptionistInInquiry.jsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/* ===================== utils ===================== */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizePhone11 = (input = "") => {
  const d = String(input).replace(/\D/g, "");
  if (d.length === 10) return "1" + d;
  if (d.length === 11 && d.startsWith("1")) return d;
  return null;
};

/* ===================== styles ===================== */
const cls = {
  primaryBtn:
    "rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm py-2 px-4 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-teal-500",
  input:
    "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500",
  textarea:
    "w-full min-h-[120px] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500",
  bubble: "px-3 py-2 rounded-xl text-sm bg-gray-100",
};

/* ===================== Lead form ===================== */
function LeadForm({ onSubmit, busy }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (k === "email")
      setErrors((er) => ({
        ...er,
        email: !val || !emailRe.test(val) ? "Valid email required" : "",
      }));
    if (k === "phone")
      setErrors((er) => ({
        ...er,
        phone: normalizePhone11(val) ? "" : "US phone: 10 or 11 digits",
      }));
    if (k === "name")
      setErrors((er) => ({ ...er, name: !val.trim() ? "Name required" : "" }));
    if (k === "message")
      setErrors((er) => ({
        ...er,
        message:
          !val || val.trim().length < 5 ? "Please add a short message" : "",
      }));
  };

  const canSubmit =
    !busy &&
    form.name.trim() &&
    form.email.trim() &&
    emailRe.test(form.email.trim()) &&
    !!normalizePhone11(form.phone) &&
    form.message &&
    form.message.trim().length >= 5;

  return (
    <div className="p-3 rounded-xl border bg-white">
      <div className="text-sm font-medium mb-2">How can we help?</div>

      <div className="space-y-2">
        <textarea
          className={cls.textarea}
          placeholder="Type your question or a short message…"
          value={form.message}
          onChange={set("message")}
          disabled={busy}
        />
        {errors.message && (
          <div className="text-xs text-red-600 mt-1">{errors.message}</div>
        )}

        <input
          className={cls.input}
          placeholder="Your name"
          value={form.name}
          onChange={set("name")}
          disabled={busy}
        />
        {errors.name && (
          <div className="text-xs text-red-600 mt-1">{errors.name}</div>
        )}

        <input
          className={cls.input}
          placeholder="Email (required)"
          value={form.email}
          onChange={set("email")}
          disabled={busy}
        />
        {errors.email && (
          <div className="text-xs text-red-600 mt-1">{errors.email}</div>
        )}

        <input
          className={cls.input}
          placeholder="Phone (required, digits only)"
          value={form.phone}
          onChange={set("phone")}
          disabled={busy}
        />
        <div className="text-[11px] text-gray-500 mt-1">
          Format: 10 or 11 digits; saved as <code>10000000000</code>.
        </div>
        {errors.phone && (
          <div className="text-xs text-red-600 mt-1">{errors.phone}</div>
        )}
      </div>

      <button
        onClick={() => onSubmit(form)}
        disabled={!canSubmit}
        className={`mt-3 w-full ${cls.primaryBtn}`}
        type="button"
      >
        {busy ? "Sending…" : "Send"}
      </button>
      <p className="text-[11px] text-gray-500 mt-2">
        We’ll reply promptly with next steps.
      </p>
    </div>
  );
}

/* ===================== Component ===================== */
export default function AIReceptionistInInquiry({ onReturnHome }) {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const listRef = useRef(null);

  const push = (row) => setMsgs((m) => [...m, row]);

  // initial content (form) or thank you
  useEffect(() => {
    if (!submitted) {
      setMsgs([
        {
          who: "bot",
          text: "Hi! I’m your receptionist. Please share your message and contact details below.",
        },
        { who: "bot", type: "leadform" },
      ]);
    } else {
      setMsgs([
        {
          who: "bot",
          text: "Thanks! We received your message and will reply promptly with next steps.",
        },
      ]);
    }
  }, [submitted]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs]);

  const submitLead = async (form) => {
    const email = (form.email || "").trim();
    const phone11 = normalizePhone11(form.phone);

    // guard (UI already validates, but keep server-side safety)
    if (!form.name.trim()) return;
    if (!email || !emailRe.test(email)) return;
    if (!phone11) return;
    if (!form.message || form.message.trim().length < 5) return;

    try {
      setBusy(true);

      const insertRow = {
        channel: "web",
        subject: "Question: General",
        status: "open",
        name: form.name.trim(),
        email,
        phone: phone11,
        service: "General",
        provider: null,
        preferred_start: null,
        preferred_end: null,
        message: form.message?.trim() || null,
      };

      const { error } = await supabase.from("inquiries").insert(insertRow);
      if (error) throw error;

      setSubmitted(true); // show thank-you + Return Home
    } catch (e) {
      console.error("submitLead failed:", e);
      push({
        who: "bot",
        text: "Sorry—couldn’t send that right now. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const renderRow = (m, i) => {
    if (m?.type === "leadform" && !submitted) {
      return <LeadForm key={i} onSubmit={submitLead} busy={busy} />;
    }
    return (
      <div key={i} className={cls.bubble}>
        {m?.text || ""}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={listRef}
        className="px-3 py-3 max-h-[420px] overflow-auto space-y-3 bg-white"
      >
        {msgs.map(renderRow)}
        {submitted && (
          <button
            onClick={() => onReturnHome?.()}
            className="w-full mt-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm py-2"
          >
            Return Home
          </button>
        )}
      </div>

      <div className="px-4 py-2 text-[11px] text-gray-600 border-t">
        {busy
          ? "Working…"
          : submitted
          ? "Inquiry submitted."
          : "Your message will be logged as an inquiry."}
      </div>
    </div>
  );
}
