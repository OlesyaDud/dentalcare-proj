import React, { useState } from "react";
import { Bot, X, Send, CalendarClock, MessageSquareText } from "lucide-react";
import AIScheduler from "./AIReceptionistScheduleAppointment";
import AIInquiry from "./AIReceptionistInInquiry";
import AIReceptionistQA from "./AIReceptionistQA";

const actionBtn = (active = false) =>
  `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition shadow-sm
   ${
     active
       ? "border-teal-600 bg-teal-50 text-teal-700"
       : "border-gray-200 bg-white hover:bg-gray-50"
   }`;

export default function AIReceptionist() {
  // modes: home | inquiry | schedule | qa
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("home");

  const openWidget = () => {
    setOpen(true);
    setMode("home");
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={openWidget}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 shadow-lg flex items-center gap-2"
      >
        <Bot className="h-5 w-5" /> AI Receptionist
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[92vw] rounded-2xl bg-white shadow-2xl border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
            <div className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-teal-600" />
              {mode === "home" && "Receptionist"}
              {mode === "inquiry" && "Receptionist • Submit inquiry"}
              {mode === "schedule" && "Receptionist • Schedule appointment"}
              {mode === "qa" && "Receptionist • Ask a question"}
            </div>

            <div className="flex items-center gap-2">
              {mode !== "home" && (
                <button
                  type="button"
                  onClick={() => setMode("home")}
                  className="rounded px-2 py-1 text-xs border hover:bg-teal-600"
                  title="Back to home"
                >
                  Home
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          {mode === "home" && (
            <div className="p-4">
              <div className="mb-4 rounded-xl bg-gray-50 border border-gray-200 p-3">
                <div className="text-sm leading-relaxed">
                  <span className="font-semibold">Welcome!</span> I can help you{" "}
                  <span className="font-semibold">
                    respond to online inquiries
                  </span>
                  , <span className="font-semibold">schedule appointments</span>
                  , and{" "}
                  <span className="font-semibold">
                    manage front desk requests
                  </span>
                  .
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className={actionBtn(false)}
                  onClick={() => setMode("inquiry")}
                  title="Submit an inquiry"
                >
                  <Send className="h-4 w-4" /> Submit inquiry
                </button>

                <button
                  className={actionBtn(false)}
                  onClick={() => setMode("schedule")}
                  title="Schedule an appointment"
                >
                  <CalendarClock className="h-4 w-4" /> Schedule appointment
                </button>

                <button
                  className={actionBtn(false)}
                  onClick={() => setMode("qa")}
                  title="Ask a question"
                >
                  <MessageSquareText className="h-4 w-4" /> Ask a question
                </button>
              </div>

              <p className="text-[11px] text-gray-500 mt-3">
                Secure • Staff will be notified promptly
              </p>
            </div>
          )}

          {mode === "inquiry" && (
            <div className="max-h-[520px] h-[520px] flex flex-col">
              <AIInquiry onReturnHome={() => setMode("home")} />
            </div>
          )}

          {mode === "schedule" && (
            <div className="max-h-[520px] h-[520px] flex flex-col">
              <AIScheduler />
            </div>
          )}

          {mode === "qa" && (
            <div className="max-h-[520px] h-[520px] flex flex-col">
              <AIReceptionistQA />
            </div>
          )}
        </div>
      )}
    </>
  );
}
