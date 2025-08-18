// src/pages/Appointment.jsx
import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "react-toastify";

// ----- helpers -----
const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
const fromLocalInputToISO = (str) => {
  const d = new Date(str); // local -> Date
  return isNaN(d) ? null : d.toISOString(); // send ISO to timestamptz
};
const plusMinutes = (d, m) => new Date(d.getTime() + m * 60000);
const nextHalfHour = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  d.setMinutes(mins + (30 - (mins % 30 || 30)));
  return d;
};

// defaults
const startDefault = nextHalfHour();
const endDefault = plusMinutes(startDefault, 30);
const minStart = new Date(); // can't book in the past

export default function Appointment() {
  const [patientId, setPatientId] = useState("");
  const [provider, setProvider] = useState("Dr. Ivanov");
  const [apptType, setApptType] = useState("Checkup"); // NEW
  const [startAt, setStartAt] = useState(toLocalInput(startDefault));
  const [endAt, setEndAt] = useState(toLocalInput(endDefault));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const handleStartChange = (val) => {
    setStartAt(val);
    const s = new Date(val);
    const e = new Date(endAt);
    if (isNaN(s) || e <= s) setEndAt(toLocalInput(plusMinutes(s, 30)));
  };

  const submitAppt = async () => {
    if (!patientId) {
      toast.error("Please paste a Patient UUID.");
      return;
    }
    const startISO = fromLocalInputToISO(startAt);
    const endISO = fromLocalInputToISO(endAt);
    if (!startISO || !endISO) {
      toast.error("Pick valid date & time.");
      return;
    }
    if (new Date(endISO) <= new Date(startISO)) {
      toast.error("End must be after start.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.from("appointments").insert({
      patient_id: patientId,
      provider,
      start_at: startISO,
      end_at: endISO,
      type: apptType, // NEW
      notes,
    });
    setBusy(false);

    if (error) {
      if (String(error.message).includes("appointments_no_overlap")) {
        toast.error("That provider already has an appointment in this slot.");
      } else if (String(error.message).includes("appt_time_ok")) {
        toast.error("End time must be after start time.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Appointment requested!");
    setNotes("");
  };

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold flex items-center gap-2">
        <Calendar className="h-7 w-7" /> Book an Appointment
      </h1>
      <p className="text-muted mt-2">
        Fill out the form and we’ll confirm shortly.
      </p>

      <div className="card mt-6">
        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Patient UUID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
          <input
            className="input"
            placeholder="Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />

          {/* Appointment Type */}
          <select
            className="input"
            value={apptType}
            onChange={(e) => setApptType(e.target.value)}
          >
            <option>Checkup</option>
            <option>Cleaning</option>
            <option>Consultation</option>
            <option>Emergency</option>
            <option>Whitening</option>
            <option>Orthodontics</option>
          </select>

          <input
            className="input"
            type="datetime-local"
            value={startAt}
            min={toLocalInput(minStart)}
            step={900} // 15-min increments
            onChange={(e) => handleStartChange(e.target.value)}
          />
          <input
            className="input"
            type="datetime-local"
            value={endAt}
            min={startAt}
            step={900}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>

        <textarea
          className="mt-3 w-full input h-28"
          placeholder="Notes (reason for visit, insurance, preferences)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={submitAppt}
          className="mt-3 w-full btn-primary disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Scheduling…" : "Schedule Appointment"}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          We’ll call/text to confirm time and insurance details.
        </p>
      </div>
    </main>
  );
}
