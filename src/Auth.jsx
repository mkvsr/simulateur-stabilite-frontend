import { useState } from "react";
import { supabase } from "./supabase";

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    fontFamily: "sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 12,
    padding: "40px 36px",
    width: 360,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: { textAlign: "center", color: "#1e40af", marginBottom: 6 },
  subtitle: { textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 28 },
  label: { display: "block", marginBottom: 4, fontSize: 13, color: "#374151", fontWeight: 600 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 7,
    border: "1.5px solid #d1d5db",
    fontSize: 15,
    boxSizing: "border-box",
    marginBottom: 16,
    outline: "none",
  },
  btn: {
    width: "100%",
    padding: "11px 0",
    borderRadius: 7,
    border: "none",
    background: "#1e40af",
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 12,
  },
  link: { color: "#2563eb", cursor: "pointer", textDecoration: "underline", background: "none", border: "none", fontSize: 14 },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 12, textAlign: "center" },
  info: { color: "#16a34a", fontSize: 14, textAlign: "center", lineHeight: 1.6 },
  pending: { color: "#d97706", fontSize: 14, textAlign: "center", lineHeight: 1.6 },
};

export default function Auth({ onApproved }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearError = () => setError("");

  async function handleSignup() {
    setLoading(true);
    clearError();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setMode("check-email");
  }

  async function handleLogin() {
    setLoading(true);
    clearError();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);

    const { data: profile } = await supabase
      .from("profiles")
      .select("approved")
      .eq("id", data.user.id)
      .single();

    if (!profile || !profile.approved) {
      setMode("pending");
      return;
    }

    onApproved();
  }

  if (mode === "check-email") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>📧 Vérifiez vos emails</h2>
          <p style={styles.info}>
            Un lien de confirmation a été envoyé à <strong>{email}</strong>.<br /><br />
            Cliquez sur le lien, puis revenez ici pour vous connecter.
          </p>
          <br />
          <button style={styles.btn} onClick={() => setMode("login")}>Retour à la connexion</button>
        </div>
      </div>
    );
  }

  if (mode === "pending") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>⏳ En attente d'approbation</h2>
          <p style={styles.pending}>
            Votre compte est en attente de validation par l'administrateur.<br /><br />
            Vous recevrez un accès dès que votre compte sera approuvé.
          </p>
          <br />
          <button style={{ ...styles.btn, background: "#64748b" }} onClick={async () => {
            await supabase.auth.signOut();
            setMode("login");
            setEmail("");
            setPassword("");
          }}>
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const isSignup = mode === "signup";

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>🚜 Simulateur de Stabilité</h2>
        <p style={styles.subtitle}>{isSignup ? "Créer un compte" : "Connexion"}</p>
        {error && <div style={styles.error}>{error}</div>}
        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          onKeyDown={(e) => e.key === "Enter" && (isSignup ? handleSignup() : handleLogin())}
        />
        <label style={styles.label}>Mot de passe</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          onKeyDown={(e) => e.key === "Enter" && (isSignup ? handleSignup() : handleLogin())}
        />
        <button style={styles.btn} onClick={isSignup ? handleSignup : handleLogin} disabled={loading}>
          {loading ? "Chargement…" : isSignup ? "S'inscrire" : "Se connecter"}
        </button>
        <div style={{ textAlign: "center", fontSize: 14, color: "#64748b" }}>
          {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
          <button style={styles.link} onClick={() => { setMode(isSignup ? "login" : "signup"); clearError(); }}>
            {isSignup ? "Se connecter" : "S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}
