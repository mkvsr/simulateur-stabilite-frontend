import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";
import Auth from "./Auth";
import SimulateurStabilite from "./SimulateurStabilite";

function App() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return setStatus("auth");
      await checkApproval(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) return setStatus("auth");
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await checkApproval(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkApproval(userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approved")
      .eq("id", userId)
      .single();

    if (profile?.approved) {
      setStatus("approved");
    } else {
      setStatus("auth");
    }
  }

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
