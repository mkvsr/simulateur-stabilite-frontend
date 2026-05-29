import { useEffect, useRef, useState, useId } from 'react';

function isChrome() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua) && !/SamsungBrowser\//.test(ua);
}

// ─── Profils de déplacement ──────────────────────────────────────────────────
// t ∈ [0,1] : 0 = bord extérieur du biseau, 1 = bord intérieur
// retourne ∈ [-1,1] : positif = converge vers centre, négatif = diverge

function dispProfile(t, surface) {
  switch (surface) {
    case 'convex':   return Math.cos(t * Math.PI / 2);  // 1→0
    case 'squircle': return Math.sqrt(Math.max(0, 1 - t)); // 1→0 plus doux aux angles
    case 'concave':  return -(1 - t);                    // 0→-1 divergent
    case 'lip':      return Math.cos(t * Math.PI);       // 1→0→-1 convergent puis divergent
    default:         return Math.cos(t * Math.PI / 2);
  }
}

// ─── Profils de hauteur (pour le specular) ───────────────────────────────────
// retourne ∈ [0,1] : hauteur 3D normalisée

function heightProfile(t, surface) {
  switch (surface) {
    case 'convex':
    case 'squircle': return t;                         // 0→1 : monte vers l'intérieur
    case 'concave':  return 1 - t;                     // 1→0 : descend vers l'intérieur
    case 'lip':      return Math.sin(t * Math.PI);     // 0→pic→0 : anneau
    default:         return t;
  }
}

function interiorHeight(surface) {
  return (surface === 'convex' || surface === 'squircle') ? 1 : 0;
}

// ─── SDF rectangle arrondi ───────────────────────────────────────────────────
//
// Retourne { dist, dirX, dirY } :
//   dist  : distance depuis le bord intérieur vers le centre [0 au bord, ∞ au centre]
//   dirX/Y: direction unitaire vers le centre (tourne continûment autour des coins)
//
// cornerFrac : fraction [0–0.5] de la demi-dimension utilisée pour les coins arrondis.
// Sans cornerFrac les transitions bord→coin créent des zones rectangulaires distinctes
// = le "quadrillage" visible. Avec cornerFrac la direction tourne en douceur.

function borderSDF(nx, ny, cornerFrac) {
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  const cr = Math.max(0.001, Math.min(0.499, cornerFrac));
  const inner = 1 - cr; // coordonnée du centre du coin arrondi

  if (ax > inner && ay > inner) {
    // Zone coin : distance depuis l'arc du coin
    const fcx = ax - inner;
    const fcy = ay - inner;
    const d   = Math.sqrt(fcx * fcx + fcy * fcy);
    const dist = Math.max(0, cr - d);
    if (d < 1e-4) {
      // Exactement sur le centre du coin → direction diagonale
      const s = 1 / Math.SQRT2;
      return { dist: cr, dirX: -Math.sign(nx || 1) * s, dirY: -Math.sign(ny || 1) * s };
    }
    return {
      dist,
      dirX: -Math.sign(nx) * fcx / d,
      dirY: -Math.sign(ny) * fcy / d,
    };
  } else if (1 - ax <= 1 - ay) {
    // Plus près d'un bord vertical (gauche/droite)
    return { dist: 1 - ax, dirX: -Math.sign(nx), dirY: 0 };
  } else {
    // Plus près d'un bord horizontal (haut/bas)
    return { dist: 1 - ay, dirX: 0, dirY: -Math.sign(ny) };
  }
}

// ─── Génération des deux cartes canvas ──────────────────────────────────────
//
// displacementMap : R=X, G=Y, B=128, A=255 (toujours 255 → évite la prémultiplication alpha)
// specularMap     : R=G=B=255, A=intensité (image blanche semi-transparente)
//
// La SDF garantit une direction de déplacement continue autour des coins →
// plus de quadrillage quelle que soit la valeur de bezelWidth.

function buildMaps(width, height, bezelWidth, glassThickness, surface,
                   specularAngle, specularOpacity, specularReflection, borderRadius) {
  const dCanvas = document.createElement('canvas');
  const sCanvas = document.createElement('canvas');
  dCanvas.width = sCanvas.width = width;
  dCanvas.height = sCanvas.height = height;

  const dCtx = dCanvas.getContext('2d');
  const sCtx = sCanvas.getContext('2d');
  const dImg = dCtx.createImageData(width, height);
  const sImg = sCtx.createImageData(width, height);
  const dd = dImg.data;
  const sd = sImg.data;

  // cornerFrac : fraction normalisée du border-radius CSS
  const cornerFrac = Math.min(0.45, borderRadius / (Math.min(width, height) / 2));

  // Direction lumière (azimut SVG → vecteur 3D)
  const rad = (specularAngle * Math.PI) / 180;
  const lx = Math.cos(rad);
  const ly = Math.sin(rad);
  const lz = 1.0;
  const lMag = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const nlx = lx / lMag, nly = ly / lMag, nlz = lz / lMag;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const nx = (col * 2 / width) - 1;
      const ny = (row * 2 / height) - 1;

      // Distance depuis le bord + direction continue (SDF arrondie)
      const { dist, dirX, dirY } = borderSDF(nx, ny, cornerFrac);

      // t = 0 au bord, 1 à la limite intérieure du biseau (>1 = intérieur plat)
      const rawT = dist / bezelWidth;
      const inBezel = rawT < 1;
      const t = Math.min(rawT, 1);

      // ── Déplacement (unique scalaire × direction continue) ──
      const dp = inBezel ? dispProfile(t, surface) : 0;
      const dx = dirX * dp * glassThickness;
      const dy = dirY * dp * glassThickness;

      // ── Normale de surface pour le specular ──
      // La pente est le gradient du profil de hauteur : dH/dt × (1/bezelWidth)
      // Direction : identique à dirX/Y (gradient pointe vers le centre)
      const slope = inBezel
        ? (heightProfile(Math.min(t + 0.01, 1), surface) - heightProfile(Math.max(t - 0.01, 0), surface)) / 0.02
        : 0;
      const slopeScale = slope * glassThickness / bezelWidth;
      const snx = -dirX * slopeScale;
      const sny = -dirY * slopeScale;
      const snz = 1.0;
      const snMag = Math.sqrt(snx * snx + sny * sny + snz * snz);

      // ── Specular Blinn-Phong ──
      const nnx = snx / snMag, nny = sny / snMag, nnz = snz / snMag;
      const hvx = nlx / 2, hvy = nly / 2, hvz = (nlz + 1) / 2;
      const hvMag = Math.sqrt(hvx * hvx + hvy * hvy + hvz * hvz);
      const dot = Math.max(0, nnx * hvx / hvMag + nny * hvy / hvMag + nnz * hvz / hvMag);
      const spec = Math.pow(dot, Math.max(1, specularReflection)) * specularOpacity;

      const i = (row * width + col) * 4;

      dd[i]     = Math.max(0, Math.min(255, Math.round(128 + dx * 127)));
      dd[i + 1] = Math.max(0, Math.min(255, Math.round(128 + dy * 127)));
      dd[i + 2] = 128;
      dd[i + 3] = 255;

      sd[i] = sd[i + 1] = sd[i + 2] = 255;
      sd[i + 3] = Math.max(0, Math.min(255, Math.round(spec * 255)));
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  sCtx.putImageData(sImg, 0, 0);
  return { dispUrl: dCanvas.toDataURL('image/png'), specUrl: sCanvas.toDataURL('image/png') };
}

// ─── Composant ────────────────────────────────────────────────────────────────
/**
 * LiquidGlass — wrapper transparent avec effet verre liquide sur le backdrop.
 *
 * Chrome  → SVG filter : feGaussianBlur + feDisplacementMap + feImage specular + feBlend
 * Autres  → backdrop-filter: blur() + gradient specular CSS
 *
 * Paramètres de forme (reconstruisent les cartes) :
 *   bezelWidth        fraction [0–1] de la largeur occupée par le biseau    default 0.35
 *   glassThickness    amplitude [0–1] du profil                              default 0.5
 *   surface           'convex'|'squircle'|'concave'|'lip'                   default 'convex'
 *
 * Paramètres de rendu :
 *   scale             scale feDisplacementMap                                default 35
 *   filterBlur        feGaussianBlur stdDeviation                            default 1.5
 *   specularOpacity   intensité [0–1] du rim light                          default 0.50
 *   specularReflection exposant Blinn-Phong (netteté du highlight)           default 25
 *   specularAngle     azimut de la lumière (degrés, SVG convention)         default 135
 *   tint              couleur de teinte                                       default rgba(255,255,255,0.08)
 *   borderRadius      px                                                      default 20
 *   blur              px blur CSS fallback                                    default 14
 */
export default function LiquidGlass({
  children,
  className          = '',
  style              = {},
  bezelWidth         = 0.35,
  glassThickness     = 0.5,
  surface            = 'convex',
  scale              = 35,
  filterBlur         = 1.5,
  specularOpacity    = 0.50,
  specularReflection = 25,
  specularAngle      = 135,
  tint               = 'rgba(255,255,255,0.08)',
  borderRadius       = 20,
  blur               = 14,
}) {
  const rawId    = useId();
  const filterId = 'lg' + rawId.replace(/[^a-zA-Z0-9]/g, '');

  const [chrome, setChrome] = useState(false);
  const [dims,   setDims]   = useState({ w: 0, h: 0 });
  const [maps,   setMaps]   = useState(null); // { dispUrl, specUrl }
  const ref = useRef(null);

  useEffect(() => { setChrome(isChrome()); }, []);

  useEffect(() => {
    if (!chrome || !ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      if (w > 4 && h > 4) setDims({ w, h });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [chrome]);

  useEffect(() => {
    if (!chrome || !dims.w || !dims.h) return;
    setMaps(buildMaps(
      dims.w, dims.h,
      bezelWidth, glassThickness, surface,
      specularAngle, specularOpacity, specularReflection,
      borderRadius,
    ));
  }, [chrome, dims.w, dims.h, bezelWidth, glassThickness, surface, specularAngle, specularOpacity, specularReflection, borderRadius]);

  const baseStyle = { borderRadius, overflow: 'hidden', position: 'relative', ...style };

  if (chrome && maps) {
    return (
      <>
        <svg aria-hidden focusable="false"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <defs>
            <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              {/* 1. Légère diffusion du backdrop */}
              <feGaussianBlur in="SourceGraphic" stdDeviation={filterBlur} result="blurred" />
              {/* 2. Carte de déplacement → réfraction */}
              <feImage href={maps.dispUrl} result="dispMap" preserveAspectRatio="none" />
              <feDisplacementMap in="blurred" in2="dispMap" scale={scale}
                xChannelSelector="R" yChannelSelector="G" result="refracted" />
              {/* 3. Carte specular pré-calculée → highlight */}
              <feImage href={maps.specUrl} result="specMap" preserveAspectRatio="none" />
              {/* 4. Composite final */}
              <feBlend in="refracted" in2="specMap" mode="screen" />
            </filter>
          </defs>
        </svg>

        <div ref={ref} className={className} style={{
          ...baseStyle,
          backdropFilter: `url(#${filterId})`,
          WebkitBackdropFilter: `url(#${filterId})`,
          background: tint,
        }}>
          {children}
        </div>
      </>
    );
  }

  // Fallback non-Chrome : blur + gradient specular CSS
  const gradAngle = ((specularAngle - 90) % 360 + 360) % 360;
  const fallbackBg = [
    `linear-gradient(${gradAngle}deg, rgba(255,255,255,${(specularOpacity * 0.5).toFixed(3)}) 0%, transparent 55%)`,
    tint,
  ].join(', ');

  return (
    <div ref={ref} className={className} style={{
      ...baseStyle,
      backdropFilter: `blur(${blur}px) saturate(1.4)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(1.4)`,
      background: fallbackBg,
    }}>
      {children}
    </div>
  );
}
