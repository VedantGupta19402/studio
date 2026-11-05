// lib/heroScene.ts — GPGPU particle world, faithful port of the reference mechanism.
// Physics constants + sim/render math extracted from the reference site's own bundle
// (spring-to-target, curl flow, neighbor repulsion, viscosity, mouse-velocity fluid
// impulse, scatter meter, glow accumulation, lit-sphere sprites). Our palette — which
// IS the reference violet family — our Ø mark, our dark theme.
import * as THREE from "three";

export type HeroSceneHandle = {
  setScene: (idx: number) => void; // lock statement scene -> shape (burst + embers)
  setProgress: (p: number) => void; // 0..1 journey (camera, Target 2)
  setPointer: (nx: number, ny: number) => void; // NDC -1..1
  resize: (w: number, h: number) => void;
  dispose: () => void;
};

/* ---------- constants (reference values, verbatim) ---------- */
const SPRING_STIFFNESS = 0.6;
const VISCOSITY = 0.15;
const VELOCITY_DAMPING = 0.93;
const FLOW_STRENGTH = 0.00008;
const FLOW_SCALE = 0.9;
const FLOW_SPEED = 0.5;
const REPULSION_STRENGTH = 0.005;
const REPULSION_RADIUS = 0.0008;
const SCATTER_DURATION = 0.35;
const RETURN_SHARPNESS = 4;
const PULSE_AMPLITUDE = 0.3;
const PARTICLE_SIZE = 0.48;
const SHAPE_SCALE = 5;
const WATER_LEVEL = 0.22;

/* orbit camera (reference algorithm verbatim; constants adapted to our world) */
const CAMERA_POSITION: [number, number, number] = [5.44, 3.4, 34];
const ORBIT_RADIUS = Math.hypot(CAMERA_POSITION[0], CAMERA_POSITION[2]);
const ORBIT_INITIAL_ANGLE = Math.atan2(CAMERA_POSITION[0], CAMERA_POSITION[2]);
const ORBIT_Y = CAMERA_POSITION[1];
const ORBIT_CLOSE_FACTOR = 0.6;
const LOOKAT_OFFSETS: [number, number, number][] = [
  [0, -1.1, 0], [0, 2.5, 2.5], [0, 0.6, 2], [0, 1.6, 1.6], [0, 0, 0],
];
const SHAPE_BREAKPOINTS = [0.18, 0.4, 0.65, 0.87];
const SHAPE_ROTATIONS = [0, 0, 0, -(77 * Math.PI) / 180, 0]; // heart faces camera at its orbit azimuth
const easeSmooth = (x: number) => x * x * (3 - 2 * x);

/* energy heartbeat (reference: BURST_SPEED 0.5, fire window 0.8-0.9, SPAWN_BATCH 1600,
   LIFETIME 2.3, pulse decay x0.05/s, centerGlowPulse = 1 + pulse * 0.3) */
const BURST_SPEED = 0.5;
const HEARTBEAT_WINDOW: [number, number] = [0.8, 0.9];
const PULSE_AMPLITUDE_GLOW = 0.3;
const PULSE_DECAY = 0.05;

function sceneIndexForProgress(p: number): number {
  for (let i = SHAPE_BREAKPOINTS.length - 1; i >= 0; i--) {
    if (p > SHAPE_BREAKPOINTS[i]) return i + 1;
  }
  return 0;
}

const PALETTE = {
  PRIMARY: new THREE.Color("#9047ff"),
  SECONDARY: new THREE.Color("#8844ee"),
  TERTIARY: new THREE.Color("#cc66ff"),
  DEEP: new THREE.Color("#6622cc"),
  WHITE: new THREE.Color("#e7f5f5"),
};
const CENTER_GLOW_COLOR = new THREE.Color(14006783); // #D5A8FF
const RIM_COLOR_COOL = new THREE.Color(6740479); // #66CCFF
const RIM_COLOR_WARM = new THREE.Color(15892735); // #F2A7FF
const SPEC_COLOR = new THREE.Color(12556799); // #BF7FFF
const GLOW_COLOR = new THREE.Color(10902015); // #A699FF
const TINT_COLOR = new THREE.Color(15915519); // #F2CFFF
const ENERGY_COLOR = new THREE.Color(4197721); // #401F99
const LIGHT_DIR = new THREE.Vector3(0.5, 0.8, 0.6).normalize();

/* ---------- shape sampling (SHAPE_SCALE proportions) ---------- */
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

function sampleCube(n: number, rand: () => number): Float32Array {
  const s = 0.62;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const face = Math.floor(rand() * 6);
    const a = rand() * 2 * s - s;
    const b = rand() * 2 * s - s;
    const v = new THREE.Vector3(a, b, face < 3 ? s : -s);
    if (face % 3 === 1) v.set(a, face === 1 ? s : -s, b);
    if (face % 3 === 2) v.set(face === 2 ? s : -s, a, b);
    v.lerp(v.clone().normalize().multiplyScalar(s * 1.12), 0.22);
    out.set([v.x, v.y, v.z], i * 3);
  }
  return out;
}

function sampleSphere(n: number, rand: () => number): Float32Array {
  const r = 0.62;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = rand() * Math.PI * 2;
    const v = Math.acos(2 * rand() - 1);
    const rr = r * (0.99 + rand() * 0.02);
    out.set([rr * Math.sin(v) * Math.cos(u), rr * Math.cos(v), rr * Math.sin(v) * Math.sin(u)], i * 3);
  }
  return out;
}

function sampleHeart(n: number, rand: () => number): Float32Array {
  // reference "heart-tree": wide heart canopy (parametric curve band + light fill)
  // on a sparse trunk, facing +Z so it reads frontal during its scene
  const S = 0.78;
  const out = new Float32Array(n * 3);
  const heartPt = (t: number): [number, number] => {
    const x = 16 * Math.pow(Math.sin(t), 3) / 17;
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17;
    return [x, y];
  };
  for (let i = 0; i < n; i++) {
    const r = rand();
    if (r < 0.16) {
      // trunk + branches
      const t = rand();
      if (t < 0.78) {
        out.set([(rand() - 0.5) * 0.06, -0.62 + t * 0.5, (rand() - 0.5) * 0.06], i * 3);
      } else {
        const side = rand() < 0.5 ? -1 : 1;
        const s2 = rand();
        out.set([side * (0.1 + s2 * 0.34), -0.28 + s2 * 0.3, (rand() - 0.5) * 0.05], i * 3);
      }
      continue;
    }
    const t = rand() * Math.PI * 2;
    const [hx, hy] = heartPt(t);
    if (r < 0.68) {
      // canopy outline band (two-lobe bumps read clearly)
      const j = 0.96 + rand() * 0.08;
      out.set([hx * S * j, hy * S * j + 0.42, (rand() - 0.5) * 0.18], i * 3);
    } else {
      // light interior fill
      const f = Math.sqrt(rand());
      const [fx, fy] = heartPt(rand() * Math.PI * 2);
      out.set([fx * S * f * 0.92, fy * S * f * 0.92 + 0.42, (rand() - 0.5) * 0.34], i * 3);
    }
  }
  return out;
}

function sampleTorus(n: number, rand: () => number): Float32Array {
  const R = 0.9;
  const r = 0.3;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = rand() * Math.PI * 2;
    const v = rand() * Math.PI * 2;
    const rr = r * (0.94 + rand() * 0.12);
    out.set(
      [(R + rr * Math.cos(v)) * Math.cos(u), (R + rr * Math.cos(v)) * Math.sin(u) * 0.98, rr * Math.sin(v)],
      i * 3,
    );
  }
  return out;
}

/** Ø mark — procedural ring + slash (deterministic, no canvas/fonts) */
function sampleGlyph(n: number, rand: () => number): Float32Array {
  const out = new Float32Array(n * 3);
  const R = 0.5;
  const band = 0.1;
  const slashTilt = (68 * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    if (rand() < 0.32) {
      // slash
      const t = rand() * 2 - 1;
      const x = Math.sin(slashTilt) * t * R * 1.15;
      const y = Math.cos(slashTilt) * t * R * 1.15;
      out.set([x + (rand() - 0.5) * 0.05, y + (rand() - 0.5) * 0.05, (rand() - 0.5) * 0.16], i * 3);
    } else {
      // ring band (slight thickness variation for organic density)
      const t = rand() * Math.PI * 2;
      const rr = R + (rand() - 0.5) * band * 2 * (0.7 + rand() * 0.6);
      out.set([Math.cos(t) * rr, Math.sin(t) * rr, (rand() - 0.5) * 0.34], i * 3);
    }
  }
  return out;
}

/* ---------- GPGPU sim (two passes: velocity, then position — no MRT needed) ---------- */
const SIM_VERT = `out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const SIM_COMMON = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform float time;
uniform float delta;
uniform float springStiffness;
uniform float damping;
uniform float viscosity;
uniform float flowStrength;
uniform float flowScale;
uniform float flowSpeed;
uniform float returnSharpness;
uniform float scatterDuration;
uniform float pulseAmplitude;
uniform float burstIntensity;
uniform vec2 uMouseUV;
uniform vec2 uMouseVel;
uniform float uAspect;
uniform float uImpulseScale;
uniform mat4 uMVP;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uInteractForce;
uniform float repulsionStrength;
uniform float repulsionRadius;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform sampler2D textureTarget;
uvec2 _pcg3d16(uvec3 p) {
  uvec3 v = p * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v.x += v.y * v.z; v.y += v.z * v.x;
  return v.xy;
}
vec3 _gradient3d(uint hash) {
  vec3 g = vec3(uvec3(hash) & uvec3(0x80000u, 0x40000u, 0x20000u));
  return g * (1.0 / vec3(0x40000, 0x20000, 0x10000)) - 1.0;
}
vec3 BitangentNoise3D(vec3 p) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(p + dot(p, C.yyy));
  vec3 x0 = p - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, i1);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = i + 32768.5;
  uvec2 hash0 = _pcg3d16(uvec3(i));
  uvec2 hash1 = _pcg3d16(uvec3(i + i1));
  uvec2 hash2 = _pcg3d16(uvec3(i + i2));
  uvec2 hash3 = _pcg3d16(uvec3(i + 1.0));
  vec3 p00 = _gradient3d(hash0.x); vec3 p01 = _gradient3d(hash0.y);
  vec3 p10 = _gradient3d(hash1.x); vec3 p11 = _gradient3d(hash1.y);
  vec3 p20 = _gradient3d(hash2.x); vec3 p21 = _gradient3d(hash2.y);
  vec3 p30 = _gradient3d(hash3.x); vec3 p31 = _gradient3d(hash3.y);
  vec4 m = clamp(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0, 1.0);
  vec4 mt = m * m;
  vec4 m4 = mt * mt;
  mt = mt * m;
  vec4 pdotx = vec4(dot(p00, x0), dot(p10, x1), dot(p20, x2), dot(p30, x3));
  vec4 temp = mt * pdotx;
  vec3 gradient0 = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
  gradient0 += m4.x * p00 + m4.y * p10 + m4.z * p20 + m4.w * p30;
  pdotx = vec4(dot(p01, x0), dot(p11, x1), dot(p21, x2), dot(p31, x3));
  temp = mt * pdotx;
  vec3 gradient1 = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
  gradient1 += m4.x * p01 + m4.y * p11 + m4.z * p21 + m4.w * p31;
  return cross(gradient0, gradient1) * 3918.76;
}
`;

// PASS 1 — velocity + scatter
const SIM_VEL_FRAG = SIM_COMMON + /* glsl */ `
layout(location = 0) out vec4 outVelocity;
void main() {
  vec2 uv = vUv;
  vec4 posData = texture(texturePosition, uv);
  vec4 velData = texture(textureVelocity, uv);
  vec3 pos = posData.xyz;
  vec3 vel = velData.xyz;
  vec3 target = texture(textureTarget, uv).xyz;

  float pulse = 1.0 + burstIntensity * pulseAmplitude * 0.15;
  target *= pulse;
  vel += normalize(pos + vec3(0.001)) * burstIntensity * pulseAmplitude * 0.08;

  vec4 clipPos = uMVP * vec4(pos, 1.0);
  float interactMask = 0.0;
  if (clipPos.w > 0.0) {
    vec2 screenUV = clamp((clipPos.xy / clipPos.w) * 0.5 + 0.5, 0.001, 0.999);
    vec2 d = screenUV - uMouseUV;
    d.x *= uAspect;
    interactMask = 1.0 - smoothstep(0.05, 0.12, length(d));
  }
  vec2 fluidVelXY = vec2(uMouseVel.x * uAspect, uMouseVel.y) * 50.0 * uImpulseScale * interactMask;
  float rawLen = length(fluidVelXY);
  fluidVelXY *= min(1.0, 1.5 / max(rawLen, 1e-4));
  float fluidMag = min(rawLen, 1.5) * uInteractForce;

  vec3 fluidDisp = uCamRight * fluidVelXY.x + uCamUp * fluidVelXY.y;
  vel += fluidDisp * 0.07 * uInteractForce;

  vec3 toTarget = target - pos;
  float dist = length(toTarget);
  float scatter = velData.w;
  float threshold = 1.0 / max(returnSharpness, 1.0);
  float holdFactor = smoothstep(0.0, threshold, scatter);
  float invFluidStrength = max(0.3, 1.0 - fluidMag * 0.8);
  float springReduction = invFluidStrength * (1.0 - holdFactor * 0.6);
  springReduction = max(springReduction, 0.2);
  float distAmp = mix(1.0 + dist * 0.5, 1.0, scatter);
  float springK = springStiffness * distAmp * springReduction;
  vel += toTarget * springK * delta;

  vec3 flowPos = pos * flowScale + vec3(0.0, 0.0, time * flowSpeed);
  float mouseFlowBoost = 1.0 + fluidMag * 2.6;
  vel += BitangentNoise3D(flowPos) * flowStrength * mouseFlowBoost;

  ivec2 texSize = textureSize(texturePosition, 0);
  vec2 repUvStep = vec2(1.0 / float(texSize.x), 1.0 / float(texSize.y)) * 2.0;
  vec3 repulsionForce = vec3(0.0);
  for (int i = 0; i < 2; i++) {
    vec2 off = i == 0 ? vec2(1.0, 1.0) : vec2(-1.0, -1.0);
    vec3 neighborPos = texture(texturePosition, uv + off * repUvStep).xyz;
    vec3 diff = pos - neighborPos;
    float neighborDist = length(diff);
    if (neighborDist > 0.001 && neighborDist < repulsionRadius * 10.0) {
      float repulse = 1.0 / (neighborDist * neighborDist + 0.1);
      repulsionForce += normalize(diff) * repulse * repulsionStrength;
    }
  }
  vel += repulsionForce;

  float uvStep = 1.0 / float(texSize.x);
  vec3 velSum = vel;
  velSum += texture(textureVelocity, uv + vec2(uvStep, uvStep)).xyz;
  velSum += texture(textureVelocity, uv + vec2(-uvStep, -uvStep)).xyz;
  vel = mix(vel, velSum / 3.0, viscosity);
  vel *= damping;
  float vMag = length(vel);
  vel *= min(1.0, 6.0 / max(vMag, 1e-4));

  float targetScatter = clamp(fluidMag * 2.5, 0.0, 1.0);
  float newScatter;
  if (targetScatter > scatter) newScatter = scatter + (targetScatter - scatter) * min(1.0, delta * 15.0);
  else newScatter = scatter - delta / max(scatterDuration, 0.01);
  outVelocity = vec4(vel, clamp(newScatter, 0.0, 1.0));
}`;

// PASS 2 — position + glow (uses the NEW velocity)
const SIM_POS_FRAG = SIM_COMMON + /* glsl */ `
layout(location = 0) out vec4 outPosition;
void main() {
  vec2 uv = vUv;
  vec4 posData = texture(texturePosition, uv);
  vec4 velNew = texture(textureVelocity, uv);
  vec3 pos = posData.xyz;
  float dt60 = delta * 60.0;
  vec3 newPos = pos + velNew.xyz * dt60;

  float prevGlow = posData.w;
  float speed = length(velNew.xyz);
  float velGlow = clamp((speed - 0.05) * 2.5, 0.0, 1.0);
  float scatterGlow = velNew.w * 0.7;
  vec4 clipPos = uMVP * vec4(pos, 1.0);
  float interactMask = 0.0;
  if (clipPos.w > 0.0) {
    vec2 screenUV = clamp((clipPos.xy / clipPos.w) * 0.5 + 0.5, 0.001, 0.999);
    vec2 d = screenUV - uMouseUV;
    d.x *= uAspect;
    interactMask = 1.0 - smoothstep(0.05, 0.12, length(d));
  }
  float impulseMag = length(uMouseVel) * 50.0 * uImpulseScale * interactMask;
  float proxGlow = min(impulseMag * 1.5, 0.8) * uInteractForce;
  float targetGlow = clamp(velGlow + proxGlow + scatterGlow, 0.0, 1.0);
  float glow;
  if (targetGlow > prevGlow) glow = prevGlow + (targetGlow - prevGlow) * min(1.0, delta * 12.0);
  else glow = prevGlow + (targetGlow - prevGlow) * min(1.0, delta * 3.0);
  outPosition = vec4(newPos, clamp(glow, 0.0, 1.0));
}`;

/* ---------- render (lit-sphere sprites, reference math) ---------- */
const RENDER_VERT = /* glsl */ `
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float extrapolateTau;
uniform float size;
uniform float pixelRatio;
uniform float centerGlowSize;
uniform float centerGlowPulse;
uniform float centerGlowBoost;
uniform float burstIntensity;
uniform float uTime;
uniform vec3 GLOW_COLOR_U;
uniform vec3 CENTER_GLOW_COLOR_U;
uniform float CENTER_GLOW_OPACITY_U;
uniform vec3 TINT_COLOR_U;
uniform vec3 ENERGY_COLOR_U;
attribute vec2 texCoord;
attribute vec3 color;
attribute float aHash;
varying vec3 vColor;
varying vec3 vAddColor;
varying vec3 vBoostColor;
varying vec3 vFx;
void main() {
  vec4 posData = texture2D(positionTexture, texCoord);
  vec4 velData = texture2D(velocityTexture, texCoord);
  vec3 currVel = velData.xyz;
  vec3 pos = posData.xyz + currVel * extrapolateTau;
  float glow = posData.w;
  float scatter = velData.w;
  float speed = length(currVel);
  vColor = color;
  float distToCenter = length(pos);
  float glowRadius = centerGlowSize * centerGlowPulse;
  float centerGlow = 1.0 - smoothstep(0.0, glowRadius, distToCenter);
  centerGlow *= centerGlow;
  float speedMix = smoothstep(0.05, 0.5, speed) * 0.5;
  float cgOpacity = CENTER_GLOW_OPACITY_U * (1.0 + centerGlowBoost * 1.2);
  vAddColor = GLOW_COLOR_U * glow * 1.5
    + mix(CENTER_GLOW_COLOR_U, vec3(1.0), centerGlowBoost * 0.55) * centerGlow * cgOpacity
    + ENERGY_COLOR_U * speedMix;
  vBoostColor = TINT_COLOR_U * (1.3 * (1.0 + glow * 0.4 + centerGlow * 0.3 + burstIntensity));
  float blowoutKey = clamp(
    glow * 0.7 + burstIntensity * 0.5 + scatter * 0.45 + smoothstep(0.08, 0.45, speed) * 0.45, 0.0, 1.0);
  vFx = vec3(1.0 + 0.05 * sin(uTime * 1.5 + aHash * 6.28318), scatter * 0.2,
    smoothstep(0.25, 0.95, blowoutKey) * 0.25);
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float sizeAttenuation = 350.0 / -mvPosition.z;
  float bloomScale = 1.0 + glow * 0.35;
  gl_PointSize = clamp(size * pixelRatio * sizeAttenuation * bloomScale, 2.0, 100.0) * 0.84;
}`;

const RENDER_FRAG = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying vec3 vAddColor;
varying vec3 vBoostColor;
varying vec3 vFx;
uniform vec3 lightDirView;
uniform vec3 halfDirView;
uniform float uPresence;
uniform vec3 rimColorCool;
uniform vec3 rimColorWarm;
uniform vec3 specColor;
void main() {
  vec2 uv = (gl_PointCoord - 0.5) * 0.84;
  float dist = length(uv);
  float solidEdge = 0.42;
  if (dist > solidEdge) discard;
  float z = sqrt(max(0.0, 0.25 - dist * dist));
  vec3 normal = vec3(uv.x, -uv.y, z) * 2.0;
  float NdotL = max(dot(normal, lightDirView), 0.0);
  float diffuse = NdotL * 0.4 + 0.6;
  float shadow = smoothstep(-0.3, 0.4, normal.y) * 0.25 + 0.75;
  float rim = 1.0 - max(normal.z, 0.0);
  float rim2 = rim * rim;
  float rimGlow = rim2 * rim * 0.4;
  vec3 baseColor = vColor * diffuse * shadow * 1.2;
  float backLit = 1.0 - NdotL;
  baseColor += vColor * (backLit * backLit * 0.18);
  vec3 rimMix = mix(rimColorWarm, rimColorCool, rim2);
  baseColor += rimMix * rimGlow;
  float sN = max(dot(normal, halfDirView), 0.0);
  float s2 = sN * sN;
  float s4 = s2 * s2;
  float s8 = s4 * s4;
  float s16 = s8 * s8;
  float spec = s16 * s8 * 0.25;
  baseColor += specColor * spec;
  baseColor += vAddColor;
  float luma = dot(baseColor, vec3(0.299, 0.587, 0.114));
  baseColor = mix(baseColor, vec3(luma), vFx.y);
  baseColor *= vFx.x;
  vec3 boosted = baseColor * vBoostColor;
  baseColor = mix(boosted, vec3(1.8), vFx.z);
  float ditherNoise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5;
  baseColor += ditherNoise / 255.0;
  float alpha = 1.0 - smoothstep(0.36, solidEdge, dist);
  gl_FragColor = vec4(baseColor, alpha * uPresence);
}`;

/* ---------- embers (reference energy particles) ---------- */
const EMBER_VERT = /* glsl */ `
uniform float time;
uniform float size;
uniform float pixelRatio;
attribute float aSpawnTime;
attribute float aLifetime;
attribute vec3 aVelocity;
attribute vec3 aSpawnPos;
attribute float aPhase;
varying float vAlpha;
varying float vAge;
void main() {
  float age = time - aSpawnTime;
  float progress = clamp(age / aLifetime, 0.0, 1.0);
  if (progress >= 1.0 || aSpawnTime < 0.0) {
    gl_Position = vec4(0.0, 0.0, -999.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    return;
  }
  float decel = 1.0 - progress * 0.6;
  vec3 pos = aSpawnPos + aVelocity * age * decel;
  float swirlAngle = age * (2.0 + aPhase * 3.0);
  vec3 radial = normalize(pos + vec3(0.001));
  vec3 up = abs(radial.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(radial, up));
  vec3 bitangent = cross(radial, tangent);
  float swirlRadius = (0.18 + aPhase * 0.1) * (1.0 - progress);
  pos += tangent * sin(swirlAngle) * swirlRadius + bitangent * cos(swirlAngle) * swirlRadius;
  float waveFreq = 3.0 + aPhase * 4.0;
  float waveAmp = 0.08 * (1.0 - progress * 0.8);
  pos.x += sin(age * waveFreq + aPhase * 6.28) * waveAmp;
  pos.y += cos(age * waveFreq * 0.7 + aPhase * 4.0) * waveAmp * 0.6;
  float fadeIn = smoothstep(0.0, 0.05, progress);
  float fadeOut = 1.0 - smoothstep(0.4, 1.0, progress);
  vAlpha = fadeIn * fadeOut;
  vAge = progress;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float sizeScale = (1.0 - progress * 0.7) * (0.7 + aPhase * 0.6);
  float sizeAttenuation = 350.0 / -mvPosition.z;
  gl_PointSize = size * pixelRatio * sizeAttenuation * sizeScale;
  gl_PointSize = clamp(gl_PointSize, 1.0, 60.0);
}`;

const EMBER_FRAG = /* glsl */ `
precision highp float;
varying float vAlpha;
varying float vAge;
uniform vec3 color;
uniform vec3 glowColor;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.05, d);
  vec3 col = mix(color, glowColor, clamp(vAge * 1.4, 0.0, 1.0));
  col = mix(col, vec3(1.0), core * 0.55);
  gl_FragColor = vec4(col, vAlpha * core);
}`;

/* ---------- scene assembly ---------- */
export function createHeroScene(
  canvas: HTMLCanvasElement,
  opts: { reducedMotion?: boolean } = {},
): HeroSceneHandle {
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
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 300);
  camera.position.set(0.6, 3.4, 34);
  camera.lookAt(4.2, 6.8, 0);

  const tierHigh = (navigator.hardwareConcurrency || 4) >= 8;
  const TEX = tierHigh ? 280 : 220; // reference: 280 high / 220 low
  const COUNT = TEX * TEX;

  /* environment (dark re-grade, world scale) */
  const SKY_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 120),
    new THREE.ShaderMaterial({
      depthWrite: false,
      vertexShader: SKY_VERT,
      fragmentShader: `varying vec2 vUv; void main(){
        vec3 top = vec3(0.059,0.051,0.102);
        vec3 mid = vec3(0.10,0.075,0.20);
        vec3 horizon = vec3(0.16,0.10,0.30);
        float h = smoothstep(0.0,1.0,vUv.y);
        vec3 col = mix(horizon, top, pow(h,0.72));
        col = mix(mid, col, smoothstep(0.12,0.55,h));
        gl_FragColor = vec4(col,1.0); }`,
    }),
  );
  sky.position.set(0, 8, -50);
  sky.renderOrder = -3;
  scene.add(sky);

  function ridgeShape(seed: number, base: number, amp: number, w: number): THREE.Shape {
    const rand = mulberry32(seed);
    const s = new THREE.Shape();
    s.moveTo(-w, -8);
    let x = -w;
    let y = base;
    while (x < w) {
      s.lineTo(x, y);
      x += 0.7 + rand() * 1.2;
      y = base + (rand() - 0.35) * amp;
    }
    s.lineTo(w, -8);
    s.closePath();
    return s;
  }
  const ridgeColors = [0x241a42, 0x171126, 0x0b0916];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(
      new THREE.ShapeGeometry(ridgeShape(1000 + i * 77, 0.5 + i * 1.1, 3.0 - i * 0.8, 110)),
      new THREE.MeshBasicMaterial({ color: ridgeColors[i] }),
    );
    m.position.set(0, WATER_LEVEL - 0.35, -22 + i * 7);
    m.renderOrder = -2;
    scene.add(m);
  }

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 60),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: SKY_VERT,
      fragmentShader: `varying vec2 vUv; void main(){
        vec3 top = vec3(0.13,0.085,0.26);
        vec3 bottom = vec3(0.028,0.024,0.055);
        gl_FragColor = vec4(mix(top, bottom, pow(vUv.y,0.8)), 0.93); }`,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, WATER_LEVEL, 0);
  water.renderOrder = -1;
  scene.add(water);

  // floor ripple (reference floorRipple): expanding violet wave rings on the water
  const waterUniforms = { waveTimes: { value: [-10, -10, -10, -10] } };
  const rippleMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: SKY_VERT,
    fragmentShader: `varying vec2 vUv;
      uniform float waveTimes[4];
      void main(){
        vec2 c = vUv - 0.5;
        c.x *= 3.3;
        float d = length(c);
        vec3 col = vec3(0.0);
        float a = 0.0;
        for (int i = 0; i < 4; i++) {
          float t = (0.0 - waveTimes[i]) / 1.2;
          if (t > 0.0 && t < 1.0) {
            float r = t * 0.45;
            float band = smoothstep(0.06, 0.0, abs(d - r)) * (1.0 - t) * (1.0 - t);
            col += mix(vec3(0.42, 0.26, 0.78), vec3(0.95), t * 0.4) * band * 0.55;
            a += band;
          }
        }
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      }`,
    uniforms: waterUniforms,
  });
  const ripple = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), rippleMat);
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(0, WATER_LEVEL + 0.05, 0);
  ripple.renderOrder = 0;
  scene.add(ripple);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 8),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: SKY_VERT,
      fragmentShader: `varying vec2 vUv; void main(){
        float x = smoothstep(0.0,0.5,vUv.x)*smoothstep(1.0,0.5,vUv.x);
        float y = smoothstep(0.0,0.8,vUv.y)*smoothstep(1.0,0.2,vUv.y);
        gl_FragColor = vec4(vec3(0.42,0.26,0.78)*x*y*0.55, 1.0); }`,
    }),
  );
  glow.position.set(0, WATER_LEVEL + 1.6, -10);
  glow.renderOrder = -1;
  scene.add(glow);

  /* shapes */
  const rand = mulberry32(20261105);
  const SHAPES: Float32Array[] = [
    sampleGlyph(COUNT, rand),
    sampleCube(COUNT, rand),
    sampleSphere(COUNT, rand),
    sampleHeart(COUNT, rand),
    sampleTorus(COUNT, rand),
  ];
  const targetTextures = SHAPES.map((data) => {
    const rgba = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      rgba[i * 4] = data[i * 3];
      rgba[i * 4 + 1] = data[i * 3 + 1];
      rgba[i * 4 + 2] = data[i * 3 + 2];
      rgba[i * 4 + 3] = 1;
    }
    const t = new THREE.DataTexture(rgba, TEX, TEX, THREE.RGBAFormat, THREE.FloatType);
    t.needsUpdate = true;
    return t;
  });

  /* GPGPU ping-pong (position+glow, velocity+scatter) */
  const rtOpts = {
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  } as const;
  const rtPos = [new THREE.WebGLRenderTarget(TEX, TEX, rtOpts), new THREE.WebGLRenderTarget(TEX, TEX, rtOpts)];
  const rtVel = [new THREE.WebGLRenderTarget(TEX, TEX, rtOpts), new THREE.WebGLRenderTarget(TEX, TEX, rtOpts)];
  let ping = 0;

  const simUniforms = {
    time: { value: 0 },
    delta: { value: 0.016 },
    springStiffness: { value: SPRING_STIFFNESS },
    damping: { value: VELOCITY_DAMPING },
    viscosity: { value: VISCOSITY },
    flowStrength: { value: FLOW_STRENGTH },
    flowScale: { value: FLOW_SCALE },
    flowSpeed: { value: FLOW_SPEED },
    returnSharpness: { value: RETURN_SHARPNESS },
    scatterDuration: { value: SCATTER_DURATION },
    pulseAmplitude: { value: PULSE_AMPLITUDE },
    burstIntensity: { value: 0 },
    uMouseUV: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseVel: { value: new THREE.Vector2(0, 0) },
    uAspect: { value: 1 },
    uImpulseScale: { value: 1 },
    uMVP: { value: new THREE.Matrix4() },
    uCamRight: { value: new THREE.Vector3(1, 0, 0) },
    uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    uInteractForce: { value: 1 },
    repulsionStrength: { value: REPULSION_STRENGTH },
    repulsionRadius: { value: REPULSION_RADIUS },
    texturePosition: { value: null as THREE.Texture | null },
    textureVelocity: { value: null as THREE.Texture | null },
    textureTarget: { value: targetTextures[0] as THREE.Texture },
  };
  const simScene = new THREE.Scene();
  const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const simVelMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SIM_VERT, fragmentShader: SIM_VEL_FRAG, uniforms: simUniforms });
  const simPosMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SIM_VERT, fragmentShader: SIM_POS_FRAG, uniforms: simUniforms });
  const simVelQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simVelMat);
  const simPosQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simPosMat);
  simScene.add(simVelQuad);
  simScene.add(simPosQuad);

  // init pass: pos = shape0, vel = 0
  {
    const initPos = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      initPos[i * 4] = SHAPES[0][i * 3];
      initPos[i * 4 + 1] = SHAPES[0][i * 3 + 1];
      initPos[i * 4 + 2] = SHAPES[0][i * 3 + 2];
      initPos[i * 4 + 3] = 0;
    }
    const ip = new THREE.DataTexture(initPos, TEX, TEX, THREE.RGBAFormat, THREE.FloatType);
    ip.needsUpdate = true;
    const copyMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: SIM_VERT,
      fragmentShader: `precision highp float; in vec2 vUv; uniform sampler2D tex;
        layout(location = 0) out vec4 o; void main(){ o = texture(tex, vUv); }`,
      uniforms: { tex: { value: ip } },
    });
    const copyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat);
    const copyScene = new THREE.Scene();
    copyScene.add(copyQuad);
    renderer.setRenderTarget(rtPos[0]);
    renderer.render(copyScene, simCam);
    renderer.setRenderTarget(rtVel[0]);
    renderer.render(copyScene, simCam);
    renderer.setRenderTarget(null);
    copyMat.dispose();
    ip.dispose();
  }

  /* render points + reflection */
  const geo = new THREE.BufferGeometry();
  const texCoords = new Float32Array(COUNT * 2);
  const colors = new Float32Array(COUNT * 3);
  const hashes = new Float32Array(COUNT);
  {
    const r2 = mulberry32(777);
    const pal = [PALETTE.PRIMARY, PALETTE.SECONDARY, PALETTE.TERTIARY, PALETTE.DEEP, PALETTE.WHITE];
    const weights = [0.42, 0.22, 0.16, 0.14, 0.06];
    for (let i = 0; i < COUNT; i++) {
      texCoords[i * 2] = ((i % TEX) + 0.5) / TEX;
      texCoords[i * 2 + 1] = (Math.floor(i / TEX) + 0.5) / TEX;
      let pick = r2();
      let c = pal[0];
      for (let k = 0; k < pal.length; k++) {
        if (pick < weights[k]) {
          c = pal[k];
          break;
        }
        pick -= weights[k];
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      hashes[i] = r2();
    }
  }
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute("texCoord", new THREE.BufferAttribute(texCoords, 2));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aHash", new THREE.BufferAttribute(hashes, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

  const renderUniforms = {
    positionTexture: { value: null as THREE.Texture | null },
    velocityTexture: { value: null as THREE.Texture | null },
    extrapolateTau: { value: 0.5 },
    size: { value: PARTICLE_SIZE },
    pixelRatio: { value: dpr },
    centerGlowSize: { value: 0.7 },
    centerGlowPulse: { value: 1 },
    centerGlowBoost: { value: 0 },
    GLOW_COLOR_U: { value: GLOW_COLOR },
    CENTER_GLOW_COLOR_U: { value: CENTER_GLOW_COLOR },
    CENTER_GLOW_OPACITY_U: { value: 0.2 },
    TINT_COLOR_U: { value: TINT_COLOR },
    ENERGY_COLOR_U: { value: ENERGY_COLOR },
    burstIntensity: { value: 0 },
    uTime: { value: 0 },
    lightDirView: { value: new THREE.Vector3().copy(LIGHT_DIR) },
    halfDirView: { value: new THREE.Vector3().copy(LIGHT_DIR).add(new THREE.Vector3(0, 0, 1)).normalize() },
    uPresence: { value: 1 },
    rimColorCool: { value: RIM_COLOR_COOL },
    rimColorWarm: { value: RIM_COLOR_WARM },
    specColor: { value: SPEC_COLOR },
  };
  const makePointsMat = (presence: number, depthWrite: boolean) =>
    new THREE.ShaderMaterial({
      vertexShader: RENDER_VERT,
      fragmentShader: RENDER_FRAG,
      uniforms: { ...renderUniforms, uPresence: { value: presence } },
      transparent: true,
      depthWrite,
      depthTest: true,
    });
  const pointsMat = makePointsMat(1, true);
  const reflMat = makePointsMat(0.10, false);

  const WORLD_SCALE = 8.2; // unit-space sim -> world-size mark (reference ~35% frame height)
  const points = new THREE.Points(geo, pointsMat);
  const markX = () => (camera.aspect < 0.9 ? 0.8 : 4.2);
  points.position.set(markX(), WATER_LEVEL + 7.4, 0);
  points.scale.setScalar(WORLD_SCALE);
  points.frustumCulled = false;
  points.renderOrder = 1;
  scene.add(points);

  const reflection = new THREE.Points(geo, reflMat);
  reflection.position.set(markX(), 2 * WATER_LEVEL - (WATER_LEVEL + 7.4), 0);
  reflection.scale.set(WORLD_SCALE, -WORLD_SCALE, WORLD_SCALE);
  reflection.frustumCulled = false;
  reflection.renderOrder = 0;
  scene.add(reflection);

  /* embers */
  const EMBER_N = tierHigh ? 3000 : 2000;
  const emberGeo = new THREE.BufferGeometry();
  const eSpawnPos = new Float32Array(EMBER_N * 3);
  const eVel = new Float32Array(EMBER_N * 3);
  const eSpawn = new Float32Array(EMBER_N).fill(-1);
  const eLife = new Float32Array(EMBER_N);
  const ePhase = new Float32Array(EMBER_N);
  for (let i = 0; i < EMBER_N; i++) {
    eLife[i] = 1.2 + rand() * 1.8;
    ePhase[i] = rand();
  }
  emberGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(EMBER_N * 3), 3));
  emberGeo.setAttribute("aSpawnPos", new THREE.BufferAttribute(eSpawnPos, 3));
  emberGeo.setAttribute("aVelocity", new THREE.BufferAttribute(eVel, 3));
  emberGeo.setAttribute("aSpawnTime", new THREE.BufferAttribute(eSpawn, 1));
  emberGeo.setAttribute("aLifetime", new THREE.BufferAttribute(eLife, 1));
  emberGeo.setAttribute("aPhase", new THREE.BufferAttribute(ePhase, 1));
  emberGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
  const emberUniforms = {
    time: { value: 0 },
    size: { value: PARTICLE_SIZE * 0.5 },
    pixelRatio: { value: dpr },
    color: { value: PALETTE.TERTIARY },
    glowColor: { value: CENTER_GLOW_COLOR },
  };
  const emberMat = new THREE.ShaderMaterial({
    vertexShader: EMBER_VERT,
    fragmentShader: EMBER_FRAG,
    uniforms: emberUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  embers.position.copy(points.position);
  embers.scale.setScalar(WORLD_SCALE);
  embers.frustumCulled = false;
  embers.renderOrder = 2;
  scene.add(embers);

  /* dust / fireflies */
  const dustGeo = new THREE.BufferGeometry();
  const DUST_N = 150;
  const dustPos = new Float32Array(DUST_N * 3);
  for (let i = 0; i < DUST_N; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 60;
    dustPos[i * 3 + 1] = rand() * 22 - 1;
    dustPos[i * 3 + 2] = (rand() - 0.5) * 30;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xb57bff, size: 0.06, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  scene.add(dust);

  /* state + loop */
  let sceneIdx = 0;
  let burst = 0;
  let pulseIntensity = 0;
  let prevHeartbeatFired = false;
  let suppressUntil = 0;
  let springScale = 1;
  let elapsed = 0;
  let last = performance.now();
  let raf = 0;
  const mouseUV = new THREE.Vector2(0.5, 0.5);
  const mouseVel = new THREE.Vector2(0, 0);
  let pointerActive = false;
  let pointerTimer: ReturnType<typeof setTimeout> | undefined;
  const interactRef = { value: 0 };
  const progressRef = { value: 0 };

  let waterWave0 = -10;
  const spawnHeartbeat = () => {
    // reference spawnBatch: batch embers from random shape-surface points,
    // radial velocity + jitter, lifetime 2.3 * (0.6..1.4)
    const BATCH = Math.floor(EMBER_N * 0.22);
    const src = SHAPES[sceneIdx];
    for (let k = 0; k < BATCH; k++) {
      const idx2 = Math.floor(Math.random() * COUNT);
      eSpawn[k] = elapsed;
      const sx = src[idx2 * 3];
      const sy = src[idx2 * 3 + 1];
      const sz = src[idx2 * 3 + 2];
      eSpawnPos[k * 3] = sx;
      eSpawnPos[k * 3 + 1] = sy;
      eSpawnPos[k * 3 + 2] = sz;
      const len = Math.max(0.001, Math.hypot(sx, sy, sz));
      const sp = 0.7 + Math.random() * 1.5;
      eVel[k * 3] = (sx / len) * sp + (Math.random() - 0.5) * 0.35;
      eVel[k * 3 + 1] = (sy / len) * sp + (Math.random() - 0.5) * 0.35 + 0.3;
      eVel[k * 3 + 2] = (sz / len) * sp + (Math.random() - 0.5) * 0.35;
      eLife[k] = 2.3 * (0.6 + Math.random() * 0.8);
    }
    (emberGeo.attributes.aSpawnPos as THREE.BufferAttribute).needsUpdate = true;
    (emberGeo.attributes.aVelocity as THREE.BufferAttribute).needsUpdate = true;
    (emberGeo.attributes.aSpawnTime as THREE.BufferAttribute).needsUpdate = true;
    (emberGeo.attributes.aLifetime as THREE.BufferAttribute).needsUpdate = true;
    // floor ripple: 4-slot wave ring buffer (reference triggerWave)
    waterUniforms.waveTimes.value[waterWaveIdx % 4] = -elapsed;
    waterWaveIdx++;
  };
  let waterWaveIdx = 0;

  const spawnEmbers = () => {
    for (let k = 0; k < EMBER_N; k++) {
      if (Math.random() < 0.5) {
        eSpawn[k] = elapsed;
        const src = SHAPES[sceneIdx];
        const i = Math.floor(Math.random() * COUNT);
        const sx = src[i * 3];
        const sy = src[i * 3 + 1];
        const sz = src[i * 3 + 2];
        eSpawnPos[k * 3] = sx;
        eSpawnPos[k * 3 + 1] = sy;
        eSpawnPos[k * 3 + 2] = sz;
        const len = Math.max(0.001, Math.hypot(sx, sy, sz));
        const sp = 0.55 + Math.random() * 1.0;
        eVel[k * 3] = (sx / len) * sp + (Math.random() - 0.5) * 2;
        eVel[k * 3 + 1] = Math.abs(sy / len) * sp * 0.7 + 0.5 + Math.random() * 0.6;
        eVel[k * 3 + 2] = (sz / len) * sp * 0.5;
      }
    }
    (emberGeo.attributes.aSpawnPos as THREE.BufferAttribute).needsUpdate = true;
    (emberGeo.attributes.aVelocity as THREE.BufferAttribute).needsUpdate = true;
    (emberGeo.attributes.aSpawnTime as THREE.BufferAttribute).needsUpdate = true;
  };

  const reduced = opts.reducedMotion ?? false;

  const tick = () => {
    const now = performance.now();
    const delta = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
    last = now;
    elapsed += delta;

    // softenRetarget recovery
    springScale += (1 - springScale) * Math.min(1, delta * 2.2);
    simUniforms.springStiffness.value = SPRING_STIFFNESS * springScale;

    // energy heartbeat: every 2s a burst fires in the 0.8-0.9 phase window
    const hbPhase = (elapsed * BURST_SPEED) % 1;
    const inWindow = hbPhase > HEARTBEAT_WINDOW[0] && hbPhase < HEARTBEAT_WINDOW[1];
    const suppressed = elapsed < suppressUntil;
    if (inWindow && !prevHeartbeatFired && !suppressed) {
      spawnHeartbeat();
      pulseIntensity = 1; // sim kick ties ONLY to pulse (fast reference decay)
    }
    prevHeartbeatFired = inWindow;
    pulseIntensity *= Math.pow(PULSE_DECAY, delta);
    if (burst > 0) burst = Math.max(0, burst - delta * 2.4);
    const effBurst = Math.max(burst, pulseIntensity * 0.55);
    simUniforms.burstIntensity.value = effBurst;
    renderUniforms.burstIntensity.value = effBurst;
    renderUniforms.centerGlowPulse.value = 1 + pulseIntensity * PULSE_AMPLITUDE_GLOW;
    renderUniforms.centerGlowBoost.value = pulseIntensity * 0.8;
    void waterWave0;

    mouseVel.multiplyScalar(0.86);
    simUniforms.uMouseVel.value.copy(mouseVel);
    simUniforms.uMouseUV.value.copy(mouseUV);
    interactRef.value += ((pointerActive ? 1 : 0) - interactRef.value) * Math.min(1, delta * 6);
    simUniforms.uInteractForce.value = interactRef.value;

    camera.updateMatrixWorld();
    points.updateMatrixWorld();
    // reference multiplies the model matrix — the mask must project RENDER-space
    // positions (scale 8.2 + translate), not raw unit-space sim positions
    simUniforms.uMVP.value
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .multiply(points.matrixWorld);
    const m = camera.matrixWorld.elements;
    const modelInv = new THREE.Matrix4().copy(points.matrixWorld).invert();
    (simUniforms.uCamRight.value as THREE.Vector3)
      .set(m[0], m[1], m[2])
      .transformDirection(modelInv);
    (simUniforms.uCamUp.value as THREE.Vector3)
      .set(m[4], m[5], m[6])
      .transformDirection(modelInv);
    simUniforms.uAspect.value = camera.aspect;
    simUniforms.time.value = elapsed;
    simUniforms.delta.value = delta;
    emberUniforms.time.value = elapsed;
    renderUniforms.uTime.value = elapsed;

    // sim pass 1: velocity
    simUniforms.texturePosition.value = rtPos[ping].texture;
    simUniforms.textureVelocity.value = rtVel[ping].texture;
    simVelQuad.visible = true;
    simPosQuad.visible = false;
    renderer.setRenderTarget(rtVel[1 - ping]);
    renderer.render(simScene, simCam);

    // sim pass 2: position (reads NEW velocity)
    simUniforms.textureVelocity.value = rtVel[1 - ping].texture;
    simVelQuad.visible = false;
    simPosQuad.visible = true;
    renderer.setRenderTarget(rtPos[1 - ping]);
    renderer.render(simScene, simCam);

    renderer.setRenderTarget(null);
    ping = 1 - ping;

    const bypass = (window as unknown as { __bypassSim?: boolean }).__bypassSim;
    renderUniforms.positionTexture.value = bypass ? targetTextures[0] : rtPos[ping].texture;
    renderUniforms.velocityTexture.value = bypass ? targetTextures[0] : rtVel[ping].texture;

    // orbit camera (reference grammar): full revolution, dip closer+lower mid-journey
    const p = progressRef.value;
    const angle = ORBIT_INITIAL_ANGLE + p * Math.PI * 2;
    const dip = Math.sin(p * Math.PI) ** 2;
    const radius = ORBIT_RADIUS - (ORBIT_RADIUS - ORBIT_RADIUS * ORBIT_CLOSE_FACTOR) * dip;
    const oy = ORBIT_Y - 5 * dip;
    camera.position.set(
      points.position.x + radius * Math.sin(angle),
      oy,
      radius * Math.cos(angle),
    );
    // finale fly-through: in the last scene the camera dives from orbit into the
    // torus hole and passes through it (ring walls sweep the frame edges), then
    // the white flash hands off to the content sections
    const FLY_START = 0.86;
    let flyT = 0;
    if (p > FLY_START) {
      flyT = easeSmooth(Math.min(1, (p - FLY_START) / (1 - FLY_START)));
      // converge onto the hole axis (torus faces +Z) and pass through along Z
      const approach = new THREE.Vector3(
        points.position.x,
        points.position.y,
        radius * Math.cos(angle) * (1 - flyT) - flyT * 5.5,
      );
      camera.position.lerp(approach, flyT);
    }
    // lookAt: particles anchor + per-scene offsets (smoothstepped between stops);
    // during the fly-through the view turns forward through the hole (never looks back)
    const stops = LOOKAT_OFFSETS;
    const t = easeSmooth(p) * (stops.length - 1);
    const seg = Math.min(Math.floor(t), stops.length - 2);
    const f = t - seg;
    const a = stops[seg];
    const b = stops[seg + 1];
    const lz = points.position.z + a[2] + (b[2] - a[2]) * f - flyT * 26;
    camera.lookAt(
      points.position.x,
      points.position.y,
      lz,
    );
    // per-shape group rotation (heart faces the camera at its orbit azimuth)
    const rotT = easeSmooth(p) * (SHAPE_ROTATIONS.length - 1);
    const rotSeg = Math.min(Math.floor(rotT), SHAPE_ROTATIONS.length - 2);
    const rotF = rotT - rotSeg;
    let ry =
      SHAPE_ROTATIONS[rotSeg] + (SHAPE_ROTATIONS[rotSeg + 1] - SHAPE_ROTATIONS[rotSeg]) * rotF;
    // last scene: rotate the ring to face the camera (azimuth compensation), easing
    // to 0 as the orbit comes full circle — donut reads perfectly frontal in the dive
    if (p > 0.87) {
      const blend = Math.min(1, (p - 0.87) / 0.05);
      const frontal = -(Math.PI * 2 - angle);
      ry = ry * (1 - blend) + frontal * blend;
    }
    points.rotation.y = ry + elapsed * 0.016;
    reflection.rotation.y = points.rotation.y;

    // dust drift
    const dp = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < DUST_N; i++) {
      let y = dp.getY(i) + delta * (0.1 + (i % 7) * 0.02);
      if (y > 22) y = -1;
      dp.setY(i, y);
    }
    dp.needsUpdate = true;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  if (reduced) {
    // static frame: run a few sim steps then render once
    for (let i = 0; i < 30; i++) tick();
    cancelAnimationFrame(raf);
    renderer.setRenderTarget(null);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(tick);
  }

  return {
    setScene(idx) {
      if (idx !== sceneIdx) {
        sceneIdx = idx;
        burst = 1;
        suppressUntil = elapsed + 1.1; // energyFiringSuppressed during transition
        simUniforms.textureTarget.value = targetTextures[idx];
        spawnEmbers();
        springScale = 0.2; // softenRetarget: spring drops to 20%, tweens back
      }
    },
    setProgress(p) {
      progressRef.value = p;
    },
    setPointer(nx, ny) {
      const ux = (nx + 1) / 2;
      const uy = (ny + 1) / 2;
      mouseVel.set((ux - mouseUV.x) * 60, (uy - mouseUV.y) * 60).clampLength(0, 3);
      mouseUV.set(ux, uy);
      pointerActive = true;
      clearTimeout(pointerTimer);
      pointerTimer = setTimeout(() => {
        pointerActive = false;
      }, 1600);
    },
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const cx = markX();
      points.position.x = cx;
      reflection.position.x = cx;
    },
    dispose() {
      cancelAnimationFrame(raf);
      rtPos.forEach((t) => t.dispose());
      rtVel.forEach((t) => t.dispose());
      geo.dispose();
      pointsMat.dispose();
      reflMat.dispose();
      emberGeo.dispose();
      emberMat.dispose();
      simVelMat.dispose();
      simPosMat.dispose();
      targetTextures.forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
