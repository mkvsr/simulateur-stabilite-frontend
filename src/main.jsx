import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";
import Auth from "./Auth";
import SimulateurStabilite from "./SimulateurStabilite";

function PendingApproval() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: 12, padding: "40px 36px", width: 360, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <h2 style={{ color: "#1e40af" }}>⏳ En attente d'approbation</h2>
        <p style={{ color: "#d97706", lineHeight: 1.6 }}>
          Votre compte est en attente de validation par l'administrateur.<br /><br />
          Vous recevrez un accès dès que votre compte sera approuvé.
        </p>
        <br />
        <button
          style={{ width: "100%", padding: "11px 0", borderRadius: 7, border: "none", background: "#64748b", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          onClick={() => supabase.auth.signOut()}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function App() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setStatus("auth");
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("approved")
          .eq("id", session.user.id)
          .single();
        setStatus(profile?.approved ? "approved" : "pending");
      }
    });
    return () => subscription.unsubscribe();
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
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
