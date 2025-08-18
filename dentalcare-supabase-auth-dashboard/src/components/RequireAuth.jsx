import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) setReady(true);
      else
        navigate(
          "/login?next=" + encodeURIComponent(window.location.pathname),
          { replace: true }
        );
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session)
        navigate(
          "/login?next=" + encodeURIComponent(window.location.pathname),
          { replace: true }
        );
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready) return null;
  return children;
}
