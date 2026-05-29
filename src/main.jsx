import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";
import Auth from "./Auth";
import SimulateurStabilite from "./SimulateurStabilite";
import LiquidGlassDemo from "./LiquidGlassDemo";

// Bypass auth for component demo: add ?demo to the URL
if (new URLSearchParams(location.search).has('demo')) {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode><LiquidGlassDemo /></React.StrictMode>
  );
  throw new Error('demo mode — halts normal boot');
}

function PendingApproval() {
  async function check() {
    const { data } = await supabase.auth.refreshSession();
    if (data?.session?.user?.app_metadata?.approved) window.location.reload();
    else alert("Pas encore approuvé — réessayez plus tard.");
  }
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: 12, padding: "40px 36px", width: 360, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <h2 style={{ color: "#1e40af" }}>⏳ En attente d'approbation</h2>
        <p style={{ color: "#d97706", lineHeight: 1.6 }}>
          Votre compte est en attente de validation.<br /><br />
          Une fois approuvé, cliquez sur le bouton ci-dessous.
        </p>
        <br />
        <button onClick={check} style={{ width: "100%", padding: "11px 0", borderRadius: 7, border: "none", background: "#1e40af", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
          Vérifier mon accès
        </button>
        <button onClick={() => supabase.auth.signOut()} style={{ width: "100%", padding: "11px 0", borderRadius: 7, border: "none", background: "#64748b", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function App() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let mounted = true;

    function fromSession(session) {
      return session?.user?.app_metadata?.approved === true ? "approved" : "pending";
    }

    async function initAuth() {
      try {
        const { data } = await supabase.auth.refreshSession();
        if (!mounted) return;
        if (!data?.session) {
          const { data: d2 } = await supabase.auth.getSession();
          setStatus(d2?.session ? fromSession(d2.session) : "auth");
          return;
        }
        setStatus(fromSession(data.session));
      } catch {
        if (mounted) setStatus("auth");
      }
    }

    const fallback = setTimeout(() => { if (mounted) setStatus("auth"); }, 8000);
    initAuth().finally(() => clearTimeout(fallback));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session) { setStatus("auth"); return; }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setStatus(fromSession(session));
      }
    });

    return () => { mounted = false; clearTimeout(fallback); subscription.unsubscribe(); };
  }, []);

  if (status === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ fontFamily: "sans-serif", color: "#64748b" }}>Chargement…</p>
    </div>
  );
  if (status === "auth") return <Auth />;
  if (status === "pending") return <PendingApproval />;
  return <SimulateurStabilite />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
