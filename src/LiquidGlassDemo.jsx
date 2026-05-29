import { useState } from 'react';
import LiquidGlass from './components/LiquidGlass';

const isChromeUA = /Chrome\//.test(navigator.userAgent) &&
  !/Edg\/|OPR\/|SamsungBrowser\//.test(navigator.userAgent);

const BG = 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?q=80&w=1600&auto=format&fit=crop';

const SURFACES = ['convex', 'squircle', 'concave', 'lip'];

// ─── Ligne de contrôle slider ────────────────────────────────────────────────
function Ctrl({ label, value, min, max, step = 1, onChange, fmt }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '148px 1fr 46px', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11.5 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ cursor: 'pointer', accentColor: 'rgba(255,255,255,0.9)' }} />
      <span style={{ color: 'white', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
        {fmt ? fmt(value) : value}
      </span>
    </div>
  );
}

// ─── Switch LiquidGlass ──────────────────────────────────────────────────────
function GlassSwitch({ isOn, onToggle, ...lg }) {
  return (
    <button onClick={onToggle} aria-pressed={isOn}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block' }}>
      <LiquidGlass style={{ width: 58, height: 32 }} borderRadius={16} {...lg}
        tint={isOn ? 'rgba(74,222,128,0.28)' : lg.tint}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div style={{
            position: 'absolute', top: 4, left: isOn ? 26 : 4,
            width: 24, height: 24, borderRadius: '50%',
            background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            transition: 'left 0.18s ease',
          }} />
        </div>
      </LiquidGlass>
    </button>
  );
}

// ─── Slider LiquidGlass ──────────────────────────────────────────────────────
function GlassSlider({ value, onChange, ...lg }) {
  return (
    <LiquidGlass style={{ width: 220, height: 36 }} borderRadius={18} {...lg}>
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 14, right: 14, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: 14, height: 3, width: `calc((100% - 28px) * ${value})`, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
        <div style={{
          position: 'absolute', pointerEvents: 'none',
          left: `calc(14px + (100% - 28px) * ${value} - 11px)`,
          width: 22, height: 22, borderRadius: '50%',
          background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }} />
        <input type="range" min="0" max="1" step="0.01" value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
      </div>
    </LiquidGlass>
  );
}

// ─── Démo ────────────────────────────────────────────────────────────────────
export default function LiquidGlassDemo() {
  const [p, setP] = useState({
    // Forme (reconstruisent la carte)
    bezelWidth:         0.035,
    glassThickness:     0.050,
    surface:           'convex',
    // Rendu (pas de reconstruction)
    scale:              35,
    filterBlur:         1.5,
    specularOpacity:    0.50,
    specularReflection: 25,
    specularAngle:      135,
    tintAlpha:          0.08,
    borderRadius:       20,
    blur:               14,
  });

  const [switchOn,  setSwitchOn]  = useState(true);
  const [sliderVal, setSliderVal] = useState(0.68);

  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  const lg = {
    bezelWidth:          p.bezelWidth,
    glassThickness:      p.glassThickness,
    surface:             p.surface,
    scale:               p.scale,
    filterBlur:          p.filterBlur,
    specularOpacity:     p.specularOpacity,
    specularReflection:  p.specularReflection,
    specularAngle:       p.specularAngle,
    tint:               `rgba(255,255,255,${p.tintAlpha})`,
    borderRadius:        p.borderRadius,
    blur:                p.blur,
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>

      {/* Fond photo */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'rgba(0,0,0,0.08)' }} />

      <div style={{ position: 'relative', zIndex: 1,
        padding: '28px 20px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

        {/* Titre */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 8px', color: 'white', fontSize: 20, fontWeight: 800, textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}>
            LiquidGlass — démo
          </h1>
          <span style={{
            display: 'inline-block', padding: '3px 12px', borderRadius: 20,
            background: isChromeUA ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)',
            backdropFilter: 'blur(8px)', color: 'white', fontSize: 11, fontWeight: 600,
          }}>
            {isChromeUA ? '✓ Chrome — SVG filter actif' : '✗ Autre navigateur — blur fallback'}
          </span>
        </div>

        {/* ── Panneau de réglages ── */}
        <LiquidGlass style={{ width: 460, maxWidth: '94vw', padding: '16px 18px' }}
          borderRadius={14} scale={12} filterBlur={1} tint="rgba(0,0,0,0.32)"
          specularOpacity={0.15} specularReflection={8} specularAngle={135}
          bezelWidth={0.2} glassThickness={0.4} surface="convex" blur={16}>

          {/* ── Forme (carte) ── */}
          <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Forme — reconstruit la carte
          </p>

          {/* Surface selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '148px 1fr', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11.5 }}>surface</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {SURFACES.map(s => (
                <button key={s} onClick={() => set('surface')(s)} style={{
                  flex: 1, padding: '4px 2px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 10.5, fontWeight: p.surface === s ? 700 : 400,
                  background: p.surface === s ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)',
                  color: 'white', transition: 'background 0.15s',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Ctrl label="bezelWidth"     value={p.bezelWidth}     min={0.005} max={0.1} step={0.005} onChange={set('bezelWidth')}     fmt={v => v.toFixed(3)} />
          <Ctrl label="glassThickness" value={p.glassThickness} min={0.005} max={0.1} step={0.005} onChange={set('glassThickness')} fmt={v => v.toFixed(3)} />

          <div style={{ margin: '10px 0 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

          {/* ── Rendu (pas de reconstruction) ── */}
          <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Rendu — instantané
          </p>

          <Ctrl label="scale (réfraction)"    value={p.scale}              min={0}   max={120} onChange={set('scale')} />
          <Ctrl label="filterBlur"            value={p.filterBlur}         min={0}   max={10}  step={0.1}  onChange={set('filterBlur')}         fmt={v => v.toFixed(1)} />
          <Ctrl label="specularOpacity"       value={p.specularOpacity}    min={0}   max={1}   step={0.05} onChange={set('specularOpacity')}    fmt={v => v.toFixed(2)} />
          <Ctrl label="specularReflection"    value={p.specularReflection} min={1}   max={60}  onChange={set('specularReflection')} />
          <Ctrl label="specularAngle (°)"     value={p.specularAngle}      min={0}   max={360} onChange={set('specularAngle')}      fmt={v => `${v}°`} />
          <Ctrl label="tint alpha"            value={p.tintAlpha}          min={0}   max={0.5} step={0.01} onChange={set('tintAlpha')}          fmt={v => v.toFixed(2)} />
          <Ctrl label="borderRadius"          value={p.borderRadius}       min={0}   max={40}  onChange={set('borderRadius')}       fmt={v => `${v}px`} />
          <Ctrl label="blur CSS (fallback)"   value={p.blur}               min={0}   max={40}  onChange={set('blur')}               fmt={v => `${v}px`} />

          {/* Valeurs copiables */}
          <div style={{ marginTop: 8, padding: '7px 10px', background: 'rgba(0,0,0,0.35)', borderRadius: 7 }}>
            <code style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, lineHeight: 1.8 }}>
              surface="{p.surface}" bezelWidth={p.bezelWidth.toFixed(3)} glassThickness={p.glassThickness.toFixed(3)}<br />
              scale={p.scale} filterBlur={p.filterBlur} specularOpacity={p.specularOpacity}<br />
              specularReflection={p.specularReflection} specularAngle={p.specularAngle}° tint α={p.tintAlpha}
            </code>
          </div>
        </LiquidGlass>

        {/* ── Carte texte ── */}
        <LiquidGlass style={{ width: 360, maxWidth: '92vw', padding: '18px 16px' }} {...lg}>
          <p style={{ margin: '0 0 5px', color: 'white', fontWeight: 700, fontSize: 14 }}>Panneau carte</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.6 }}>
            La réfraction est concentrée dans le biseau (bezelWidth). Le centre est plat (convex) ou creux (lip/concave).
          </p>
        </LiquidGlass>

        {/* ── Switch + Slider ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>

          <LiquidGlass style={{ padding: '14px 18px' }} {...lg}>
            <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.5)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Switch</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GlassSwitch isOn={switchOn} onToggle={() => setSwitchOn(v => !v)} {...lg} />
              <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                {switchOn ? 'Activé' : 'Désactivé'}
              </span>
            </div>
          </LiquidGlass>

          <LiquidGlass style={{ padding: '14px 18px' }} {...lg}>
            <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.5)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Slider</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GlassSlider value={sliderVal} onChange={setSliderVal} {...lg} />
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700, minWidth: 34 }}>
                {Math.round(sliderVal * 100)}%
              </span>
            </div>
          </LiquidGlass>

        </div>

        {/* ── Pilule ── */}
        <LiquidGlass style={{ padding: '11px 30px' }} {...{ ...lg, borderRadius: 999 }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Pilule — borderRadius 999</span>
        </LiquidGlass>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
          Supprimer <code style={{ color: 'rgba(255,255,255,0.45)' }}>?demo</code> de l'URL pour revenir au simulateur
        </p>

      </div>
    </div>
  );
}
