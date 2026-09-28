'use client';
import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [oculto, setOculto] = useState(false);
  const [fuera, setFuera] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setOculto(true), reduce ? 900 : 5100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!oculto) return;
    const t = setTimeout(() => setFuera(true), 750);
    return () => clearTimeout(t);
  }, [oculto]);

  if (fuera) return null;

  return (
    <div className={`carga${oculto ? ' oculto' : ''}`} onClick={() => setOculto(true)}>
      <div className="carga-escena">
        <svg className="escena-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0A2C25" />
              <stop offset="52%" stopColor="#14524A" />
              <stop offset="78%" stopColor="#7BA07C" />
              <stop offset="100%" stopColor="#E6C579" />
            </linearGradient>
            <radialGradient id="sol" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FBE9B8" />
              <stop offset="45%" stopColor="#E8B85C" />
              <stop offset="100%" stopColor="#E8B85C" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="700" fill="url(#cielo)" />
          <circle className="sol" cx="600" cy="470" r="200" fill="url(#sol)" />
          <path d="M0 470 q80 -40 160 -10 t160 -6 t160 -18 t160 4 t160 -14 t160 6 t160 -8 t80 6 V560 H0 Z" fill="#123D34" opacity=".85" />
          <g className="piramide">
            <path d="M330 560 V520 H364 V480 H398 V440 H432 V400 H466 V360 H500 V320 H534 V296 H666 V320 H700 V360 H734 V400 H768 V440 H802 V480 H836 V520 H870 V560 Z" fill="#0C332B" />
            <rect x="568" y="320" width="64" height="240" fill="#0A2A23" />
            <g stroke="#082019" strokeWidth="3">
              <path d="M568 356 H632" /><path d="M568 396 H632" /><path d="M568 436 H632" /><path d="M568 476 H632" /><path d="M568 516 H632" />
            </g>
            <path d="M666 296 V320 H700 V360 H734 V400 H768 V440 H802 V480 H836 V520 H870 V560" fill="none" stroke="#E6C579" strokeWidth="2.5" opacity=".55" />
          </g>
          <rect x="0" y="588" width="1200" height="112" fill="#0A241E" />
          <rect x="0" y="582" width="1200" height="7" fill="#C9A24B" />
          <g className="palma palma-izq" fill="#0C332B">
            <path d="M120 590 q-8 -70 6 -120 q4 60 -6 120 Z" />
            <path d="M126 474 q-46 -30 -84 -20 q42 -6 84 20 Z" />
            <path d="M126 474 q-30 -44 -18 -84 q6 44 18 84 Z" />
            <path d="M126 474 q40 -34 82 -26 q-40 0 -82 26 Z" />
            <path d="M126 474 q30 -40 66 -40 q-32 8 -66 40 Z" />
          </g>
          <g className="palma palma-der" fill="#0C332B">
            <path d="M1080 590 q8 -70 -6 -120 q-4 60 6 120 Z" />
            <path d="M1074 470 q46 -30 84 -20 q-42 -6 -84 20 Z" />
            <path d="M1074 470 q30 -44 18 -84 q-6 44 -18 84 Z" />
            <path d="M1074 470 q-40 -34 -82 -26 q40 0 82 26 Z" />
          </g>
        </svg>

        <div className="tren">
          <svg viewBox="0 0 560 150" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 30 Q10 30 10 70 L10 108 Q10 120 24 120 L520 120 Q540 120 540 100 L540 50 Q540 30 512 30 Z" fill="#1C5A4C" />
            <rect x="10" y="86" width="530" height="8" fill="#C9A24B" />
            <path d="M40 30 Q10 30 10 70 L10 86 L44 86 L60 30 Z" fill="#164A3E" />
            <g fill="#EDE8D6">
              <path d="M70 44 h40 a6 6 0 0 1 6 6 v22 a6 6 0 0 1 -6 6 h-46 v-28 a6 6 0 0 1 6 -12 Z" />
              <rect x="132" y="44" width="52" height="34" rx="6" />
              <rect x="200" y="44" width="52" height="34" rx="6" />
              <rect x="268" y="44" width="52" height="34" rx="6" />
              <rect x="336" y="44" width="52" height="34" rx="6" />
              <rect x="404" y="44" width="52" height="34" rx="6" />
              <rect x="472" y="44" width="44" height="34" rx="6" />
            </g>
            <circle cx="26" cy="76" r="6" fill="#FBE9B8" />
            <g fill="#0A2A23"><circle cx="120" cy="126" r="16" /><circle cx="230" cy="126" r="16" /><circle cx="410" cy="126" r="16" /><circle cx="490" cy="126" r="16" /></g>
            <g fill="#C9A24B"><circle cx="120" cy="126" r="5" /><circle cx="230" cy="126" r="5" /><circle cx="410" cy="126" r="5" /><circle cx="490" cy="126" r="5" /></g>
          </svg>
        </div>
      </div>

      <div className="carga-txt">
        <div className="carga-logo">TREN <span>MAYA</span></div>
        <div className="carga-sub">Sabores que acompañan tu camino</div>
        <div className="carga-barra"><i /></div>
        <div className="carga-skip">Preparando tu experiencia — toca para entrar</div>
      </div>
    </div>
  );
}
