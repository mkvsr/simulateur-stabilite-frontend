import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = "https://simulateur-stabilite-maneko.onrender.com";

const TRACTOR_BRANDS = [
  { key: "Case", color: "#D2232A" },
  { key: "Claas", color: "#8DC63F" },
  { key: "Deutz", color: "#ED7000" },
  { key: "Fendt", color: "#54A000" },
  { key: "John Deere", color: "#367C2B" },
  { key: "Kubota", color: "#F15A22" },
  { key: "Lindner", color: "#E30613" },
  { key: "Massey Ferguson", color: "#CC0000" },
  { key: "New Holland", color: "#0052A5" },
  { key: "Renault", color: "#EFDF00" },
  { key: "Valtra", color: "#B40000" },
];

const MACHINE_BRANDS = [
  { key: "Noremat", color: "#1A5276" },
  { key: "Kuhn", color: "#E74C3C" },
  { key: "Rousseau", color: "#2E86C1" },
  { key: "SMA", color: "#1E8449" },
];

const T = {
  fr: {
    title: "Simulateur de stabilité", sub: "Maneko • v 20",
    tractorBrand: "Marque tracteur", tractorModel: "Modèle tracteur",
    machineBrand: "Machine", machineModel: "Modèle machine",
    options: "Options du tracteur", rearTire: "Pneu arrière",
    frontBallast: "Masse avant", rearBallast: "Masse arrière",
    wheelARG: "Masse roue AR gauche", wheelARD: "Masse roue AR droite",
    frontOffset: "Décalage masse avant (m)", rearOffset: "Décalage masse arrière (m)",
    waterBallast: "Lestage à l'eau", loader: "Chargeur", loaderPos: "Position",
    loaderSerie: "Chargeur de série", disable: "Désactiver", enable: "Activer",
    low: "Basse", high: "Haute",
    results: "Résultats", transport: "Transport", work: "Travail",
    totalMass: "Masse totale", lateral: "L. Latéral", longitudinal: "L. Longitudinal", global: "L. Global",
    fl: "AV G", fr: "AV D", rl: "AR G", rr: "AR D",
    polygon: "Polygone de sustentation", criteria: "Critères de sécurité",
    wheelLoads: "Charges aux roues", mass: "Masse", wheelbase: "Empattement",
    trackFront: "Voie AV", trackRear: "Voie AR", frontPct: "Répart. AV",
    computing: "Calcul...", noResult: "Sélectionnez tracteur + machine",
    noMachineData: "Données à venir",
    environment: "Conditions environnementales",
    slopeLat: "Pente latérale (°)", slopeLong: "Pente longit. (°)",
    speed: "Vitesse (m/s)", accel: "Accélération (m/s²)", turnRadius: "Rayon virage (m)",
  },
  en: {
    title: "Stability Simulator", sub: "Maneko • v 20",
    tractorBrand: "Tractor brand", tractorModel: "Tractor model",
    machineBrand: "Machine", machineModel: "Machine model",
    options: "Tractor options", rearTire: "Rear tire",
    frontBallast: "Front ballast", rearBallast: "Rear ballast",
    wheelARG: "Wheel weight RL", wheelARD: "Wheel weight RR",
    frontOffset: "Front ballast offset (m)", rearOffset: "Rear ballast offset (m)",
    waterBallast: "Water ballast", loader: "Loader", loaderPos: "Position",
    loaderSerie: "Default loader", disable: "Disable", enable: "Enable",
    low: "Low", high: "High",
    results: "Results", transport: "Transport", work: "Work",
    totalMass: "Total mass", lateral: "Lateral", longitudinal: "Longitudinal", global: "Global",
    fl: "FL", fr: "FR", rl: "RL", rr: "RR",
    polygon: "Stability polygon", criteria: "Safety criteria",
    wheelLoads: "Wheel loads", mass: "Mass", wheelbase: "Wheelbase",
    trackFront: "Front track", trackRear: "Rear track", frontPct: "Front dist.",
    computing: "Computing...", noResult: "Select tractor + machine",
    noMachineData: "Data coming soon",
    environment: "Environmental conditions",
    slopeLat: "Lateral slope (°)", slopeLong: "Long. slope (°)",
    speed: "Speed (m/s)", accel: "Acceleration (m/s²)", turnRadius: "Turn radius (m)",
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function indexColor(v, danger, warn) {
  if (v < 0 || v < danger) return "#C0392B";
  if (v < warn) return "#E67E22";
  return "#27AE60";
}

function statusColor(status) {
  if (!status) return { bg: "rgba(0,0,0,0.05)", fg: "#888" };
  if (status.includes("OK")) return { bg: "rgba(39,174,96,0.12)", fg: "#27AE60" };
  if (status.includes("vert") || status.includes("Avert")) return { bg: "rgba(230,126,34,0.12)", fg: "#E67E22" };
  return { bg: "rgba(192,57,43,0.12)", fg: "#C0392B" };
}

function getLoaderCategory(mass) {
  if (!mass) return "—";
  if (mass < 4300) return "FL3817";
  if (mass < 5300) return "FL4121";
  if (mass < 7000) return "FL4220";
  if (mass < 9000) return "FL4621";
  if (mass < 11000) return "FL4722";
  return "FL5033";
}

// ── Glass card ─────────────────────────────────────────────────────────────

function Glass({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "rgba(255,255,255,0.22)",
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      borderRadius: 24,
      border: "1px solid rgba(255,255,255,0.45)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── TractorImage ───────────────────────────────────────────────────────────

function TractorImage({ tractorKey, color, style = {} }) {
  const [src, setSrc] = useState(`/tractors/${tractorKey}.webp`);
  const [failed, setFailed] = useState(false);
  const handleError = () => {
    if (src.endsWith(".webp")) setSrc(`/tractors/${tractorKey}.png`);
    else setFailed(true);
  };
  if (failed) return (
    <svg width="100%" height="160" viewBox="0 0 360 160" fill="none">
      <rect x="90" y="50" width="180" height="80" rx="10" fill={color} opacity=".1"/>
      <rect x="100" y="60" width="100" height="60" rx="8" fill={color} opacity=".2"/>
      <circle cx="76" cy="112" r="38" stroke={color} strokeWidth="6" fill="none"/>
      <circle cx="280" cy="116" r="30" stroke={color} strokeWidth="6" fill="none"/>
    </svg>
  );
  return <img src={src} alt={tractorKey} onError={handleError}
    style={{ height: "100%", width: "auto", objectFit: "contain", display: "block", ...style }}/>;
}

// ── BrandBackground ────────────────────────────────────────────────────────

function BrandBackground({ brandKey, style }) {
  const [src, setSrc] = useState(`/brands/${brandKey}.webp`);
  const handleError = () => {
    if (src.endsWith(".webp")) setSrc(`/brands/${brandKey}.png`);
  };
  return <img src={src} alt={brandKey} onError={handleError}
    style={{ width: "100%", display: "block", ...style }}/>;
}

// ── Gauge ──────────────────────────────────────────────────────────────────

function Gauge({ label, value, danger, warn }) {
  const pct = Math.max(0, Math.min(1, value));
  const color = indexColor(value, danger, warn);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "rgba(0,0,0,0.45)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color }}>{value.toFixed(2)}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.08)" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: color, borderRadius: 2, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }}/>
      </div>
    </div>
  );
}

// ── PolygonView ────────────────────────────────────────────────────────────

function PolygonView({ result, mode, tractorGeom }) {
  if (!result || !tractorGeom) return null;
  const W = 360, H = 200, PAD = 44;
  const L = tractorGeom.wheelbase || 2.6;
  const TF = tractorGeom.track_front || 2.0;
  const TR = tractorGeom.track_rear || 2.0;
  const cgData = result[mode === "transport" ? "transport" : "work"];
  const st = result[`static_${mode}`];
  if (!cgData || !st) return null;
  const { X: XG, Y: YG } = cgData.CG;
  const maxDim = Math.max(L * 1.3, Math.max(TF, TR) * 1.3);
  const scale = Math.min((W - 2 * PAD) / maxDim, (H - 2 * PAD) / maxDim);
  const cx = W / 2, cy = H / 2;
  const tx = x => cx + x * scale;
  const ty = y => cy - y * scale;
  const pts = [[L/2,TF/2],[L/2,-TF/2],[-L/2,-TR/2],[-L/2,TR/2]];
  const svgPts = pts.map(([x,y]) => `${tx(x).toFixed(1)},${ty(y).toFixed(1)}`).join(" ");
  const ist = st.I_static;
  const pc = ist < 0 ? "#C0392B" : ist < 0.4 ? "#C0392B" : ist < 0.5 ? "#E67E22" : "#27AE60";
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <polygon points={svgPts} fill={`${pc}12`} stroke={pc} strokeWidth="1.5" strokeDasharray="6 3"/>
      {pts.map(([x,y],i) => <circle key={i} cx={tx(x)} cy={ty(y)} r={5} fill={pc}/>)}
      <line x1={cx} y1={PAD/2} x2={cx} y2={H-PAD/2} stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4 4"/>
      <line x1={PAD/2} y1={cy} x2={W-PAD/2} y2={cy} stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4 4"/>
      <circle cx={tx(XG)} cy={ty(YG)} r={12} fill={pc} opacity="0.15"/>
      <circle cx={tx(XG)} cy={ty(YG)} r={7} fill={pc}/>
      <circle cx={tx(XG)} cy={ty(YG)} r={3} fill="#fff"/>
      <text x={tx(L/2)+8} y={cy+4} fontSize="10" fill="rgba(0,0,0,0.3)">AV</text>
      <text x={tx(-L/2)-24} y={cy+4} fontSize="10" fill="rgba(0,0,0,0.3)">AR</text>
      <text x={tx(XG)} y={ty(YG)-18} fontSize="9" fill={pc} textAnchor="middle" fontWeight="600">
        ({XG.toFixed(2)}, {YG.toFixed(2)})
      </text>
    </svg>
  );
}

// ── WheelGrid ──────────────────────────────────────────────────────────────

function WheelGrid({ loads, total, t }) {
  const { FL, FR, RL, RR } = loads;
  const wc = v => (v / total) > 0.4 ? "#C0392B" : (v / total) > 0.35 ? "#E67E22" : "#27AE60";
  const Wheel = ({ val, label }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 68, height: 68, borderRadius: 18,
        background: `rgba(${hexToRgb(wc(val))}, 0.1)`,
        border: `2px solid ${wc(val)}40`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: wc(val) }}>{Math.round(val)}</span>
        <span style={{ fontSize: 10, color: "rgba(0,0,0,0.35)" }}>kg</span>
      </div>
      <span style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>{label}</span>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 1fr", gap: 8, alignItems: "center", maxWidth: 280, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Wheel val={FL} label={t.fl}/><Wheel val={RL} label={t.rl}/>
      </div>
      <div style={{ height: 110, border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: 12, background: "rgba(0,0,0,0.02)" }}/>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Wheel val={FR} label={t.fr}/><Wheel val={RR} label={t.rr}/>
      </div>
    </div>
  );
}

// ── SliderField ────────────────────────────────────────────────────────────

function SliderField({ label, value, onChange, min = 0, max, step = 50, unit = "kg", accentColor = "#27AE60" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "rgba(0,0,0,0.5)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor, cursor: "pointer" }}/>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 10, color: "rgba(0,0,0,0.2)" }}>{min}</span>
        <span style={{ fontSize: 10, color: "rgba(0,0,0,0.2)" }}>{max}</span>
      </div>
    </div>
  );
}

// ── ToggleOption ───────────────────────────────────────────────────────────

function ToggleOption({ label, active, onToggle, children, color = "#27AE60" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: active ? 10 : 0 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(0,0,0,0.6)" }}>{label}</span>
        <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
          {[false, true].map(v => (
            <button key={String(v)} onClick={() => onToggle(v)} style={{
              padding: "5px 14px", border: "none", fontSize: 12, cursor: "pointer",
              background: active === v ? (v ? color : "rgba(0,0,0,0.7)") : "rgba(255,255,255,0.5)",
              color: active === v ? "#fff" : "rgba(0,0,0,0.4)",
              fontWeight: active === v ? 600 : 400, transition: "all 0.18s",
            }}>{v ? "Activer" : "Désactiver"}</button>
          ))}
        </div>
      </div>
      {active && <div style={{ paddingTop: 4 }}>{children}</div>}
    </div>
  );
}

// ── StickyBar ──────────────────────────────────────────────────────────────

function StickyBar({ result, mode, t, onModeChange, brandColor }) {
  const st = result ? result[`static_${mode}`] : null;
  const cg = result ? result[mode === "transport" ? "transport" : "work"] : null;
  const rgb = hexToRgb(brandColor || "#333");
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: `rgba(${rgb}, 0.85)`,
      backdropFilter: "blur(30px) saturate(180%)",
      WebkitBackdropFilter: "blur(30px) saturate(180%)",
      borderTop: "1px solid rgba(255,255,255,0.2)",
      padding: "10px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.25)", flexShrink: 0 }}>
        {["transport", "work"].map(m => (
          <button key={m} onClick={() => onModeChange(m)} style={{
            padding: "6px 16px", border: "none", fontSize: 12, cursor: "pointer",
            background: mode === m ? "rgba(255,255,255,0.3)" : "transparent",
            color: "#fff", fontWeight: mode === m ? 700 : 400, transition: "all 0.18s",
          }}>
            {m === "transport" ? t.transport : t.work}
          </button>
        ))}
      </div>

      {cg && (
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1 }}>{t.totalMass} </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{Math.round(cg.mass_total).toLocaleString()} kg</span>
        </div>
      )}

      {st && (
        <div style={{ display: "flex", gap: 20, flex: 1, flexWrap: "wrap" }}>
          {[[t.lateral, st.I_lat, 0.4, 0.5],[t.longitudinal, st.I_long, 0.5, 0.6],[t.global, st.I_static, 0.4, 0.5]].map(([lbl, val, d, w]) => {
            const col = indexColor(val, d, w);
            return (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}` }}/>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 }}>{lbl}</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{val.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}

      {!result && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flex: 1 }}>{t.noResult}</span>}

      {result && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {result.compatibility.map((c, i) => {
            const ok = c.status.includes("OK");
            const warn = c.status.includes("vert") || c.status.includes("Avert");
            return <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ok ? "#27AE60" : warn ? "#E67E22" : "#C0392B" }}/>;
          })}
        </div>
      )}
    </div>
  );
}

// ── Dots ───────────────────────────────────────────────────────────────────

function Dots({ total, current, onSelect, color }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} onClick={() => onSelect(i)} style={{
          height: 6, borderRadius: 3, cursor: "pointer",
          width: i === current ? 20 : 6,
          background: i === current ? color : "rgba(0,0,0,0.15)",
          transition: "all 0.2s",
        }}/>
      ))}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

export default function SimulateurStabilite() {
  const [lang, setLang] = useState("fr");
  const t = T[lang];
  const [allTractors, setAllTractors] = useState([]);
  const [allMachines, setAllMachines] = useState([]);
  const [allTires, setAllTires] = useState([]);
  const [tractorBrand, setTractorBrand] = useState(null);
  const [tractorList, setTractorList] = useState([]);
  const [tractorIdx, setTractorIdx] = useState(0);
  const [machineBrand, setMachineBrand] = useState("Noremat");
  const [machineList, setMachineList] = useState([]);
  const [machineIdx, setMachineIdx] = useState(0);
  const [mode, setMode] = useState("work");
  const [result, setResult] = useState(null);
  const [computing, setComputing] = useState(false);
  const debounceRef = useRef(null);
  const [options, setOptions] = useState({
    rear_tire: "", loader_enabled: false, loader_mode: "low",
    water_ballast: false, wheel_weight_ARG: 0, wheel_weight_ARD: 0,
    front_ballast_mass: 0, front_ballast_offset: 0.5,
    rear_ballast_mass: 0, rear_ballast_offset: 0.3,
    custom_tire: false,
  });
  const [env, setEnv] = useState({ slope_lat: 0, slope_long: 0, speed: 0, turn_radius: 0, accel_long: 0 });

  useEffect(() => {
    fetch(`${API_URL}/tractors`).then(r => r.json()).then(setAllTractors).catch(() => {});
    fetch(`${API_URL}/machines`).then(r => r.json()).then(setAllMachines).catch(() => {});
    fetch(`${API_URL}/tires`).then(r => r.json()).then(setAllTires).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tractorBrand) return;
    const list = allTractors.filter(tr => tr.brand === tractorBrand);
    setTractorList(list);
    setTractorIdx(0);
    if (list[0]) setOptions(o => ({ ...o, rear_tire: list[0].tire_defaults?.rear || "" }));
  }, [tractorBrand, allTractors]);

  useEffect(() => {
    const tr = tractorList[tractorIdx];
    if (tr) setOptions(o => ({ ...o, rear_tire: tr.tire_defaults?.rear || o.rear_tire }));
  }, [tractorIdx, tractorList]);

  useEffect(() => {
    setMachineList(machineBrand === "Noremat" ? allMachines : []);
    setMachineIdx(0);
  }, [machineBrand, allMachines]);

  const triggerSimulate = useCallback(() => {
    const tractor = tractorList[tractorIdx];
    const machine = machineList[machineIdx];
    if (!tractor || !machine) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setComputing(true);
      try {
        const res = await fetch(`${API_URL}/simulate`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tractor_name: tractor.key, machine_name: machine.key, options, environment: env }),
        });
        if (res.ok) setResult(await res.json());
      } catch {}
      setComputing(false);
    }, 400);
  }, [tractorList, tractorIdx, machineList, machineIdx, options, env]);

  useEffect(() => { triggerSimulate(); }, [triggerSimulate]);

  const goTractorPrev = () => setTractorIdx(i => Math.max(0, i - 1));
  const goTractorNext = () => setTractorIdx(i => Math.min(tractorList.length - 1, i + 1));
  const goMachinePrev = () => setMachineIdx(i => Math.max(0, i - 1));
  const goMachineNext = () => setMachineIdx(i => Math.min(machineList.length - 1, i + 1));

  const activeTractor = tractorList[tractorIdx];
  const activeMachine = machineList[machineIdx];
  const tractorColor = TRACTOR_BRANDS.find(b => b.key === tractorBrand)?.color || "#27AE60";
  const machineColor = MACHINE_BRANDS.find(b => b.key === machineBrand)?.color || "#1A5276";
  const tractorRgb = hexToRgb(tractorColor);
  const machineRgb = hexToRgb(machineColor);

  const ArrowBtn = ({ onClick, disabled, dir }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: 40, height: 40, borderRadius: "50%", border: "none",
      background: disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
      backdropFilter: "blur(10px)", cursor: disabled ? "not-allowed" : "pointer",
      fontSize: 20, color: disabled ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: disabled ? "none" : "0 2px 12px rgba(0,0,0,0.12)",
      flexShrink: 0, transition: "all 0.18s",
    }}>{dir === "prev" ? "‹" : "›"}</button>
  );

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      minHeight: "100vh",
      background: tractorBrand
        ? `radial-gradient(ellipse at 30% 20%, rgba(${tractorRgb}, 0.35) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(${tractorRgb}, 0.2) 0%, transparent 60%), #f0f0f0`
        : "#f0f0f0",
      transition: "background 0.6s ease",
      paddingBottom: 80,
    }}>

      {/* HEADER */}
      <div style={{ padding: "20px 28px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "rgba(0,0,0,0.85)", margin: 0, letterSpacing: -0.5 }}>{t.title}</h1>
          <p style={{ fontSize: 12, color: "rgba(0,0,0,0.35)", margin: 0, marginTop: 2 }}>{t.sub}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {computing && <span style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", fontStyle: "italic" }}>{t.computing}</span>}
          <button onClick={() => setLang(l => l === "fr" ? "en" : "fr")} style={{
            padding: "6px 16px", borderRadius: 20,
            background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.5)", color: "rgba(0,0,0,0.6)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{lang === "fr" ? "EN" : "FR"}</button>
        </div>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* LAYOUT PRINCIPAL : tracteur gauche, machine droite en large / empilé en étroit */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: 16 }}>

          {/* ── COLONNE TRACTEUR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Bandeau marques tracteur */}
            <Glass style={{ padding: "6px 8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(clamp(50px, 7vw, 110px), 1fr))` }}>
                {TRACTOR_BRANDS.map(({ key, color }) => {
                  const active = tractorBrand === key;
                  return (
                    <button key={key} onClick={() => setTractorBrand(key)} style={{
                      padding: "8px 4px", border: "none", cursor: "pointer",
                      background: active ? color : "transparent",
                      borderRadius: 14, transition: "all 0.2s",
                      color: active ? "#fff" : "rgba(0,0,0,0.45)",
                      fontSize: "clamp(8px, 0.9vw, 11px)", fontWeight: active ? 700 : 500,
                      letterSpacing: 0.3, textAlign: "center",
                    }}>{key.toUpperCase()}</button>
                  );
                })}
              </div>
            </Glass>

            {/* Propriétés + Visualisation côte à côte */}
            {tractorBrand && tractorList.length > 0 && activeTractor && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                {/* Widget propriétés tracteur */}
                <Glass style={{ padding: "18px 20px", aspectRatio: "1 / 1", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ marginBottom: 12, borderBottom: `2px solid ${tractorColor}`, paddingBottom: 8 }}>
                      <div style={{ fontSize: 10, color: tractorColor, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>{activeTractor.brand}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(0,0,0,0.85)", lineHeight: 1.2, marginTop: 2 }}>{activeTractor.model}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        ["Masse à vide", `${activeTractor.mass?.toLocaleString()} kg`],
                        ["Répartition", `${activeTractor.mass_front_pct}% AV / ${activeTractor.mass_rear_pct}% AR`],
                        ["PTAC", activeTractor.ptac ? `${activeTractor.ptac?.toLocaleString()} kg` : "—"],
                        ["Empattement", `${activeTractor.wheelbase?.toFixed(3)} m`],
                        ["Voie AR", `${activeTractor.track_rear?.toFixed(2)} m`],
                        ["Pneu AV", activeTractor.tire_defaults?.front || "—"],
                        ["Pneu AR", activeTractor.tire_defaults?.rear || "—"],
                        ["Vitesse max", activeTractor.dynamics?.max_speed_kmh ? `${activeTractor.dynamics.max_speed_kmh} km/h` : "—"],
                      ].map(([lbl, val]) => (
                        <div key={lbl} style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>{lbl}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.75)", textAlign: "right" }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Glass>

                {/* Widget visualisation tracteur */}
                <Glass style={{ padding: "16px", aspectRatio: "1 / 1", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }}>
                      <ArrowBtn onClick={goTractorPrev} disabled={tractorIdx === 0} dir="prev"/>
                    </div>
                    <div key={activeTractor?.key} style={{ width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TractorImage tractorKey={activeTractor.key} color={tractorColor} style={{ height: "100%", width: "auto", objectFit: "contain" }}/>
                    </div>
                    <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>
                      <ArrowBtn onClick={goTractorNext} disabled={tractorIdx === tractorList.length - 1} dir="next"/>
                    </div>
                  </div>
                  <Dots total={tractorList.length} current={tractorIdx} onSelect={setTractorIdx} color={tractorColor}/>
                </Glass>
              </div>
            )}

            {tractorBrand && tractorList.length === 0 && (
              <Glass style={{ padding: "30px", textAlign: "center", color: "rgba(0,0,0,0.3)", fontSize: 13, fontStyle: "italic" }}>
                Données à venir — {tractorBrand}
              </Glass>
            )}
          </div>

          {/* ── COLONNE MACHINE ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Bandeau marques machine */}
            <Glass style={{ padding: "6px 8px" }}>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                {MACHINE_BRANDS.map(({ key, color }) => {
                  const active = machineBrand === key;
                  return (
                    <button key={key} onClick={() => setMachineBrand(key)} style={{
                      flex: 1, padding: "8px 4px", border: "none", cursor: "pointer",
                      background: active ? color : "transparent",
                      borderRadius: 14, transition: "all 0.2s",
                      color: active ? "#fff" : "rgba(0,0,0,0.45)",
                      fontSize: "clamp(8px, 1vw, 12px)", fontWeight: active ? 700 : 500,
                      letterSpacing: 0.3, textAlign: "center",
                    }}>{key.toUpperCase()}</button>
                  );
                })}
              </div>
            </Glass>

            {/* Propriétés + Visualisation machine côte à côte */}
            {machineList.length > 0 && activeMachine ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                {/* Widget propriétés machine */}
                <Glass style={{ padding: "18px 20px", aspectRatio: "1 / 1", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ marginBottom: 12, borderBottom: `2px solid ${machineColor}`, paddingBottom: 8 }}>
                      <div style={{ fontSize: 10, color: machineColor, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>{machineBrand}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(0,0,0,0.85)", lineHeight: 1.2, marginTop: 2 }}>{activeMachine.model}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>Masse</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.75)" }}>{activeMachine.mass?.toLocaleString()} kg</span>
                    </div>
                  </div>
                </Glass>

                {/* Widget visualisation machine */}
                <Glass style={{ padding: "16px", aspectRatio: "1 / 1", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }}>
                      <ArrowBtn onClick={goMachinePrev} disabled={machineIdx === 0} dir="prev"/>
                    </div>
                    <div key={activeMachine?.key} style={{ textAlign: "center", padding: "0 50px" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(0,0,0,0.8)", marginBottom: 6 }}>{activeMachine.model}</div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.35)" }}>
                        MASSE <span style={{ fontWeight: 700, color: "rgba(0,0,0,0.6)" }}>{activeMachine.mass?.toLocaleString()} kg</span>
                      </div>
                    </div>
                    <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>
                      <ArrowBtn onClick={goMachineNext} disabled={machineIdx === machineList.length - 1} dir="next"/>
                    </div>
                  </div>
                  <Dots total={machineList.length} current={machineIdx} onSelect={setMachineIdx} color={machineColor}/>
                </Glass>
              </div>
            ) : (
              <Glass style={{ padding: "30px", textAlign: "center", color: "rgba(0,0,0,0.3)", fontSize: 13, fontStyle: "italic" }}>
                Données à venir — {machineBrand}
              </Glass>
            )}
          </div>
        </div>


        {/* OPTIONS */}
        <Glass style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>{t.options}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginBottom: 16 }}>
            <div>
              <SliderField label={t.frontBallast} value={options.front_ballast_mass} max={2000} accentColor={tractorColor} onChange={v => setOptions(o => ({ ...o, front_ballast_mass: v }))}/>
              <SliderField label={t.frontOffset} value={options.front_ballast_offset} min={0.1} max={2} step={0.05} unit="m" accentColor={tractorColor} onChange={v => setOptions(o => ({ ...o, front_ballast_offset: v }))}/>
              <SliderField label={t.rearBallast} value={options.rear_ballast_mass} max={2000} accentColor={tractorColor} onChange={v => setOptions(o => ({ ...o, rear_ballast_mass: v }))}/>
              <SliderField label={t.rearOffset} value={options.rear_ballast_offset} min={0.1} max={2} step={0.05} unit="m" accentColor={tractorColor} onChange={v => setOptions(o => ({ ...o, rear_ballast_offset: v }))}/>
            </div>
            <div>
              <SliderField label={t.wheelARG} value={options.wheel_weight_ARG} max={800} step={25} accentColor={tractorColor} onChange={v => setOptions(o => ({ ...o, wheel_weight_ARG: v }))}/>
              <SliderField label={t.wheelARD} value={options.wheel_weight_ARD} max={800} step={25} accentColor={tractorColor} onChange={v => setOptions(o => ({ ...o, wheel_weight_ARD: v }))}/>
            </div>
          </div>

          <ToggleOption label={t.rearTire} active={options.custom_tire} color={tractorColor}
            onToggle={v => setOptions(o => ({ ...o, custom_tire: v, rear_tire: v ? o.rear_tire : (tractorList[tractorIdx]?.tire_defaults?.rear || "") }))}>
            <select value={options.rear_tire} onChange={e => setOptions(o => ({ ...o, rear_tire: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", fontSize: 13, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)" }}>
              <option value="">—</option>
              {allTires.map(ti => <option key={ti.reference} value={ti.reference}>{ti.reference} (⌀ {ti.diameter_mm} mm)</option>)}
            </select>
          </ToggleOption>

          <ToggleOption label={t.waterBallast} active={options.water_ballast} color={tractorColor}
            onToggle={v => setOptions(o => ({ ...o, water_ballast: v }))}>
            <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.04)", borderRadius: 12, fontSize: 12, color: "rgba(0,0,0,0.5)" }}>
              Remplissage 75% volume pneus AR — eau/antigel (0.755 kg/L)
            </div>
          </ToggleOption>

          <ToggleOption label={t.loader} active={options.loader_enabled} color={tractorColor}
            onToggle={v => setOptions(o => ({ ...o, loader_enabled: v }))}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>{t.loaderSerie} : </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>{getLoaderCategory(activeTractor?.mass)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "rgba(0,0,0,0.5)" }}>{t.loaderPos}</span>
              <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
                {[["low", t.low], ["high", t.high]].map(([v, lbl]) => (
                  <button key={v} onClick={() => setOptions(o => ({ ...o, loader_mode: v }))} style={{
                    padding: "5px 14px", border: "none", fontSize: 12, cursor: "pointer",
                    background: options.loader_mode === v ? tractorColor : "rgba(255,255,255,0.5)",
                    color: options.loader_mode === v ? "#fff" : "rgba(0,0,0,0.4)",
                    transition: "all 0.18s",
                  }}>{lbl}</button>
                ))}
              </div>
            </div>
          </ToggleOption>
        </Glass>

        {/* ENVIRONNEMENT */}
        <Glass style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>{t.environment}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
            <div>
              <SliderField label={t.slopeLat} value={env.slope_lat} min={-30} max={30} step={0.5} unit="°" accentColor={tractorColor} onChange={v => setEnv(e => ({ ...e, slope_lat: v }))}/>
              <SliderField label={t.slopeLong} value={env.slope_long} min={-30} max={30} step={0.5} unit="°" accentColor={tractorColor} onChange={v => setEnv(e => ({ ...e, slope_long: v }))}/>
            </div>
            <div>
              <SliderField label={`${t.speed} (${(env.speed * 3.6).toFixed(1)} km/h)`} value={env.speed} min={0} max={11.1} step={0.1} unit="m/s" accentColor={tractorColor} onChange={v => setEnv(e => ({ ...e, speed: v }))}/>
              <SliderField label={t.accel} value={env.accel_long} min={0} max={10} step={0.1} unit="m/s²" accentColor={tractorColor} onChange={v => setEnv(e => ({ ...e, accel_long: v }))}/>
              <SliderField label={t.turnRadius} value={env.turn_radius} min={0} max={50} step={0.5} unit="m" accentColor={tractorColor} onChange={v => setEnv(e => ({ ...e, turn_radius: v }))}/>
            </div>
          </div>
        </Glass>

        {/* RÉSULTATS */}
        {result && (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: 1.5, padding: "0 4px" }}>{t.results}</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {["transport", "work"].map(m => {
                const st = result[`static_${m}`];
                const loads = result[m === "transport" ? "wheels_transport" : "wheels_work"];
                const cg = result[m === "transport" ? "transport" : "work"];
                return (
                  <div key={m} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Titre */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.6)", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>
                      {m === "transport" ? t.transport : t.work} — {Math.round(cg?.mass_total || 0).toLocaleString()} kg
                    </div>

                    {/* Polygone */}
                    <Glass style={{ padding: "16px" }}>
                      <div style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{t.polygon}</div>
                      <PolygonView result={result} mode={m} tractorGeom={activeTractor}/>
                    </Glass>

                    {/* Jauges */}
                    {st && (
                      <Glass style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                        <Gauge label={t.lateral} value={st.I_lat} danger={0.4} warn={0.5}/>
                        <Gauge label={t.longitudinal} value={st.I_long} danger={0.5} warn={0.6}/>
                        <Gauge label={t.global} value={st.I_static} danger={0.4} warn={0.5}/>
                      </Glass>
                    )}

                    {/* Roues */}
                    <Glass style={{ padding: "16px" }}>
                      <div style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>{t.wheelLoads}</div>
                      <WheelGrid loads={loads} total={cg?.mass_total || 1} t={t}/>
                    </Glass>
                  </div>
                );
              })}
            </div>

            {/* Critères pleine largeur */}
            <Glass style={{ padding: "20px 22px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>{t.criteria}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                {result.compatibility.map((c, i) => {
                  const { bg, fg } = statusColor(c.status);
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <span style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>{c.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color: fg }}>
                        {c.status.includes("OK") ? "✓ OK" : c.status.includes("vert") || c.status.includes("Avert") ? "⚠" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Glass>
          </>
        )}

        <StickyBar result={result} mode={mode} t={t} onModeChange={setMode} brandColor={tractorBrand ? tractorColor : "#333333"}/>
      </div>
    </div>
  );
}
