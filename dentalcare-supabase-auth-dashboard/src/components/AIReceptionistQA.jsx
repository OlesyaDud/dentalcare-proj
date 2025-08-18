// src/components/AIReceptionistQA.jsx
import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase (browser) client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Helper: get OpenAI embedding for a query (temporary on client)
async function embedText(text) {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "OpenAI embedding failed");
  return j.data[0].embedding;
}

// chip style for the top tabs (unchanged)
const tabChipBase = "px-3 py-1.5 rounded-full border text-sm";

// darker/smaller chips for Services ONLY
const serviceChip =
  "text-xs px-2.5 py-1 rounded-full border border-teal-700 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50";

export default function AIReceptionistQA() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // running chat transcript
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);

  // quick tabs state
  const [activeTab, setActiveTab] = useState(null);
  const [serviceChips, setServiceChips] = useState([]); // titles from kb_docs (section='services')

  // auto-scroll to newest message
  const tailRef = useRef(null);
  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // load services once
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("kb_docs")
        .select("id,title")
        .eq("section", "services")
        .order("id", { ascending: true })
        .limit(50);
      if (!error && Array.isArray(data)) {
        const chips = data
          .map((r) => (r?.title ? r.title.trim() : ""))
          .filter(Boolean)
          .map((title) => ({
            label: title.replace(/^Service:\s*/i, ""), // prettier chip label
            q: `what is ${title}?`,
          }));
        setServiceChips(chips);
      }
    })();
  }, []);

  // canned questions for tabs
  const tabPresets = {
    Location: ["what is your location?"],
    Hours: ["what are your office hours?"],
    Insurance: ["what insurance do you accept?"],
    Contact: ["how can I contact the office?"],
    // Services handled separately via serviceChips
  };

  async function askQuestion(question) {
    // push user message & clear input box
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");

    try {
      setLoading(true);

      // 1) embed the question
      const embedding = await embedText(question);

      // 2) match similar docs in the KB
      const { data: matches, error } = await supabase.rpc("match_kb", {
        query_embedding: embedding,
        match_count: 5,
      });
      if (error) throw error;

      // 3) build context
      const context = (matches ?? [])
        .map((m) => `Section: ${m.section}\n${m.content}`)
        .join("\n\n");

      // 4) answer with OpenAI (context only)
      const chatRes = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful dental clinic receptionist. Use ONLY the provided context. If you cannot find the answer in context, say you don’t know.",
              },
              ...messages.map(({ role, content }) => ({ role, content })),
              {
                role: "user",
                content: `Question: ${question}\n\nContext:\n${context}`,
              },
            ],
            temperature: 0.2,
          }),
        }
      );
      const chatJson = await chatRes.json();
      if (!chatRes.ok)
        throw new Error(chatJson?.error?.message || "OpenAI chat failed");

      const reply = chatJson.choices?.[0]?.message?.content?.trim() ?? "";
      setMessages((m) => [...m, { role: "assistant", content: reply || "…" }]);
    } catch (err) {
      console.error("QA error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry — I couldn’t fetch an answer just now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAsk(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    askQuestion(q);
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const qs = tabPresets[tab];
    if (qs?.length) askQuestion(qs[0]);
  };

  const handleServiceChip = (q) => askQuestion(q);

  return (
    <div className="flex flex-col h-full">
      {/* Quick tabs (unchanged style) */}
      <div className="flex gap-2 px-4 py-2 border-b bg-white">
        {["Location", "Hours", "Services", "Insurance", "Contact"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabClick(t)}
            className={`${tabChipBase} ${
              activeTab === t
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-teal-600 text-teal-700 hover:bg-teal-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Services title bar + chips (only when Services tab is active) */}
      {activeTab === "Services" && (
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
            <div className="font-medium text-sm text-gray-700">Services</div>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="text-xs text-teal-700 hover:underline"
            >
              ← Back to Chat
            </button>
          </div>

          <div className="flex flex-wrap gap-2 px-4 py-2 border-b bg-white">
            {serviceChips.map((c, i) => (
              <button
                key={i}
                type="button"
                className={serviceChip}
                onClick={() => handleServiceChip(c.q)}
                title={`Ask about ${c.label}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* transcript (unchanged) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-teal-600 text-white px-3 py-2"
                : "mr-auto max-w-[85%] rounded-2xl bg-teal-50 border border-teal-200 text-gray-800 px-3 py-2"
            }
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="mr-auto max-w-[85%] rounded-2xl bg-gray-100 text-gray-500 px-3 py-2 border">
            Thinking…
          </div>
        )}
        <div ref={tailRef} />
      </div>

      {/* composer (unchanged) */}
      <form
        onSubmit={handleAsk}
        className="p-2 border-t bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about hours, services, insurance…"
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
