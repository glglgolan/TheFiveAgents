// Loads Google Fonts (by family + the weights layers use) and blocks rendering until they are ready,
// so measureText-based layout is deterministic in Studio and in headless renders.
import React, { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import type { Layer } from '../lib/types';

async function loadFamily(family: string, weights: number[], italic: boolean) {
  const fam = family.trim().replace(/ /g, '+');
  const ws = [...new Set(weights)].sort((a, b) => a - b);
  const urls = [
    italic
      ? `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@${ws.map((w) => `0,${w}`).concat(ws.map((w) => `1,${w}`)).join(';')}&display=block`
      : `https://fonts.googleapis.com/css2?family=${fam}:wght@${ws.join(';')}&display=block`,
    `https://fonts.googleapis.com/css2?family=${fam}&display=block`, // fallback when a weight doesn't exist
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const css = await r.text();
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      await Promise.all(ws.map((w) => document.fonts.load(`${w} 100px "${family}"`)));
      return;
    } catch {
      /* try next */
    }
  }
  console.warn(`[kinetic-typography] font "${family}" not loaded — falling back to serif`);
}

export const FontGate: React.FC<{ layers: Layer[]; children: React.ReactNode }> = ({ layers, children }) => {
  const [handle] = useState(() => delayRender('loading fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const byFamily = new Map<string, { weights: number[]; italic: boolean }>();
    for (const l of layers) {
      if (l.engine === 'three' || l.type === 'draw') continue;
      const e = byFamily.get(l.font.family) || { weights: [], italic: false };
      e.weights.push(l.font.weight ?? 400);
      e.italic = e.italic || !!l.font.italic;
      byFamily.set(l.font.family, e);
    }
    Promise.all([...byFamily].map(([f, e]) => loadFamily(f, e.weights, e.italic)))
      .finally(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle, layers]);
  return ready ? <>{children}</> : null;
};
