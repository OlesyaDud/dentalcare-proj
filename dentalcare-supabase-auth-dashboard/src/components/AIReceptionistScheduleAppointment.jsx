import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Bot } from "lucide-react";

/* ===================== config ===================== */
const SERVICES_SCHED = [
  { key: "checkup", label: "Checkup", blurb: "Full exam and treatment plan." },
  { key: "cleaning", label: "Cleaning", blurb: "Routine cleaning & polish." },
  { key: "whitening", label: "Whitening", blurb: "In-office teeth whitening." },
  {
    key: "orthodontics",
    label: "Orthodontics",
    blurb: "Braces & clear aligners.",
  },
  { key: "emergency", label: "Emergency", blurb: "Same-day urgent care." },
  {
    key: "consult",
    label: "Consultation",
    blurb: "Discuss options with a dentist.",
  },
  {
    key: "insurance",
    label: "Insurance Help",
    blurb: "We can check your coverage.",
  },
];

const DEFAULT_TZ = "America/New_York";
const DEFAULT_DURATION_MIN = 30;
const SEARCH_WINDOW_DAYS = 14;

/* ===================== utils ===================== */
const emailRe2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizePhone11_2 = (input = "") => {
  const d = String(input).replace(/\D/g, "");
  if (d.length === 10) return "1" + d;
  if (d.length === 11 && d.startsWith("1")) return d;
  return null;
};
const tzLabel = (tz) => {
  if (/Los_Angeles|Pacific/.test(tz)) return "PT";
  if (/Denver|Mountain/.test(tz)) return "MT";
  if (/Chicago|Central/.test(tz)) return "CT";
  if (/New_York|Eastern/.test(tz)) return "ET";
  return tz || "";
};
const fmtTime = (d, tz) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

const isoToDayKey = (iso, tz) => {
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const y = get("year"),
      m = get("month"),
      da = get("day");
    if (!y || !m || !da) return "";
    return `${y}-${m}-${da}`;
  } catch {
    return "";
  }
};
const fmtSlotRange = (startISO, endISO, tz) => {
  try {
    const start = new Date(startISO),
      end = new Date(endISO);
    const startStr = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(start);
    const endStr = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
    }).format(end);
    return `${startStr} – ${endStr} (${tzLabel(tz)})`;
  } catch {
    return "Selected time";
  }
};

const cls2 = {
  chip: "text-sm px-3 py-1.5 rounded-full border border-teal-600 text-teal-700 bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-40 disabled:cursor-not-allowed",
  primaryBtn:
    "rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm py-2 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-teal-500",
  input:
    "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500",
  bubble: (who) =>
    who === "bot"
      ? "px-3 py-2 rounded-xl text-[15px] leading-6 bg-teal-50 border border-teal-200 text-gray-800"
      : "px-3 py-2 rounded-xl text-sm ml-8 text-gray-800",
};

const chipsRow2 = (items) => ({
  who: "bot",
  type: "chips",
  chips: items || [],
});

function humanDateNoWeekday(dayKey, tz) {
  try {
    const [y, m, d] = String(dayKey).split("-").map(Number);
    if (!y || !m || !d) return String(dayKey || "");
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return String(dayKey || "");
  }
}

function timeChipsForDaySafe(daySlots, tz) {
  try {
    if (!Array.isArray(daySlots) || !daySlots.length) return [];
    const localHours = daySlots.map((s) => {
      const d = new Date(s.slot_start);
      return Number(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          hour: "numeric",
          hour12: false,
        }).format(d)
      );
    });
    let startHour = Math.min(...localHours),
      endHour = Math.max(...localHours) + 1;
    if (!isFinite(startHour) || !isFinite(endHour)) {
      startHour = 9;
      endHour = 17;
    }
    const any = new Date(daySlots[0].slot_start);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(any);
    const y = Number(parts.find((p) => p.type === "year")?.value);
    const m = Number(parts.find((p) => p.type === "month")?.value);
    const d = Number(parts.find((p) => p.type === "day")?.value);
    if (!y || !m || !d) return [];
    const midnightLike = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const labelToIndex = new Map();
    daySlots.forEach((s, i) => {
      const lbl = fmtTime(new Date(s.slot_start), tz);
      if (!labelToIndex.has(lbl)) labelToIndex.set(lbl, String(i));
    });
    const chips = [];
    for (let hh = startHour; hh <= endHour; hh++) {
      for (let mm = 0; mm < 60; mm += 15) {
        const label = fmtTime(
          new Date(midnightLike.getTime() + (hh * 60 + mm) * 60 * 1000),
          tz
        );
        if (labelToIndex.has(label))
          chips.push({ label, enabled: true, value: labelToIndex.get(label) });
        else chips.push({ label, enabled: false, value: "" });
      }
    }
    const seen = new Set();
    return chips.filter((c) => {
      if (seen.has(c.label)) return false;
      seen.add(c.label);
      return true;
    });
  } catch (e) {
    console.error("timeChipsForDaySafe error:", e);
    return [];
  }
}

/* ===================== Lead form ===================== */
function LeadFormSched({
  svcKey,
  provider,
  slotText,
  initial,
  onSubmit,
  busy,
  errorText,
}) {
  const [form, setForm] = useState(
    initial || { name: "", email: "", phone: "" }
  );
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (k === "email")
      setErrors((er) => ({
        ...er,
        email: !val || !emailRe2.test(val) ? "Valid email required" : "",
      }));
    if (k === "phone")
      setErrors((er) => ({
        ...er,
        phone: normalizePhone11_2(val) ? "" : "US phone: 10 or 11 digits",
      }));
    if (k === "name")
      setErrors((er) => ({ ...er, name: !val.trim() ? "Name required" : "" }));
  };

  const canSubmit =
    !busy &&
    form.name.trim() &&
    form.email.trim() &&
    emailRe2.test(form.email.trim()) &&
    !!normalizePhone11_2(form.phone);

  return (
    <div className="p-3 rounded-xl border bg-white">
      <div className="text-sm font-medium mb-2">Your details</div>
      {provider && (
        <div className="text-xs mb-2 px-2 py-1 rounded bg-teal-50 border border-teal-200 inline-block text-teal-800">
          Provider: {provider}
        </div>
      )}
      {slotText && (
        <div className="text-xs mb-2 px-2 py-1 rounded bg-teal-50 border border-teal-200 inline-block text-teal-800">
          Preferred time: {slotText}
        </div>
      )}

      <div className="space-y-2">
        <div>
          <input
            className={cls2.input}
            placeholder="Your name"
            value={form.name}
            onChange={set("name")}
            disabled={busy}
          />
          {errors.name && (
            <div className="text-xs text-red-600 mt-1">{errors.name}</div>
          )}
        </div>
        <div>
          <input
            className={cls2.input}
            placeholder="Email (required)"
            value={form.email}
            onChange={set("email")}
            disabled={busy}
          />
          {errors.email && (
            <div className="text-xs text-red-600 mt-1">{errors.email}</div>
          )}
        </div>
        <div>
          <input
            className={cls2.input}
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
      </div>

      {errorText && (
        <div className="mt-2 text-xs rounded-lg border border-red-300 bg-red-50 p-2 text-red-700">
          {errorText}
        </div>
      )}

      <button
        onClick={() => onSubmit(svcKey, form)}
        disabled={!canSubmit}
        className={`mt-3 w-full ${cls2.primaryBtn}`}
        type="button"
      >
        {busy ? "Booking…" : "Confirm booking"}
      </button>
      <p className="text-[11px] text-gray-500 mt-2">
        Times shown in {tzLabel(DEFAULT_TZ)}. Picking a time temporarily holds
        the slot; submitting your details confirms the booking.
      </p>
    </div>
  );
}

/* ===================== Component ===================== */
export default function AIScheduler() {
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [tz] = useState(DEFAULT_TZ);
  const [durationMin] = useState(DEFAULT_DURATION_MIN);
  const [svc, setSvc] = useState(null);
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [slots, setSlots] = useState([]);
  const [byDay, setByDay] = useState({});
  const [dateKey, setDateKey] = useState(null);
  const [selected, setSelected] = useState(null);
  const [holdId, setHoldId] = useState(null);
  const [leadError, setLeadError] = useState("");

  const listRef = useRef(null);
  const push = (row) => setMsgs((m) => [...m, row]);

  const resetFlow = (alsoMsgs = false) => {
    setSvc(null);
    setProviders([]);
    setProvider(null);
    setSlots([]);
    setByDay({});
    setDateKey(null);
    setSelected(null);
    setHoldId(null);
    setLeadError("");
    if (alsoMsgs) setMsgs([]);
  };

  useEffect(() => {
    setMsgs([
      {
        who: "bot",
        text: "Welcome! Let’s schedule an appointment. Choose one of the services below.",
      },
      chipsRow2(
        SERVICES_SCHED.map((s) => ({
          type: "service",
          value: s.key,
          label: s.label,
        }))
      ),
    ]);
    resetFlow();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs]);

  const chooseService = async (serviceKey) => {
    try {
      const svcMeta = SERVICES_SCHED.find((s) => s.key === serviceKey);
      if (!svcMeta) return;

      resetFlow(false);
      setSvc(svcMeta);

      push({ who: "me", text: svcMeta.label });
      push({ who: "bot", text: `Great — ${svcMeta.label}. ${svcMeta.blurb}` });
      push({ who: "bot", text: "Looking up providers…" });

      setBusy(true);
      const { data, error } = await supabase.rpc("list_providers_for_service", {
        p_service: serviceKey,
      });
      if (error) throw error;

      const list = Array.isArray(data) ? data : [];
      setProviders(list);

      if (!list.length) {
        push({ who: "bot", text: "No providers found for this service." });
        push(
          chipsRow2([{ type: "cta", value: "back", label: "Back to services" }])
        );
        return;
      }

      push({ who: "bot", text: "Choose a provider:" });
      push({
        who: "bot",
        type: "chips",
        chips: list.map((p) => ({
          type: "provider",
          value: p.id,
          label: p.display_name,
        })),
      });
      push(
        chipsRow2([{ type: "cta", value: "back", label: "Back to services" }])
      );
    } catch (e) {
      console.error("list_providers_for_service failed:", e);
      push({ who: "bot", text: "Sorry—couldn’t load providers right now." });
      push(
        chipsRow2([{ type: "cta", value: "back", label: "Back to services" }])
      );
    } finally {
      setBusy(false);
    }
  };

  const loadAvailability = async (pObj) => {
    setProvider(pObj);
    setSelected(null);
    setHoldId(null);
    setSlots([]);
    setByDay({});
    setDateKey(null);
    setLeadError("");

    push({ who: "me", text: pObj.display_name });
    push({ who: "bot", text: `Checking ${pObj.display_name}'s availability…` });

    try {
      setBusy(true);
      const { data, error } = await supabase.rpc("get_free_slots_by_provider", {
        p_provider_id: pObj.id,
        p_days: SEARCH_WINDOW_DAYS,
        p_duration_min: durationMin,
        p_tz: tz,
      });
      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      setSlots(rows);

      const grouped = {};
      for (const s of rows) {
        const k = isoToDayKey(s.slot_start, tz);
        if (!k) continue;
        (grouped[k] ||= []).push(s);
      }
      setByDay(grouped);

      if (!rows.length) {
        push({
          who: "bot",
          text: `No openings in the next two weeks for ${pObj.display_name}.`,
        });
        push(
          chipsRow2([{ type: "cta", value: "back", label: "Back to services" }])
        );
        return;
      }

      push({ who: "bot", text: "Pick a date:" });
      push({
        who: "bot",
        type: "chips",
        chips: Object.keys(grouped).map((key) => ({
          type: "date",
          value: key,
          label: humanDateNoWeekday(key, tz),
        })),
      });
      push(
        chipsRow2([{ type: "cta", value: "back", label: "Back to services" }])
      );
    } catch (e) {
      console.error("get_free_slots_by_provider failed:", e);
      push({ who: "bot", text: "Sorry—couldn’t load availability right now." });
    } finally {
      setBusy(false);
    }
  };

  const onPickDate = (dayKey) => {
    try {
      if (!dayKey || !byDay[dayKey] || !Array.isArray(byDay[dayKey])) return;
      setDateKey(dayKey);
      setSelected(null);
      setHoldId(null);
      setLeadError("");

      push({ who: "me", text: humanDateNoWeekday(dayKey, tz) });
      push({
        who: "bot",
        text: `Available times for ${humanDateNoWeekday(dayKey, tz)}:`,
      });
      push({
        who: "bot",
        type: "chips",
        chips: timeChipsForDaySafe(byDay[dayKey], tz).map((t) => ({
          type: "time",
          value: t.value,
          label: t.label,
          disabled: !t.enabled,
        })),
      });
      push(
        chipsRow2([{ type: "cta", value: "back", label: "Back to services" }])
      );
    } catch (e) {
      console.error("onPickDate error:", e);
      push({ who: "bot", text: "Sorry—couldn’t show times for that date." });
    }
  };

  const onPickTime = async (timeValue) => {
    if (!dateKey || !byDay[dateKey]) return;
    const daySlots = byDay[dateKey];
    const slot = daySlots.find((s, idx) => idx.toString() === timeValue);
    if (!slot) return;

    try {
      setBusy(true);
      setLeadError("");

      // Place a hold
      const { data, error } = await supabase.rpc("hold_slot", {
        p_provider_id: provider.id,
        p_start: slot.slot_start,
        p_end: slot.slot_end,
        p_channel: "widget",
      });
      if (error) {
        console.error("hold_slot failed:", error);
        push({
          who: "bot",
          text: "Sorry—this time was just taken. Please pick another slot.",
        });
        await loadAvailability(provider);
        return;
      }

      setHoldId(data);
      setSelected(slot);

      push({
        who: "me",
        text: `Choose: ${fmtSlotRange(slot.slot_start, slot.slot_end, tz)}`,
      });
      push({
        who: "bot",
        text: "Got it. I’ll take your contact details next.",
      });
      showLeadForm();
    } finally {
      setBusy(false);
    }
  };

  const showLeadForm = () => {
    push({
      who: "bot",
      type: "leadform",
      svcKey: svc?.key,
      provider: provider?.display_name || null,
      slotText: selected
        ? fmtSlotRange(selected.slot_start, selected.slot_end, tz)
        : null,
      initial: { name: "", email: "", phone: "" },
      errorText: leadError,
    });
  };

  const friendlyError = (rawMsg = "") => {
    const msg = String(rawMsg).toLowerCase();
    if (msg.includes("hold_expired"))
      return "That hold expired. Please pick the time again.";
    if (msg.includes("hold_not_found"))
      return "That hold couldn’t be found. Please reselect the time.";
    if (msg.includes("hold_already_used"))
      return "That hold was already used. Please pick another time.";
    if (msg.includes("appointments_no_overlap"))
      return "That time just got booked. Please pick another slot.";
    return null; // fallthrough to raw error
  };

  const submitLead = async (svcKey, form) => {
    setLeadError("");
    const email = (form.email || "").trim();
    const phone11 = normalizePhone11_2(form.phone);

    if (!form.name.trim()) return setLeadError("Please enter your name.");
    if (!email || !emailRe2.test(email))
      return setLeadError("Please enter a valid email address.");
    if (!phone11)
      return setLeadError(
        "Please enter a valid US phone: 10 or 11 digits (e.g., 10000000000)."
      );
    if (!selected || !holdId) return setLeadError("Please pick a time first.");

    try {
      setBusy(true);

      // Confirm the booking via RPC
      const svcMeta = SERVICES_SCHED.find((s) => s.key === svcKey);
      const { data, error } = await supabase.rpc("book_from_hold", {
        p_hold_id: holdId,
        p_patient_email: email,
        p_patient_name: form.name.trim(),
        p_patient_phone: phone11,
        p_type: svcMeta?.label || svcKey,
        p_notes: "(submitted via receptionist widget)",
        p_source: "widget",
      });

      if (error) {
        console.error("book_from_hold failed:", error);
        setLeadError(
          friendlyError(error.message) || `Couldn’t book: ${error.message}`
        );
        return;
      }

      // Success: show appointment details
      const appt = data || {};
      push({
        who: "me",
        text: "Request Sent",
      });
      push({
        who: "bot",
        text:
          "✅ Confirmed! " +
          (appt.start_at && appt.end_at
            ? `Your appointment is ${fmtSlotRange(
                appt.start_at,
                appt.end_at,
                tz
              )}.`
            : "Your appointment is booked."),
      });

      // Reset flow
      setSelected(null);
      setHoldId(null);
      push(
        chipsRow2([{ type: "cta", value: "back", label: "Back to services" }])
      );
    } catch (e) {
      console.error("book_from_hold threw:", e);
      setLeadError("Sorry—couldn’t book right now. Please try another time.");
    } finally {
      setBusy(false);
    }
  };

  const handleChip = (chip) => {
    if (busy || !chip) return;
    switch (chip.type) {
      case "service":
        return chooseService(chip.value);
      case "provider": {
        const pObj = providers.find((p) => p.id === chip.value);
        if (pObj) return loadAvailability(pObj);
        return;
      }
      case "date":
        return onPickDate(chip.value);
      case "time":
        if (chip.disabled) return;
        return onPickTime(chip.value);
      case "cta":
        if (chip.value === "back") {
          resetFlow(true);
          setMsgs((m) => [
            ...m,
            { who: "bot", text: "No problem—pick a service below." },
            chipsRow2(
              SERVICES_SCHED.map((s) => ({
                type: "service",
                value: s.key,
                label: s.label,
              }))
            ),
          ]);
        }
        return;
      default:
        return;
    }
  };

  const renderRow = (m, i) => {
    if (m?.type === "chips") {
      const chips = Array.isArray(m.chips) ? m.chips : [];
      return (
        <div key={i} className="flex flex-wrap gap-2">
          {chips.map((c, idx) => (
            <button
              key={idx}
              type="button"
              disabled={!!c.disabled || busy}
              onClick={() => handleChip(c)}
              className={cls2.chip}
              title={c.disabled ? "Unavailable" : undefined}
            >
              {c.label}
            </button>
          ))}
        </div>
      );
    }
    if (m?.type === "leadform") {
      return (
        <LeadFormSched
          key={i}
          svcKey={m.svcKey}
          provider={m.provider}
          slotText={m.slotText}
          initial={m.initial}
          onSubmit={submitLead}
          busy={busy}
          errorText={leadError}
        />
      );
    }
    return (
      <div key={i} className={cls2.bubble(m?.who || "bot")}>
        {m?.text || ""}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <div className="font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-teal-600" /> Receptionist • Schedule
        </div>
      </div>

      <div
        ref={listRef}
        className="px-3 py-3 max-h-[420px] overflow-auto space-y-2"
      >
        {msgs.map(renderRow)}
      </div>

      <div className="px-4 py-2 text-[11px] text-gray-600 border-t">
        {busy ? "Working…" : `Times shown in ${tzLabel(tz)}.`}
      </div>
    </div>
  );
}
