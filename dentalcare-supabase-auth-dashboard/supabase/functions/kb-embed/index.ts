// @deno-types="https://deno.land/std@0.223.0/types.d.ts"
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* ---- env helpers: support either your custom names or the defaults ---- */
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const SUPABASE_URL =
  Deno.env.get("DENTALCARE_PROJECT_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";

/* ---- supabase client ---- */
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* ---- helper ---- */
async function embed(text: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  const j = await r.json();
  if (!r.ok) {
    console.error("OpenAI error:", j);
    throw new Error("OpenAI embeddings API failed");
  }
  return j.data[0].embedding;
}

serve(async (req) => {
  const hdrs = { "Content-Type": "application/json" };

  // Health check GET (handy for quick sanity checks)
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        ok: true,
        message: "kb-embed is up",
        haveEnv: {
          OPENAI_API_KEY: !!OPENAI_API_KEY,
          SUPABASE_URL: !!SUPABASE_URL,
          SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
        },
      }),
      { headers: hdrs }
    );
  }

  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const detail = {
      error: "Missing required env vars",
      haveEnv: {
        OPENAI_API_KEY: !!OPENAI_API_KEY,
        SUPABASE_URL: !!SUPABASE_URL,
        SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
      },
    };
    console.error(detail);
    return new Response(JSON.stringify(detail), { status: 500, headers: hdrs });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const limit = typeof body?.limit === "number" ? body.limit : 200;

    console.log("kb-embed invoked", { limit });

    // Fetch rows that need embeddings
    const { data: rows, error } = await sb
      .from("kb_docs")
      .select("id,title,content")
      .is("embedding", null)
      .limit(limit);

    if (error) {
      console.error("Supabase select error:", error);
      throw error;
    }

    // ✅ Skip any rows that are missing title/content (prevents NOT NULL violations)
    const docs =
      (rows ?? []).filter(
        (r) =>
          (r.title ?? "").toString().trim() &&
          (r.content ?? "").toString().trim()
      ) || [];

    if (!docs.length) {
      return new Response(
        JSON.stringify({
          updated: 0,
          message: "nothing to do (or all invalid/empty)",
        }),
        { headers: hdrs }
      );
    }

    const BATCH = 8;
    let updated = 0;

    for (let i = 0; i < docs.length; i += BATCH) {
      const chunk = docs.slice(i, i + BATCH);

      const embs = await Promise.all(
        chunk.map((r) => embed(`${r.title}\n\n${r.content}`))
      );

      await Promise.all(
        chunk.map(async (r, idx) => {
          const { error: upErr } = await sb
            .from("kb_docs")
            .update({ embedding: embs[idx] as unknown as number[] })
            .eq("id", r.id); // <= UPDATE by primary key
          if (upErr) throw upErr;
        })
      );
      updated += chunk.length;
    }

    return new Response(JSON.stringify({ updated }), { headers: hdrs });
  } catch (e) {
    console.error("kb-embed fatal:", e);
    // Return a *readable* error payload instead of “[object Object]”
    const payload = {
      error: String(e?.message || e),
      stack: e?.stack || null,
    };
    return new Response(JSON.stringify(payload), {
      status: 500,
      headers: hdrs,
    });
  }
});
