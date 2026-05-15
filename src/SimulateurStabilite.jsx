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
    title: "Simulateur de stabilité",
    tractorBrand: "Marque tracteur",
    tractorModel: "Modèle tracteur",
    machineBrand: "Marque machine",
    machineModel: "Modèle machine",
    options: "Configuration & lestage",
    rearTire: "Pneu arrière",
    frontBallast: "Masse avant",
    rearBallast: "Masse arrière",
    wheelARG: "Masse roue AR gauche",
    wheelARD: "Masse roue AR droite",
    waterBallast: "Lestage à l'eau",
    loader: "Chargeur frontal",
    loaderPos: "Position",
    loaderSerie: "Chargeur de série",
    disable: "Désactiver", enable: "Activer",
    low: "Basse", high: "Haute",
    results: "Résultats",
    transport: "Transport", work: "Travail",
    totalMass: "Masse totale",
    lateral: "I. latéral", longitudinal: "I. longitudinal", global: "I. global",
    fl: "AV G", fr: "AV D", rl: "AR G", rr: "AR D",
    polygon: "Polygone de sustentation",
    criteria: "Critères de sécurité",
    wheelLoads: "Charges aux roues",
    mass: "Masse", wheelbase: "Empattement",
    trackFront: "Voie AV", trackRear: "Voie AR",
    frontPct: "Répart. AV",
    computing: "Calcul...", noResult: "Sélectionnez tracteur + machine",
    noMachineData: "Données à venir",
    frontOffset: "Décalage masse avant (m)",
    rearOffset: "Décalage masse arrière (m)",
    environment: "Conditions environnementales",
    slopeLat: "Pente latérale (°)",
    slopeLong: "Pente longitudinale (°)",
    speed: "Vitesse (m/s)",
    accel: "Accélération longitudinale (m/s²)",
    turnRadius: "Rayon de virage (m)",
  },
  en: {
    title: "Stability simulator",
    tractorBrand: "Tractor brand",
    tractorModel: "Tractor model",
    machineBrand: "Machine brand",
    machineModel: "Machine model",
    options: "Configuration & ballast",
    rearTire: "Rear tire",
    frontBallast: "Front ballast",
    rearBallast: "Rear ballast",
    wheelARG: "Wheel weight RL",
    wheelARD: "Wheel weight RR",
    waterBallast: "Water ballast",
    loader: "Front loader",
    loaderPos: "Position",
    loaderSerie: "Default loader",
    disable: "Disable", enable: "Enable",
    low: "Low", high: "High",
    results: "Results",
    transport: "Transport", work: "Work",
    totalMass: "Total mass",
    lateral: "Lateral", longitudinal: "Longitudinal", global: "Global",
    fl: "FL", fr: "FR", rl: "RL", rr: "RR",
    polygon: "Stability polygon",
    criteria: "Safety criteria",
    wheelLoads: "Wheel loads",
    mass: "Mass", wheelbase: "Wheelbase",
    trackFront: "Front track", trackRear: "Rear track",
    frontPct: "Front dist.",
    computing: "Computing...", noResult: "Select tractor + machine",
    noMachineData: "Data coming soon",
    frontOffset: "Front ballast offset (m)",
    rearOffset: "Rear ballast offset (m)",
    environment: "Environmental conditions",
    slopeLat: "Lateral slope (°)",
    slopeLong: "Long. slope (°)",
    speed: "Speed (m/s)",
    accel: "Long. acceleration (m/s²)",
    turnRadius: "Turn radius (m)",
  }
};

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function indexColor(v, danger, warn) {
  if (v < 0 || v < danger) return "#A32D2D";
  if (v < warn) return "#854F0B";
  return "#3B6D11";
}

function statusColor(status) {
  if (!status) return { bg: "#f0f0f0", fg: "#888" };
  if (status.includes("OK")) return { bg: "#EAF3DE", fg: "#3B6D11" };
  if (status.includes("vert") || status.includes("Avert")) return { bg: "#FAEEDA", fg: "#854F0B" };
  return { bg: "#FCEBEB", fg: "#A32D2D" };
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

function ToggleOption({ label, active, onToggle, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#333", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1.5px solid #e0ddd8" }}>
        <button onClick={() => onToggle(false)} style={{
          flex: 1, padding: "10px 0", border: "none", fontSize: 13, cursor: "pointer",
          background: !active ? "#1a1a18" : "#fafaf8",
          color: !active ? "#fff" : "#aaa",
          fontWeight: !active ? 600 : 400, transition: "all 0.18s",
        }}>Désactiver</button>
        <button onClick={() => onToggle(true)} style={{
          flex: 1, padding: "10px 0", border: "none", fontSize: 13, cursor: "pointer",
          background: active ? "#1a1a18" : "#fafaf8",
          color: active ? "#fff" : "#aaa",
          fontWeight: active ? 600 : 400, transition: "all 0.18s",
          borderLeft: "1.5px solid #e0ddd8",
        }}>Activer</button>
      </div>
      {active && (
        <div style={{ marginTop: 2, padding: "12px 14px", background: "#f9f8f5", borderRadius: "0 0 10px 10px", border: "1.5px solid #e0ddd8", borderTop: "none" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function BrandBand({ brands, selected, onSelect }) {
  return (
    <div style={{ display: "flex", overflowX: "auto", background: "#1a1a18", padding: "0 8px" }}>
      {brands.map(({ key, color }) => {
        const active = selected === key;
        return (
          <button key={key} onClick={() => onSelect(key)} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 5, padding: "12px 16px", border: "none", cursor: "pointer",
            background: active ? color + "22" : "transparent",
            borderBottom: active ? `3px solid ${color}` : "3px solid transparent",
            transition: "all 0.18s", flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: active ? color : "#333",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 12, color: active ? "#fff" : "#666",
              transition: "all 0.18s",
            }}>{initials(key)}</div>
            <span style={{ fontSize: 9, color: active ? color : "#555", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
              {key}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TractorImage({ tractorKey, color, style = {} }) {
  const [hasImage, setHasImage] = useState(true);
  if (hasImage) {
    return (
      <img
        src={`/tractors/${tractorKey}.png`}
        alt={tractorKey}
        onError={() => setHasImage(false)}
        style={{ height: 220, width: "auto", maxWidth: "100%", objectFit: "contain", display: "block", ...style }}
      />
    );
  }
  return <TractorSVG color={color}/>;
}

function TractorSVG({ color }) {
  return (
    <svg width="100%" height="160" viewBox="0 0 360 160" fill="none">
      <rect x="90" y="50" width="180" height="80" rx="10" fill={color} opacity=".1"/>
      <rect x="100" y="60" width="100" height="60" rx="8" fill={color} opacity=".2"/>
      <rect x="210" y="68" width="54" height="44" rx="5" fill={color} opacity=".35"/>
      <rect x="264" y="78" width="26" height="28" rx="3" fill={color} opacity=".25"/>
      <circle cx="76" cy="112" r="38" stroke={color} strokeWidth="6" fill="none"/>
      <circle cx="76" cy="112" r="15" fill={color} opacity=".3"/>
      <circle cx="280" cy="116" r="30" stroke={color} strokeWidth="6" fill="none"/>
      <circle cx="280" cy="116" r="12" fill={color} opacity=".3"/>
      <rect x="38" y="109" width="300" height="7" rx="3" fill={color} opacity=".08"/>
      <rect x="90" y="55" width="34" height="22" rx="5" fill={color} opacity=".45"/>
      <rect x="264" y="78" width="22" height="8" rx="2" fill={color} opacity=".35"/>
    </svg>
  );
}

function MachineSVG({ color }) {
  return (
    <svg width="100%" height="160" viewBox="0 0 360 160" fill="none">
      <rect x="60" y="45" width="240" height="70" rx="10" fill={color} opacity=".1"/>
      <rect x="70" y="55" width="220" height="50" rx="8" fill={color} opacity=".18"/>
      <rect x="50" y="90" width="260" height="24" rx="6" fill={color} opacity=".3"/>
      <rect x="40" y="108" width="280" height="10" rx="5" fill={color} opacity=".45"/>
      <circle cx="90" cy="128" r="16" stroke={color} strokeWidth="3.5" fill="none"/>
      <circle cx="180" cy="128" r="16" stroke={color} strokeWidth="3.5" fill="none"/>
      <circle cx="270" cy="128" r="16" stroke={color} strokeWidth="3.5" fill="none"/>
      <rect x="60" y="40" width="18" height="60" rx="5" fill={color} opacity=".28"/>
      <rect x="282" y="40" width="18" height="60" rx="5" fill={color} opacity=".28"/>
    </svg>
  );
}

function InfoGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px 20px", padding: "14px 0 4px" }}>
      {items.map(([lbl, val]) => (
        <div key={lbl}>
          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>{lbl}</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a18" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

function Dots({ total, current, onSelect, color }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "10px 0 4px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} onClick={() => onSelect(i)} style={{
          height: 6, borderRadius: 3, cursor: "pointer",
          width: i === current ? 20 : 6,
          background: i === current ? color : "#ddd",
          transition: "all 0.2s",
        }}/>
      ))}
    </div>
  );
}

function SliderField({ label, value, onChange, min = 0, max, step = 50, unit = "kg" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#555" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18" }}>{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#3B6D11", cursor: "pointer" }}/>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 10, color: "#ccc" }}>{min}</span>
        <span style={{ fontSize: 10, color: "#ccc" }}>{max}</span>
      </div>
    </div>
  );
}

function Gauge({ label, value, danger, warn }) {
  const pct = Math.max(0, Math.min(1, value));
  const color = indexColor(value, danger, warn);
  const bg = { "#A32D2D": "#FCEBEB", "#854F0B": "#FAEEDA", "#3B6D11": "#EAF3DE" }[color] || "#f5f5f5";
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 12, padding: "12px 16px" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 8 }}>{value.toFixed(3)}</div>
      <div style={{ height: 5, borderRadius: 3, background: color + "30" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: color, borderRadius: 3, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }}/>
      </div>
    </div>
  );
}

function WheelGrid({ loads, total, t }) {
  const { FL, FR, RL, RR } = loads;
  const wc = v => (v / total) > 0.4 ? "#A32D2D" : (v / total) > 0.35 ? "#854F0B" : "#3B6D11";
  const wb = v => ({ "#A32D2D": "#FCEBEB", "#854F0B": "#FAEEDA", "#3B6D11": "#EAF3DE" })[wc(v)];
  const Wheel = ({ val, label }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 70, height: 70, borderRadius: 12, background: wb(val),
        border: `2.5px solid ${wc(val)}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: wc(val) }}>{Math.round(val)}</span>
        <span style={{ fontSize: 10, color: "#aaa" }}>kg</span>
      </div>
      <span style={{ fontSize: 11, color: "#888" }}>{label}</span>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 8, alignItems: "center", maxWidth: 280, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Wheel val={FL} label={t.fl}/>
        <Wheel val={RL} label={t.rl}/>
      </div>
      <div style={{ height: 110, border: "1.5px solid #e5e1d8", borderRadius: 10, background: "#fafaf8" }}/>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Wheel val={FR} label={t.fr}/>
        <Wheel val={RR} label={t.rr}/>
      </div>
    </div>
  );
}

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
  const pc = ist < 0 ? "#A32D2D" : ist < 0.4 ? "#A32D2D" : ist < 0.5 ? "#854F0B" : "#3B6D11";
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <polygon points={svgPts} fill={`${pc}10`} stroke={pc} strokeWidth="1.5" strokeDasharray="6 3"/>
      {pts.map(([x,y],i) => <circle key={i} cx={tx(x)} cy={ty(y)} r={5} fill={pc}/>)}
      <line x1={cx} y1={PAD/2} x2={cx} y2={H-PAD/2} stroke="#eee" strokeWidth="0.5" strokeDasharray="4 4"/>
      <line x1={PAD/2} y1={cy} x2={W-PAD/2} y2={cy} stroke="#eee" strokeWidth="0.5" strokeDasharray="4 4"/>
      <circle cx={tx(XG)} cy={ty(YG)} r={10} fill={pc} opacity="0.2"/>
      <circle cx={tx(XG)} cy={ty(YG)} r={6} fill={pc}/>
      <circle cx={tx(XG)} cy={ty(YG)} r={2.5} fill="#fff"/>
      <text x={tx(L/2)+8} y={cy+4} fontSize="10" fill="#bbb">AV</text>
      <text x={tx(-L/2)-24} y={cy+4} fontSize="10" fill="#bbb">AR</text>
      <text x={tx(XG)} y={ty(YG)-16} fontSize="9" fill={pc} textAnchor="middle" fontWeight="600">
        ({XG.toFixed(2)}, {YG.toFixed(2)})
      </text>
    </svg>
  );
}

function StickyBar({ result, mode, t, onModeChange }) {
  const st = result ? result[`static_${mode}`] : null;
  const cg = result ? result[mode === "transport" ? "transport" : "work"] : null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "#1a1a18", borderTop: "2px solid #2a2a28",
      padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1.5px solid #333", flexShrink: 0 }}>
        {["transport", "work"].map(m => (
          <button key={m} onClick={() => onModeChange(m)} style={{
            padding: "6px 14px", border: "none", fontSize: 12, cursor: "pointer",
            background: mode === m ? "#3B6D11" : "transparent",
            color: mode === m ? "#fff" : "#555",
            fontWeight: mode === m ? 600 : 400, transition: "all 0.15s",
          }}>
            {m === "transport" ? t.transport : t.work}
          </button>
        ))}
      </div>

      {cg && (
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "#555" }}>{t.totalMass} </span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{Math.round(cg.mass_total).toLocaleString()} kg</span>
        </div>
      )}

      {st && (
        <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
          {[[t.lateral, st.I_lat, 0.4, 0.5],[t.longitudinal, st.I_long, 0.5, 0.6],[t.global, st.I_static, 0.4, 0.5]].map(([lbl, val, d, w]) => {
            const col = indexColor(val, d, w);
            return (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col }}/>
                <span style={{ fontSize: 10, color: "#555" }}>{lbl}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: col }}>{val.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}

      {!result && <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{t.noResult}</span>}

      {result && (
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {result.compatibility.map((c, i) => {
            const ok = c.status.includes("OK");
            const warn = c.status.includes("vert") || c.status.includes("Avert");
            return <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: ok ? "#3B6D11" : warn ? "#854F0B" : "#A32D2D" }}/>;
          })}
        </div>
      )}
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tractor_name: tractor.key, machine_name: machine.key, options, environment: env }),
        });
        if (res.ok) setResult(await res.json());
      } catch {}
      setComputing(false);
    }, 400);
  }, [tractorList, tractorIdx, machineList, machineIdx, options, env]);

  useEffect(() => { triggerSimulate(); }, [triggerSimulate]);

  const activeTractor = tractorList[tractorIdx];
  const activeMachine = machineList[machineIdx];
  const tractorColor = TRACTOR_BRANDS.find(b => b.key === tractorBrand)?.color || "#3B6D11";
  const machineColor = MACHINE_BRANDS.find(b => b.key === machineBrand)?.color || "#1A5276";

  const Section = ({ label, children, bg = "#fff" }) => (
    <div style={{ background: bg, borderBottom: "1.5px solid #e5e1d8" }}>
      <div style={{ padding: "10px 24px 0", fontSize: 10, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ background: "#f5f3ee", minHeight: "100vh", paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: "#1a1a18", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{t.title}</div>
          <div style={{ fontSize: 9, color: "#444" }}>Maneko — v20</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {computing && <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>{t.computing}</span>}
          <button onClick={() => setLang(l => l === "fr" ? "en" : "fr")} style={{
            padding: "5px 11px", borderRadius: 7, border: "1.5px solid #333",
            background: "transparent", color: "#888", fontSize: 11, cursor: "pointer",
          }}>{lang === "fr" ? "EN" : "FR"}</button>
        </div>
      </div>

      {/* MARQUES TRACTEUR */}
      <div style={{ borderBottom: "1.5px solid #e5e1d8" }}>
        <div style={{ padding: "10px 20px 0", fontSize: 10, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, background: "#1a1a18" }}>
          {t.tractorBrand}
        </div>
        <BrandBand brands={TRACTOR_BRANDS} selected={tractorBrand} onSelect={setTractorBrand}/>
      </div>

      {/* MODÈLE TRACTEUR */}
      {tractorBrand && (
        <Section label={t.tractorModel} bg="#fff">
          {tractorList.length > 0 ? (
          <div style={{
            position: "relative",
            backgroundImage: `url(/brands/${tractorBrand}.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: 280,
            overflow: "hidden",
          }}>
            {/* Overlay léger */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.55)" }}/>

            {/* Contenu */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "20px 24px" }}>

              {/* Flèche gauche */}
              <button onClick={() => setTractorIdx(i => Math.max(0, i - 1))} disabled={tractorIdx === 0} style={{
                width: 38, height: 38, borderRadius: 9, border: "1.5px solid #e5e1d8",
                background: "rgba(255,255,255,0.8)", cursor: tractorIdx === 0 ? "not-allowed" : "pointer",
                fontSize: 20, color: tractorIdx === 0 ? "#ddd" : "#444",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 2,
              }}>‹</button>

              {/* Infos à gauche */}
              <div style={{ flex: "0 0 220px", padding: "0 24px", zIndex: 2 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a18", marginBottom: 16 }}>
                  {activeTractor?.name}
                </div>
                {activeTractor && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      [t.mass, `${activeTractor.mass?.toLocaleString()} kg`],
                      [t.frontPct, `${activeTractor.mass_front_pct}% AV`],
                      [t.wheelbase, `${activeTractor.wheelbase?.toFixed(3)} m`],
                      [t.trackRear, `${activeTractor.track_rear?.toFixed(2)} m`],
                      ["Pneu", activeTractor.tire_defaults?.rear || "—"],
                    ].map(([lbl, val]) => (
                      <div key={lbl}>
                        <div style={{ fontSize: 10, color: "#888" }}>{lbl}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image tracteur — grande, à droite */}
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", zIndex: 2 }}>
                {activeTractor && (
                  <TractorImage
                    tractorKey={activeTractor.key}
                    color={tractorColor}
                    style={{ height: 220, width: "auto", maxWidth: "70%", objectFit: "contain" }}
                  />
                )}
              </div>

              {/* Flèche droite */}
              <button onClick={() => setTractorIdx(i => Math.min(tractorList.length - 1, i + 1))} disabled={tractorIdx === tractorList.length - 1} style={{
                width: 38, height: 38, borderRadius: 9, border: "1.5px solid #e5e1d8",
                background: "rgba(255,255,255,0.8)", cursor: tractorIdx === tractorList.length - 1 ? "not-allowed" : "pointer",
                fontSize: 20, color: tractorIdx === tractorList.length - 1 ? "#ddd" : "#444",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 2,
              }}>›</button>
            </div>

            {/* Dots */}
            <div style={{ position: "relative", zIndex: 2, paddingBottom: 16 }}>
              <Dots total={tractorList.length} current={tractorIdx} onSelect={setTractorIdx} color={tractorColor}/>
            </div>
          </div>
          ) : (
            <div style={{ padding: "30px 24px", textAlign: "center", color: "#bbb", fontSize: 13, fontStyle: "italic" }}>
              {t.noMachineData} — {tractorBrand}
            </div>
          )}
        </Section>
      )}
          ) : (
            <div style={{ padding: "30px 24px", textAlign: "center", color: "#bbb", fontSize: 13, fontStyle: "italic" }}>
              {t.noMachineData} — {tractorBrand}
            </div>
          )}
        </Section>
      )}

      {/* MARQUES MACHINE */}
      <div style={{ borderBottom: "1.5px solid #e5e1d8" }}>
        <div style={{ padding: "10px 20px 0", fontSize: 10, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, background: "#1a1a18" }}>
          {t.machineBrand}
        </div>
        <BrandBand brands={MACHINE_BRANDS} selected={machineBrand} onSelect={setMachineBrand}/>
      </div>

      {/* MODÈLE MACHINE */}
      <Section label={t.machineModel} bg="#fff">
        {machineList.length > 0 ? (
          <div style={{ padding: "16px 24px 20px", display: "flex", alignItems: "flex-start", gap: 20 }}>
            <button onClick={() => setMachineIdx(i => Math.max(0, i - 1))} disabled={machineIdx === 0} style={{
              width: 38, height: 38, borderRadius: 9, border: "1.5px solid #e5e1d8",
              background: "#fafaf8", cursor: machineIdx === 0 ? "not-allowed" : "pointer",
              fontSize: 20, color: machineIdx === 0 ? "#ddd" : "#444",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 60,
            }}>‹</button>

            <div style={{ flex: 1 }}>
              {activeMachine && (
                <>
                  <div style={{ borderRadius: 12, overflow: "hidden", background: `${machineColor}06`, border: `1.5px solid ${machineColor}20` }}>
                    <MachineSVG color={machineColor}/>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 12, marginBottom: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a18" }}>{activeMachine.model}</div>
                  </div>
                  <InfoGrid items={[
                    [t.mass, `${activeMachine.mass?.toLocaleString()} kg`],
                  ]}/>
                  <Dots total={machineList.length} current={machineIdx} onSelect={setMachineIdx} color={machineColor}/>
                </>
              )}
            </div>

            <button onClick={() => setMachineIdx(i => Math.min(machineList.length - 1, i + 1))} disabled={machineIdx === machineList.length - 1} style={{
              width: 38, height: 38, borderRadius: 9, border: "1.5px solid #e5e1d8",
              background: "#fafaf8", cursor: machineIdx === machineList.length - 1 ? "not-allowed" : "pointer",
              fontSize: 20, color: machineIdx === machineList.length - 1 ? "#ddd" : "#444",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 60,
            }}>›</button>
          </div>
        ) : (
          <div style={{ padding: "30px 24px", textAlign: "center", color: "#bbb", fontSize: 13, fontStyle: "italic" }}>
            {t.noMachineData} — {machineBrand}
          </div>
        )}
      </Section>

      {/* OPTIONS */}
      <Section label={t.options}>
        <div style={{ padding: "16px 24px 20px" }}>

          {/* Sliders masse avant/arrière/roues — toujours visibles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginBottom: 20 }}>
            <div>
              <SliderField label={t.frontBallast} value={options.front_ballast_mass} max={2000} onChange={v => setOptions(o => ({ ...o, front_ballast_mass: v }))}/>
              <SliderField label={t.frontOffset} value={options.front_ballast_offset} min={0.1} max={2} step={0.05} unit="m" onChange={v => setOptions(o => ({ ...o, front_ballast_offset: v }))}/>
              <SliderField label={t.rearBallast} value={options.rear_ballast_mass} max={2000} onChange={v => setOptions(o => ({ ...o, rear_ballast_mass: v }))}/>
              <SliderField label={t.rearOffset} value={options.rear_ballast_offset} min={0.1} max={2} step={0.05} unit="m" onChange={v => setOptions(o => ({ ...o, rear_ballast_offset: v }))}/>
            </div>
            <div>
              <SliderField label={t.wheelARG} value={options.wheel_weight_ARG} max={800} step={25} onChange={v => setOptions(o => ({ ...o, wheel_weight_ARG: v }))}/>
              <SliderField label={t.wheelARD} value={options.wheel_weight_ARD} max={800} step={25} onChange={v => setOptions(o => ({ ...o, wheel_weight_ARD: v }))}/>
            </div>
          </div>

          {/* Pneu personnalisé */}
          <ToggleOption
            label={t.rearTire}
            active={options.custom_tire}
            onToggle={v => setOptions(o => ({ ...o, custom_tire: v, rear_tire: v ? o.rear_tire : (tractorList[tractorIdx]?.tire_defaults?.rear || "") }))}
          >
            <select value={options.rear_tire} onChange={e => setOptions(o => ({ ...o, rear_tire: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e0ddd8", fontSize: 13, background: "#fff", marginTop: 10 }}>
              <option value="">—</option>
              {allTires.map(ti => <option key={ti.reference} value={ti.reference}>{ti.reference} (⌀ {ti.diameter_mm} mm)</option>)}
            </select>
          </ToggleOption>

          {/* Lestage à l'eau */}
          <ToggleOption
            label={t.waterBallast}
            active={options.water_ballast}
            onToggle={v => setOptions(o => ({ ...o, water_ballast: v }))}
          >
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0f8ff", borderRadius: 9, fontSize: 12, color: "#555" }}>
              Remplissage automatique à 75% du volume des pneus AR avec mélange eau/antigel (0.754875 kg/L)
            </div>
          </ToggleOption>

          {/* Chargeur frontal */}
          <ToggleOption
            label={t.loader}
            active={options.loader_enabled}
            onToggle={v => setOptions(o => ({ ...o, loader_enabled: v }))}
          >
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                {t.loaderSerie} : <strong style={{ color: "#1a1a18" }}>{getLoaderCategory(activeTractor?.mass)}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "#555" }}>{t.loaderPos}</span>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1.5px solid #e0ddd8" }}>
                  {[["low", t.low], ["high", t.high]].map(([v, lbl]) => (
                    <button key={v} onClick={() => setOptions(o => ({ ...o, loader_mode: v }))} style={{
                      padding: "6px 14px", border: "none", fontSize: 12, cursor: "pointer",
                      background: options.loader_mode === v ? "#1a1a18" : "#fafaf8",
                      color: options.loader_mode === v ? "#fff" : "#888",
                      transition: "all 0.15s",
                    }}>{lbl}</button>
                  ))}
                </div>
              </div>
            </div>
          </ToggleOption>

        </div>
      </Section>

      {/* ENVIRONNEMENT */}
      <Section label={t.environment}>
        <div style={{ padding: "16px 24px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
          <div>
            <SliderField label={t.slopeLat} value={env.slope_lat} min={-30} max={30} step={0.5} unit="°" onChange={v => setEnv(e => ({ ...e, slope_lat: v }))}/>
            <SliderField label={t.slopeLong} value={env.slope_long} min={-30} max={30} step={0.5} unit="°" onChange={v => setEnv(e => ({ ...e, slope_long: v }))}/>
          </div>
          <div>
            <SliderField label={`${t.speed} (max ${(env.speed * 3.6).toFixed(1)} km/h)`} value={env.speed} min={0} max={11.1} step={0.1} unit="m/s" onChange={v => setEnv(e => ({ ...e, speed: v }))}/>
            {env.speed > 0 && <div style={{ fontSize: 11, color: "#854F0B", marginTop: -10, marginBottom: 12 }}>{env.speed.toFixed(1)} m/s = {(env.speed * 3.6).toFixed(1)} km/h</div>}
            <SliderField label={t.accel} value={env.accel_long} min={0} max={10} step={0.1} unit="m/s²" onChange={v => setEnv(e => ({ ...e, accel_long: v }))}/>
            <SliderField label={t.turnRadius} value={env.turn_radius} min={0} max={50} step={0.5} unit="m" onChange={v => setEnv(e => ({ ...e, turn_radius: v }))}/>
          </div>
        </div>
      </Section>

      {/* RÉSULTATS — double colonne transport / travail */}
      {result && (
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
            {t.results}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {["transport", "work"].map(m => {
              const st = result[`static_${m}`];
              const loads = result[m === "transport" ? "wheels_transport" : "wheels_work"];
              const cg = result[m === "transport" ? "transport" : "work"];
              return (
                <div key={m}>
                  {/* Titre mode */}
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: "#fff", textAlign: "center",
                    background: "#1a1a18", borderRadius: "10px 10px 0 0", padding: "8px 0",
                  }}>
                    {m === "transport" ? t.transport : t.work} — {Math.round(cg?.mass_total || 0).toLocaleString()} kg
                  </div>

                  {/* Polygone */}
                  <div style={{ background: "#fff", border: "1.5px solid #e5e1d8", borderTop: "none", padding: "14px 16px" }}>
                    <div style={{ fontSize: 10, color: "#aaa", marginBottom: 6 }}>{t.polygon}</div>
                    <PolygonView result={result} mode={m} tractorGeom={activeTractor}/>
                  </div>

                  {/* Jauges */}
                  {st && (
                    <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
                      <Gauge label={t.lateral} value={st.I_lat} danger={0.4} warn={0.5}/>
                      <Gauge label={t.longitudinal} value={st.I_long} danger={0.5} warn={0.6}/>
                      <Gauge label={t.global} value={st.I_static} danger={0.4} warn={0.5}/>
                    </div>
                  )}

                  {/* Roues */}
                  <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #e5e1d8", padding: "14px 16px", marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#aaa", marginBottom: 12 }}>{t.wheelLoads}</div>
                    <WheelGrid loads={loads} total={cg?.mass_total || 1} t={t}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critères pleine largeur */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e5e1d8", padding: "16px 18px", marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>{t.criteria}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
              {result.compatibility.map((c, i) => {
                const { bg, fg } = statusColor(c.status);
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 0", borderBottom: "0.5px solid #f0ece2",
                  }}>
                    <span style={{ fontSize: 12, color: "#555" }}>{c.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: bg, color: fg }}>
                      {c.status.includes("OK") ? "✓ OK" : c.status.includes("vert") || c.status.includes("Avert") ? "⚠" : "✗"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <StickyBar result={result} mode={mode} t={t} onModeChange={setMode}/>
    </div>
  );
}
