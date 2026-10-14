// three.js renderer: real extruded / glass letter meshes with lighting. Same animation core as CssPass;
// 1 world unit = 1 px at z=0, so x/y/z keyframes mean the same thing in both engines.
import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { evaluateLayer } from '../lib/anim';
import type { Layer } from '../lib/types';

declare const require: { context: (dir: string, deep: boolean, re: RegExp) => { keys(): string[]; (k: string): unknown } };
const loader = new FontLoader();
// every <skill>/fonts/<key>.typeface.json is auto-registered as three_font "<key>" (add more: scripts/make_3d_font.sh)
const ctx3d = require.context('../../../../fonts', false, /\.typeface\.json$/);
const FONTS: Record<string, Font> = Object.fromEntries(
  ctx3d.keys().map((k) => [k.replace(/^.*\//, '').replace('.typeface.json', ''), loader.parse(ctx3d(k) as never)]),
);
const DEFAULT_3D = 'playfair_bold';
const fontFor = (l: Layer) => FONTS[l.font.three_font || DEFAULT_3D] || FONTS[DEFAULT_3D] || Object.values(FONTS)[0];

function measure3D(l: Layer) {
  const font = fontFor(l);
  const data = (font as unknown as { data: { resolution: number; glyphs: Record<string, { ha: number }> } }).data;
  const s = l.font.size / data.resolution;
  return (str: string) => Array.from(str).reduce((a, c) => a + ((data.glyphs[c]?.ha ?? data.resolution * 0.3) * s), 0);
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function glyphGeometry(l: Layer, ch: string) {
  const key = `${l.font.three_font}|${l.font.size}|${l.depth}|${ch}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new TextGeometry(ch, {
      font: fontFor(l), size: l.font.size, depth: l.depth ?? 40, curveSegments: 8,
      bevelEnabled: true, bevelThickness: Math.max(1, (l.depth ?? 40) * 0.12), bevelSize: l.font.size * 0.012, bevelSegments: 4,
    });
    g.center();
    geoCache.set(key, g);
  }
  return g;
}

const Letters: React.FC<{ layer: Layer; time: number; w: number; h: number; plane: 'back' | 'front' }> = ({ layer, time, w, h, plane }) => {
  const st = evaluateLayer(layer, time, w, h, measure3D(layer));
  const material = useMemo(() => {
    const color = new THREE.Color(layer.color || '#B5523B');
    return layer.material === 'glass'
      ? new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, metalness: 0, transmission: 0.6, thickness: layer.depth ?? 40,
          clearcoat: 1, transparent: true, opacity: 0.55 })
      : new THREE.MeshPhysicalMaterial({ color, roughness: 0.38, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.4,
          transparent: true, envMapIntensity: 0.9 });
  }, [layer.color, layer.material, layer.depth]);
  if (!st) return null;
  const d2r = Math.PI / 180;
  return (
    <group position={[st.ax - w / 2, h / 2 - st.ay, 0]} rotation={[st.lrx * d2r, st.lry * d2r, st.lrz * d2r]} scale={st.lscale}>
      {st.units.map((u, i) => {
        if (u.plane !== plane || !u.char.trim()) return null;
        const m = material.clone();
        m.opacity = u.opacity * st.lopacity * (1 - Math.min(0.6, u.blur / 30)); // no per-mesh blur in GL: fade instead
        return (
          <mesh key={i} castShadow geometry={glyphGeometry(layer, u.char)} material={m}
            position={[u.x, -u.y, u.z]} rotation={[-u.rx * d2r, u.ry * d2r, -u.rz * d2r]} scale={u.scale} />
        );
      })}
    </group>
  );
};

/** Physically-based realism: studio-room reflections on every letter (PMREM env map). */
const Environment: React.FC = () => {
  const { gl, scene } = useThree();
  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => { env.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
};

export const ThreePass: React.FC<{ layers: Layer[]; plane: 'back' | 'front'; time: number; w: number; h: number }> = ({ layers, plane, time, w, h }) => {
  const three = layers.filter((l) => l.engine === 'three' && time >= l.from && time <= l.to);
  if (!three.length) return null;
  const fov = 30;
  const dist = h / 2 / Math.tan((fov / 2) * (Math.PI / 180));
  return (
    <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} shadows
      camera={{ fov, position: [0, 0, dist], near: 1, far: dist * 4 }} gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      {three.some((l) => l.env !== false) && <Environment />}
      <ambientLight intensity={0.25} />
      <directionalLight position={[-w * 0.8, h * 0.7, dist * 0.6]} intensity={2.2} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004}
        shadow-camera-left={-w} shadow-camera-right={w} shadow-camera-top={h} shadow-camera-bottom={-h}
        shadow-camera-near={1} shadow-camera-far={dist * 4} shadow-radius={8} />
      <directionalLight position={[w, -h * 0.3, dist * 0.5]} intensity={0.3} />
      {three.some((l) => l.shadow_catcher) && (
        <mesh position={[0, 0, -160]} receiveShadow>
          <planeGeometry args={[w * 3, h * 3]} />
          <shadowMaterial opacity={0.22} />
        </mesh>
      )}
      {three.map((l) => <Letters key={l.id} layer={l} time={time} w={w} h={h} plane={plane} />)}
    </ThreeCanvas>
  );
};
