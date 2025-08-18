import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { Check, RefreshCcw, Calendar, Search } from "lucide-react";
import { toast } from "react-toastify";

/* ------------ small utils ------------ */
const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
const fromLocalInputToISO = (str) => {
  const d = new Date(str);
  return isNaN(d) ? null : d.toISOString();
};
const plusMinutes = (d, m) => new Date(d.getTime() + m * 60000);
const nextHalfHour = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  d.setMinutes(mins + (30 - (mins % 30 || 30)));
  return d;
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizePhone11 = (input = "") => {
  const d = String(input).replace(/\D/g, "");
  if (d.length === 10) return "1" + d;
  if (d.length === 11 && d.startsWith("1")) return d;
  return null;
};

const friendlyError = (raw = "") => {
  const msg = String(raw).toLowerCase();
  if (msg.includes("appointments_no_overlap"))
    return "That provider already has an appointment in this slot.";
  if (msg.includes("appt_time_ok")) return "End time must be after start time.";
  if (msg.includes("conflict_hold"))
    return "That time was just taken. Pick another slot.";
  if (msg.includes("hold_expired")) return "The hold expired. Try again.";
  if (msg.includes("hold_not_found"))
    return "Hold not found. Please retry the time.";
  if (msg.includes("hold_already_used"))
    return "That hold was already used. Pick a new time.";
  return null;
};

export default function Dashboard() {
  const { user, loading } = useAuth();

  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [busy, setBusy] = useState(false);

  /* ---------- providers for Quick Book ---------- */
  const [providers, setProviders] = useState([]);
  const [qbProviderId, setQbProviderId] = useState("");
  const [qbProviderName, setQbProviderName] = useState("");

  /* ---------- Quick Book state ---------- */
  const [qbQuery, setQbQuery] = useState("");
  const [qbResults, setQbResults] = useState([]);
  const [qbPatientId, setQbPatientId] = useState("");
  const [qbType, setQbType] = useState("Checkup");
  const [qbStart, setQbStart] = useState(toLocalInput(nextHalfHour()));
  const [qbEnd, setQbEnd] = useState(
    toLocalInput(plusMinutes(nextHalfHour(), 30))
  );
  const [qbNotes, setQbNotes] = useState("");
  const [qbBusy, setQbBusy] = useState(false);

  /* ============== load lists ============== */
  const load = async () => {
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: iq }, { data: ap }, { data: cl }, { data: prov }] =
      await Promise.all([
        supabase
          .from("inquiries")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("appointments")
          .select("*")
          .gte("start_at", today)
          .order("start_at", { ascending: true })
          .limit(20),
        supabase
          .from("daily_checklist")
          .select("*")
          .eq("date", today)
          .order("item"),
        supabase
          .from("providers")
          .select("id, display_name")
          .order("display_name"),
      ]);

    setInquiries(iq || []);
    setAppointments(ap || []);
    setChecklist(cl || []);
    setProviders(prov || []);

    if ((prov || []).length && !qbProviderId) {
      setQbProviderId(prov[0].id);
      setQbProviderName(prov[0].display_name);
    }
    setBusy(false);
  };

  useEffect(() => {
    if (!loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /* ============== checklist actions ============== */
  const toggleChecklist = async (row) => {
    const { error } = await supabase
      .from("daily_checklist")
      .update({
        completed: !row.completed,
        completed_at: !row.completed ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    if (!error) {
      setChecklist((list) =>
        list.map((i) =>
          i.id === row.id
            ? {
                ...i,
                completed: !i.completed,
                completed_at: !i.completed ? new Date().toISOString() : null,
              }
            : i
        )
      );
    }
  };

  const initToday = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { error: rpcError } = await supabase.rpc("init_daily_checklist", {
      p_date: today,
    });
    if (rpcError) {
      const defaults = [
        "Respond to online inquiries promptly",
        "Answer incoming calls politely",
        "Schedule appointments efficiently",
        "Verify patient insurance information",
        "Manage front desk operations smoothly",
      ];
      const existing = new Set(checklist.map((r) => r.item));
      const rows = defaults
        .filter((i) => !existing.has(i))
        .map((item) => ({ date: today, item }));
      if (rows.length) await supabase.from("daily_checklist").insert(rows);
    }
    load();
  };

  /* ============== Quick Book helpers ============== */
  const onStartChange = (val) => {
    setQbStart(val);
    const s = new Date(val);
    const e = new Date(qbEnd);
    if (isNaN(s) || e <= s) setQbEnd(toLocalInput(plusMinutes(s, 30)));
  };

  const searchPatients = async (q) => {
    setQbQuery(q);
    setQbPatientId("");
    if (!q || q.length < 2) {
      setQbResults([]);
      return;
    }
    const { data, error } = await supabase
      .from("patients")
      .select("id, first_name, last_name, email, phone")
      .or(
        `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`
      )
      .limit(8);
    if (!error) setQbResults(data || []);
  };

  const choosePatient = (p) => {
    setQbPatientId(p.id);
    setQbQuery(
      `${p.first_name} ${p.last_name} • ${p.email || p.phone || p.id}`
    );
    setQbResults([]);
  };

  const selectProviderById = (id) => {
    setQbProviderId(id);
    const name = providers.find((p) => p.id === id)?.display_name || "";
    setQbProviderName(name);
  };

  // If staff typed an exact email/phone but didn’t click, auto-pick.
  const resolvePatientFromQueryIfNeeded = async () => {
    if (qbPatientId) return qbPatientId;
    const q = qbQuery.trim();
    if (!q) return null;

    // Email exact (case-insensitive)
    if (emailRe.test(q)) {
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email, phone")
        .ilike("email", q)
        .limit(2);
      if (data?.length === 1) {
        choosePatient(data[0]);
        return data[0].id;
      }
      return null;
    }

    // Phone exact (support 10/11 digits)
    const p11 = normalizePhone11(q);
    if (p11) {
      const alt = p11.length === 11 ? p11.slice(1) : null;
      const phones = alt ? [p11, alt] : [p11];
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email, phone")
        .in("phone", phones)
        .limit(2);
      if (data?.length === 1) {
        choosePatient(data[0]);
        return data[0].id;
      }
    }
    return null;
  };

  /* ============== Quick Book flow ============== */
  const quickBook = async () => {
    // Try to auto-resolve typed email/phone.
    await resolvePatientFromQueryIfNeeded();

    if (!qbPatientId)
      return toast.error("Pick a patient (click a search result).");
    if (!qbProviderId) return toast.error("Pick a provider.");

    const sISO = fromLocalInputToISO(qbStart);
    const eISO = fromLocalInputToISO(qbEnd);
    if (!sISO || !eISO) return toast.error("Pick valid times.");
    if (new Date(eISO) <= new Date(sISO))
      return toast.error("End must be after start.");

    // load patient details for RPC
    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("first_name, last_name, email, phone")
      .eq("id", qbPatientId)
      .single();

    if (pErr || !patient) return toast.error("Could not load patient details.");

    const fullName =
      [patient.first_name, patient.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Patient";
    const phone11 = normalizePhone11(patient.phone || "");
    const providerName =
      providers.find((x) => x.id === qbProviderId)?.display_name ||
      qbProviderName ||
      "Provider";

    setQbBusy(true);

    // 1) Place a hold
    const { data: holdId, error: holdErr } = await supabase.rpc("hold_slot", {
      p_provider_id: qbProviderId,
      p_start: sISO,
      p_end: eISO,
      p_channel: "dashboard",
    });

    if (holdErr) {
      setQbBusy(false);
      return toast.error(friendlyError(holdErr.message) || holdErr.message);
    }

    // 2) Confirm using the hold (same as chatbot)
    const { data: appt, error: bookErr } = await supabase.rpc(
      "book_from_hold",
      {
        p_hold_id: holdId,
        p_patient_email: patient.email || null,
        p_patient_name: fullName,
        p_patient_phone: phone11,
        p_type: qbType,
        p_notes: qbNotes || "via dashboard",
        p_source: "dashboard",
      }
    );

    // If the DB function trips over a schema nuance (e.g., “column ‘first_name’ is ambiguous”),
    // fall back to a direct insert so staff can proceed.
    if (bookErr) {
      const msg = bookErr.message || "";
      if (msg.toLowerCase().includes("ambiguous")) {
        const { error: insErr } = await supabase.from("appointments").insert({
          patient_id: qbPatientId,
          provider_id: qbProviderId,
          provider: providerName,
          start_at: sISO,
          end_at: eISO,
          type: qbType,
          notes: qbNotes || "via dashboard",
          source: "dashboard",
          status: "scheduled",
        });
        setQbBusy(false);
        if (insErr) {
          return toast.error(friendlyError(insErr.message) || insErr.message);
        }
        toast.success("Appointment booked!");
        setQbNotes("");
        return load();
      }

      setQbBusy(false);
      return toast.error(friendlyError(msg) || msg);
    }

    setQbBusy(false);
    toast.success("Appointment booked!");
    setQbNotes("");
    load();
  };

  const providerLabelForAppt = (a) => {
    if (a.provider) return a.provider;
    if (a.provider_id) {
      const p = providers.find((x) => x.id === a.provider_id);
      if (p) return p.display_name;
    }
    return "Provider";
  };

  if (loading) return <main className="container py-10">Loading…</main>;
  if (!user) return <main className="container py-10">Please log in.</main>;

  return (
    <main className="container py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Staff Dashboard</h1>
        <button onClick={load} className="btn-secondary">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* ---- Quick Book Appointment ---- */}
      <section className="card">
        <div className="font-medium mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Quick Book Appointment
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {/* Search + pick patient */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                className="input flex-1"
                placeholder="Search patient (name / email / phone)…"
                value={qbQuery}
                onChange={(e) => searchPatients(e.target.value)}
              />
            </div>

            {qbResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-xl shadow">
                {qbResults.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    onClick={() => choosePatient(p)}
                    type="button"
                  >
                    <div className="text-sm font-medium">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.email || p.phone} · {p.id.slice(0, 8)}…
                    </div>
                  </button>
                ))}
              </div>
            )}

            {qbPatientId && (
              <div className="text-xs text-gray-500 mt-1">
                Selected ID: {qbPatientId}
              </div>
            )}
          </div>

          {/* Provider */}
          <select
            className="input"
            value={qbProviderId || ""}
            onChange={(e) => selectProviderById(e.target.value)}
          >
            {providers.length === 0 ? (
              <option value="">No providers</option>
            ) : null}
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>

          {/* Type & times */}
          <select
            className="input"
            value={qbType}
            onChange={(e) => setQbType(e.target.value)}
          >
            <option>Checkup</option>
            <option>Cleaning</option>
            <option>Consultation</option>
            <option>Emergency</option>
            <option>Whitening</option>
            <option>Orthodontics</option>
          </select>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="input"
              type="datetime-local"
              value={qbStart}
              min={toLocalInput(new Date())}
              step={900}
              onChange={(e) => onStartChange(e.target.value)}
            />
            <input
              className="input"
              type="datetime-local"
              value={qbEnd}
              min={qbStart}
              step={900}
              onChange={(e) => setQbEnd(e.target.value)}
            />
          </div>
        </div>

        <textarea
          className="mt-3 w-full input h-24"
          placeholder="Notes (reason, insurance, preferences)"
          value={qbNotes}
          onChange={(e) => setQbNotes(e.target.value)}
        />

        <button
          onClick={quickBook}
          className="mt-3 btn-primary w-full disabled:opacity-60"
          disabled={qbBusy || !qbProviderId}
        >
          {qbBusy ? "Booking…" : "Book Appointment"}
        </button>
      </section>

      {/* ---- Inquiries & Upcoming Appointments ---- */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-medium mb-2">Open Inquiries</div>
          <div className="space-y-2 max-h-80 overflow-auto">
            {inquiries.length === 0 && (
              <div className="text-sm text-muted">No inquiries yet.</div>
            )}
            {inquiries.map((q) => (
              <div key={q.id} className="p-3 border rounded-xl">
                <div className="text-sm font-medium">
                  {q.subject || "No subject"}{" "}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 capitalize">
                    {q.status}
                  </span>
                </div>
                <div className="text-sm text-muted whitespace-pre-wrap">
                  {q.message}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {new Date(q.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="font-medium mb-2">Upcoming Appointments</div>
          <div className="space-y-2 max-h-80 overflow-auto">
            {appointments.length === 0 && (
              <div className="text-sm text-muted">
                No upcoming appointments.
              </div>
            )}
            {appointments.map((a) => (
              <div key={a.id} className="p-3 border rounded-xl">
                <div className="text-sm font-medium flex items-center gap-2">
                  <span>
                    {providerLabelForAppt(a)} • {a.type || "Appointment"}
                  </span>
                  {a.status && (
                    <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 capitalize">
                      {a.status}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted">
                  {new Date(a.start_at).toLocaleString()} →{" "}
                  {new Date(a.end_at).toLocaleString()}
                </div>
                {a.notes && <div className="text-sm mt-1">{a.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Daily Checklist ---- */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Daily Checklist</div>
          <div className="flex gap-2">
            <button onClick={initToday} className="btn-secondary">
              Init Today
            </button>
            <button onClick={load} className="btn-secondary">
              Reload
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {checklist.length === 0 && (
            <div className="text-sm text-muted">
              No items yet. Click Init Today.
            </div>
          )}
          {checklist.map((row) => (
            <label
              key={row.id}
              className={`flex items-center gap-3 p-3 border rounded-xl ${
                row.completed ? "bg-green-50" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={row.completed}
                onChange={() => toggleChecklist(row)}
              />
              <span className="text-sm">{row.item}</span>
              {row.completed && (
                <span className="ml-auto text-xs text-green-700 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Done
                </span>
              )}
            </label>
          ))}
        </div>
      </section>
    </main>
  );
}
