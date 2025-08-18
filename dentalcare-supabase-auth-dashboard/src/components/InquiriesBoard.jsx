// src/components/InquiriesBoard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const statusOptions = ["open", "pending", "closed"];

function fmtWhen(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso || "";
  }
}

export default function InquiriesBoard() {
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("open"); // default view
  const [loading, setLoading] = useState(false);

  const visible = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      console.error("load inquiries failed:", error);
      return;
    }
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (row, next) => {
    if (next === row.status) return;
    // optimistic UI
    setRows((old) =>
      old.map((r) =>
        r.id === row.id ? { ...r, status: next, _saving: true } : r
      )
    );
    const { error } = await supabase.rpc("set_inquiry_status", {
      p_id: row.id,
      p_status: next,
    });
    if (error) {
      console.error("set_inquiry_status failed:", error);
      // revert on error
      setRows((old) =>
        old.map((r) =>
          r.id === row.id ? { ...r, status: row.status, _saving: false } : r
        )
      );
      alert("Could not change status. Check console for details.");
      return;
    }
    // clear saving flag
    setRows((old) =>
      old.map((r) => (r.id === row.id ? { ...r, _saving: false } : r))
    );
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-lg font-semibold">Open Inquiries</h2>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          className="ml-auto rounded bg-teal-600 px-3 py-1.5 text-sm text-white hover:bg-teal-700"
          type="button"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="text-sm text-gray-600">No inquiries.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((row) => (
            <InquiryCard key={row.id} row={row} onChangeStatus={setStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function InquiryCard({ row, onChangeStatus }) {
  const saving = !!row._saving;

  // Pretty body from message
  const lines = String(row.message || "").split("\n");
  const body = lines.map((l, i) => (
    <div key={i} className="text-sm text-gray-800">
      {l}
    </div>
  ));

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1 flex items-center gap-2">
        <div className="font-medium">Service request: {row.subject}</div>
        <StatusPill
          value={row.status}
          onChange={(v) => onChangeStatus(row, v)}
          disabled={saving}
        />
      </div>
      <div className="space-y-0.5">{body}</div>
      <div className="mt-2 text-xs text-gray-500">
        {fmtWhen(row.created_at)}
      </div>
    </div>
  );
}

function StatusPill({ value, onChange, disabled }) {
  return (
    <select
      className={`rounded-full border px-2 py-0.5 text-xs ${
        value === "open"
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : value === "pending"
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-gray-300 bg-gray-50 text-gray-700"
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      title="Change status"
    >
      {statusOptions.map((s) => (
        <option key={s} value={s}>
          {s[0].toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}
