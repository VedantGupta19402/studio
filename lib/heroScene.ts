// lib/heroScene.ts — the Opera particle world (raw three.js, own shaders)
// Mechanism family verified from emotion-agency bundle: GPGPU-style points cloud,
// per-particle phase attribute, scroll-driven morph between generated target shapes,
// cursor repulsion, energy bursts. Implementation is ours; assets are ours.
import * as THREE from "three";

export type HeroSceneHandle = {
  setProgress: (p: number) => void; // 0..1 across the whole pinned journey
  setMorph: (m: number) => void; // in shape units 0..5 (scene-locked)
  setPointer: (nx: number, ny: number) => void; // NDC -1..1
  burst: () => void; // trigger implosion flash envelope
  resize: (w: number, h: number) => void;
  dispose: () => void;
  renderStatic: () => void; // reduced-motion: single frame
};

const SHAPE_COUNT = 6; // swirl, egg, cube, sphere, tree, ring

// seeded PRNG so layouts are stable (spec Task 3)
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shapeSwirl(rand: () => number): THREE.Vector3 {
  // broken torus band — the opening "swirl"
  const t = rand() * Math.PI * 1.55 - Math.PI * 0.28; // gap in the ring
  const R = 1.15;
  const r = 0.06 + rand() * 0.14;
  const a = t + rand() * 0.6 - 0.3;
  return new THREE.Vector3(
    Math.cos(a) * (R + (rand() - 0.5) * r),
    Math.sin(a) * (R + (rand() - 0.5) * r) * 0.92,
    (rand() - 0.5) * 0.5,
  );
}

function shapeEgg(rand: () => number): THREE.Vector3 {
  // vertical ellipsoid, slight top taper
  const u = rand() * Math.PI * 2;
  const v = Math.acos(2 * rand() - 1);
  const sy = 1.05 - 0.18 * Math.sin(v); // taper top
  return new THREE.Vector3(
    0.72 * Math.sin(v) * Math.cos(u),
    sy * Math.cos(v) * 1.0,
    0.72 * Math.sin(v) * Math.sin(u),
  );
}

function shapeCube(rand: () => number): THREE.Vector3 {
  // rounded cube ≈ mix of cube surface and sphere
  const face = Math.floor(rand() * 6);
  const a = rand() * 1.8 - 0.9;
  const b = rand() * 1.8 - 0.9;
  const p = new THREE.Vector3(a, b, face < 3 ? 0.9 : -0.9);
  if (face % 3 === 1) p.set(a, face === 1 ? 0.9 : -0.9, b);
  if (face % 3 === 2) p.set(face === 2 ? 0.9 : -0.9, a, b);
  const sph = p.clone().normalize().multiplyScalar(0.98);
  return p.lerp(sph, 0.32);
}

function shapeSphere(rand: () => number): THREE.Vector3 {
  const u = rand() * Math.PI * 2;
  const v = Math.acos(2 * rand() - 1);
  const r = 1.02 + (rand() - 0.5) * 0.06;
  return new THREE.Vector3(
    r * Math.sin(v) * Math.cos(u),
    r * Math.cos(v),
    r * Math.sin(v) * Math.sin(u),
  );
}

function heartXZ(rand: () => number): [number, number] {
  // 70% outline band + 30% interior fill — defined heart silhouette
  if (rand() < 0.7) {
    const t = rand() * Math.PI * 2;
    const j = 0.94 + rand() * 0.12;
    const hx = 1.05 * Math.pow(Math.sin(t), 3) * j;
    const hy = -(0.86 * Math.cos(t) - 0.33 * Math.cos(2 * t) - 0.13 * Math.cos(3 * t) - 0.065 * Math.cos(4 * t)) * j;
    return [hx, hy];
  }
  for (let i = 0; i < 40; i++) {
    const x = rand() * 2.2 - 1.1;
    const y = rand() * 2.2 - 1.3;
    const q =
      Math.pow(x * x + y * y - 0.9, 3) - x * x * Math.pow(y, 3) - 0.1125 * Math.pow(y, 3) * x * x;
    if (q < 0) return [x, y];
  }
  return [0, 0];
}

function shapeTree(rand: () => number): THREE.Vector3 {
  // heart canopy sitting on a sparse trunk — the "heart-tree"
  if (rand() < 0.22) {
    // trunk + branches
    const t = rand();
    if (t < 0.75) {
      return new THREE.Vector3((rand() - 0.5) * 0.1, -1.35 + t * 1.35, (rand() - 0.5) * 0.1);
    }
    // two branches
    const side = rand() < 0.5 ? -1 : 1;
    const s = rand();
    return new THREE.Vector3(side * (0.15 + s * 0.5), -0.25 + s * 0.55, (rand() - 0.5) * 0.08);
  }
  const [hx, hy] = heartXZ(rand);
  return new THREE.Vector3(
    hx * 1.0,
    hy * 1.0 + 0.55, // canopy center above trunk
    (rand() - 0.5) * 0.5,
  );
}

function shapeRing(rand: () => number): THREE.Vector3 {
  const t = rand() * Math.PI * 2;
  const R = 1.08;
  const r = 0.1 + rand() * 0.12;
  const a = t + (rand() - 0.5) * 0.25;
  return new THREE.Vector3(
    Math.cos(a) * (R + (rand() - 0.5) * r),
    Math.sin(a) * (R + (rand() - 0.5) * r) * 0.5 + 0.1, // squashed, floating
    (rand() - 0.5) * 0.35,
  );
}

const SHAPE_FNS = [shapeSwirl, shapeEgg, shapeCube, shapeSphere, shapeTree, shapeRing];

const VERT = /* glsl */ `
uniform float uTime;
uniform float uMorph;      // 0..SHAPE-1 continuous
uniform vec3 uPointer;     // world-space pointer
uniform float uBurst;      // 0..1 implosion
uniform float uPixelRatio;
attribute vec3 aT0; attribute vec3 aT1; attribute vec3 aT2;
attribute vec3 aT3; attribute vec3 aT4; attribute vec3 aT5;
attribute float aPhase;
attribute float aSize;
varying float vRadial;
varying float vPhase;

vec3 target(float i) {
  if (i < 0.5) return aT0;
  if (i < 1.5) return aT1;
  if (i < 2.5) return aT2;
  if (i < 3.5) return aT3;
  if (i < 4.5) return aT4;
  return aT5;
}

void main() {
  float seg = clamp(uMorph, 0.0, 5.0);
  float ia = floor(seg);
  float ib = min(ia + 1.0, 5.0);
  // per-particle staggered morph — organic streams, not uniform lerp
  float f = fract(seg);
  float fs = smoothstep(0.0, 1.0, clamp(f * 1.35 - aPhase * 0.35, 0.0, 1.0));
  vec3 pos = mix(target(ia), target(ib), fs);

  // idle breath + drift
  float t = uTime;
  pos += 0.028 * vec3(
    sin(t * 0.62 + aPhase * 6.2831),
    cos(t * 0.53 + aPhase * 4.71),
    sin(t * 0.47 + aPhase * 3.14)
  );

  // pointer repulsion (damped, Emotion-style)
  vec3 away = pos - uPointer;
  float d = length(away);
  pos += normalize(away + 1e-4) * exp(-d * 3.2) * 0.42;

  // implosion: contract hard
  pos *= 1.0 - 0.88 * uBurst;

  // slow world swirl of the whole cloud
  float ang = t * 0.1 + uMorph * 0.4;
  float c = cos(ang), s = sin(ang);
  pos.xz = mat2(c, -s, s, c) * pos.xz;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float breathe = 0.85 + 0.3 * sin(t * 0.9 + aPhase * 6.2831);
  gl_PointSize = aSize * breathe * uPixelRatio * (8.5 / max(0.1, -mv.z));
  gl_Position = projectionMatrix * mv;

  vRadial = length(pos) / 1.6;
  vPhase = aPhase;
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying float vRadial;
varying float vPhase;
uniform float uOpacity;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;
  float core = smoothstep(0.5, 0.0, r);
  // white-hot lavender core → violet → deep accent edge
  vec3 cCore = vec3(0.965, 0.937, 1.0);
  vec3 cMid  = vec3(0.710, 0.482, 1.0); // #B57BFF
  vec3 cEdge = vec3(0.565, 0.278, 1.0); // #9047FF
  float m = clamp(vRadial * 1.15, 0.0, 1.0);
  vec3 col = mix(cCore, cMid, smoothstep(0.05, 0.5, m));
  col = mix(col, cEdge, smoothstep(0.45, 1.0, m));
  float a = core * (0.55 + 0.45 * (1.0 - vPhase * 0.5)) * uOpacity;
  gl_FragColor = vec4(col, a);
}
`;

const SKY_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// dark re-grade of the dusk world: ink top → deep violet horizon glow
const SKY_FRAG = /* glsl */ `
varying vec2 vUv;
void main() {
  vec3 top = vec3(0.059, 0.051, 0.102);   // #0F0D1A
  vec3 mid = vec3(0.10, 0.075, 0.20);
  vec3 horizon = vec3(0.23, 0.13, 0.42);  // violet glow line
  float h = smoothstep(0.0, 1.0, vUv.y);
  vec3 col = mix(horizon, top, pow(h, 0.72));
  col = mix(mid, col, smoothstep(0.12, 0.55, h));
  gl_FragColor = vec4(col, 1.0);
}
`;

function ridgeShape(seed: number, base: number, amp: number, w: number): THREE.Shape {
  const rand = mulberry32(seed);
  const s = new THREE.Shape();
  s.moveTo(-w, -3);
  let x = -w;
  let y = base;
  while (x < w) {
    s.lineTo(x, y);
    x += 0.18 + rand() * 0.3;
    y = base + (rand() - 0.35) * amp;
  }
  s.lineTo(w, -3);
  s.closePath();
  return s;
}

export function createHeroScene(
  canvas: HTMLCanvasElement,
  opts: { count?: number; reducedMotion?: boolean } = {},
): HeroSceneHandle {
  const reduced = opts.reducedMotion ?? false;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    60,
  );
  camera.position.set(0, 0.15, 4.4);

  // sky gradient plane
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 40),
    new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, depthWrite: false }),
  );
  sky.position.set(0, 0.2, -10);
  sky.renderOrder = -3;
  scene.add(sky);

  // particles
  const count = opts.count ?? 16000;
  const rand = mulberry32(20261104);
  const geo = new THREE.BufferGeometry();
  const shapes: Float32Array[] = SHAPE_FNS.map((fn) => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = fn(rand);
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    return arr;
  });
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phases[i] = rand();
    sizes[i] = 0.7 + rand() * 1.7;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(shapes[0].slice(), 3));
  for (let s = 0; s < SHAPE_COUNT; s++) geo.setAttribute(`aT${s}`, new THREE.BufferAttribute(shapes[s], 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uPointer: { value: new THREE.Vector3(99, 99, 99) },
    uBurst: { value: 0 },
    uPixelRatio: { value: dpr },
    uOpacity: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.position.set(0.55, 0.55, 0); // center-right of frame (Emotion composition)
  points.renderOrder = 1;
  scene.add(points);

  // water reflection — mirrored cloud, dimmed
  const reflMat = mat.clone();
  reflMat.uniforms = { ...uniforms, uOpacity: { value: 0.16 } };
  const reflection = new THREE.Points(geo, reflMat);
  reflection.position.set(0.55, -2.24, 0);
  reflection.scale.y = -0.42;
  reflection.renderOrder = 0;
  scene.add(reflection);

  // water plane
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: SKY_VERT,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vec3 top = vec3(0.16, 0.10, 0.30);   // violet sheen at waterline
        vec3 bottom = vec3(0.031, 0.027, 0.06); // #080710
        vec3 col = mix(top, bottom, pow(vUv.y, 0.8));
        gl_FragColor = vec4(col, 0.88 * smoothstep(0.0, 0.35, vUv.y) + 0.12);
      }
    `,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(70, 5), waterMat);
  water.position.set(0, -1.62, -0.5);
  water.renderOrder = -1;
  scene.add(water);

  // ridgelines (3 parallax layers, dark silhouettes)
  const ridgeColors = [0x1d1533, 0x140f24, 0x0b0916];
  const ridges: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(
      new THREE.ShapeGeometry(ridgeShape(1000 + i * 77, -1.2 + i * 0.28, 0.9 - i * 0.18, 24)),
      new THREE.MeshBasicMaterial({ color: ridgeColors[i] }),
    );
    m.position.set(0, -1.1 - i * 0.12, -3.5 + i * 1.4);
    ridges.push(m);
    m.renderOrder = -2;
    scene.add(m);
  }

  // dust motes
  const dustGeo = new THREE.BufferGeometry();
  const dustN = 130;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 9;
    dustPos[i * 3 + 1] = (rand() - 0.5) * 5;
    dustPos[i * 3 + 2] = (rand() - 0.5) * 3;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xb57bff, size: 0.02, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  scene.add(dust);

  // state
  let progress = 0;
  let morphTargetUnits = 0;
  let pointerTarget = new THREE.Vector3(99, 99, 99);
  let burstT = 1; // >=1 = idle
  let raf = 0;
  let morphUnitsDirty = false;
  let segPrev = 0;
  const clock = new THREE.Clock();

  const tick = () => {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    // smooth morph toward target (scene-locked units win when set)
    const targetMorph = morphUnitsDirty ? morphTargetUnits : progress * (SHAPE_COUNT - 1);
    morphUnitsDirty = false;
    uniforms.uMorph.value += (targetMorph - uniforms.uMorph.value) * 0.075;
    // damp pointer
    (uniforms.uPointer.value as THREE.Vector3).lerp(pointerTarget, 0.08);
    // burst envelope
    const segNow = Math.floor(uniforms.uMorph.value + 0.001);
    if (segNow !== segPrev) {
      segPrev = segNow;
      if (burstT >= 1) burstT = 0; // implosion on integer shape crossing
    }
    if (burstT < 1) {
      burstT = Math.min(1, burstT + 0.016 * 2.2);
      const env = Math.sin(Math.min(1, burstT) * Math.PI);
      uniforms.uBurst.value = env;
    } else uniforms.uBurst.value = 0;

    camera.position.y = 0.15 + Math.sin(t * 0.18) * 0.06;
    camera.position.z = 4.4 - progress * 0.5;
    camera.lookAt(0.2, 0.35, 0);
    // ridgeline parallax
    ridges.forEach((r, i) => {
      r.position.x = Math.sin(progress * Math.PI * 2 + i) * (0.25 + i * 0.14);
    });
    // dust drift
    const dp = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dustN; i++) {
      let y = dp.getY(i) + 0.0016 + (i % 5) * 0.0002;
      if (y > 2.6) y = -2.6;
      dp.setY(i, y);
    }
    dp.needsUpdate = true;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  const resize = (w: number, h: number) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // portrait viewports: bring the mark toward center (spec §5 mobile)
    const cx = camera.aspect < 0.9 ? 0.15 : 0.55;
    points.position.x = cx;
    reflection.position.x = cx;
  };

  if (reduced) {
    // single static frame
    uniforms.uTime.value = 4.2;
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(tick);
  }

  return {
    setProgress(p) {
      progress = Math.max(0, Math.min(1, p));
    },
    setMorph(m) {
      morphTargetUnits = Math.max(0, Math.min(SHAPE_COUNT - 1, m));
      morphUnitsDirty = true;
    },
    setPointer(nx, ny) {
      // unproject NDC at cloud plane
      const v = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
      const dir = v.sub(camera.position).normalize();
      const dist = (0.55 - camera.position.z) / dir.z;
      pointerTarget = camera.position.clone().add(dir.multiplyScalar(-dist));
      pointerTarget.sub(points.position);
    },
    burst() {
      burstT = 0;
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      geo.dispose();
      mat.dispose();
      reflMat.dispose();
      renderer.dispose();
    },
    renderStatic() {
      renderer.render(scene, camera);
    },
  };
}
