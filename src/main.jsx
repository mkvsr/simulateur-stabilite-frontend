import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";
import Auth from "./Auth";
import SimulateurStabilite from "./SimulateurStabilite";

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
        setStatus(profile?.approved ? "approved" : "auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ fontFamily: "sans-serif", color: "#64748b" }}>Chargement…</p>
      </div>
    );
  }

  if (status === "auth") {
    return <Auth onApproved={() => setStatus("approved")} />;
  }

  return <SimulateurStabilite />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
