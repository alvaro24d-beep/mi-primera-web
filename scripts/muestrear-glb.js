// Muestrea la SUPERFICIE de un .glb y escribe una nube de puntos cuantizada.
// Herramienta de UN SOLO USO, a mano — no forma parte del build.
//
//   node scripts/muestrear-glb.js <modelo.glb> public/gear-points.bin 9000
//
// Genera el asset que consume components/scene/GearPoints.tsx. El .glb de
// origen NO está en el repo (7,6MB de los que la web no usa nada): vive donde
// lo dejó quien lo descargó. Si hay que regenerar el .bin —para cambiar el
// número de puntos o para estrenar otro modelo— hace falta recuperar ese .glb
// primero.
//
// La semilla del PRNG es fija a propósito: el mismo .glb y el mismo N dan
// SIEMPRE la misma nube, así que el asset es reproducible bit a bit.
const fs = require("fs");

const [, , entrada, salida, nStr] = process.argv;
const N = parseInt(nStr || "9000", 10);

// ---- Leer el GLB
const buf = fs.readFileSync(entrada);
let off = 12, json = null, bin = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off);
  const type = buf.toString("ascii", off + 4, off + 8);
  if (type.startsWith("JSON")) json = JSON.parse(buf.toString("utf8", off + 8, off + 8 + len));
  if (type.startsWith("BIN")) bin = buf.subarray(off + 8, off + 8 + len);
  off += 8 + len + ((4 - (len % 4)) % 4);
}

const leerAccessor = (idx) => {
  const acc = json.accessors[idx];
  const bv = json.bufferViews[acc.bufferView];
  const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
  const n = acc.count * comps;
  // 5125 = UNSIGNED_INT, 5123 = UNSIGNED_SHORT, 5126 = FLOAT
  if (acc.componentType === 5126) {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = bin.readFloatLE(base + i * 4);
    return out;
  }
  if (acc.componentType === 5125) {
    const out = new Uint32Array(n);
    for (let i = 0; i < n; i++) out[i] = bin.readUInt32LE(base + i * 4);
    return out;
  }
  if (acc.componentType === 5123) {
    const out = new Uint16Array(n);
    for (let i = 0; i < n; i++) out[i] = bin.readUInt16LE(base + i * 2);
    return out;
  }
  throw new Error("componentType no soportado: " + acc.componentType);
};

const prim = json.meshes[0].primitives[0];
const pos = leerAccessor(prim.attributes.POSITION);
const idx = leerAccessor(prim.indices);
const nTri = idx.length / 3;
console.log(`malla: ${pos.length / 3} vértices, ${nTri} triángulos`);

// ---- Área de cada triángulo -> CDF, para muestrear UNIFORME POR ÁREA
// (sin esto, los triángulos pequeños recibirían tantos puntos como los
// grandes y la densidad saldría a manchas)
const cdf = new Float64Array(nTri);
let area = 0;
const ax = [0, 0, 0], bx = [0, 0, 0];
for (let t = 0; t < nTri; t++) {
  const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
  for (let k = 0; k < 3; k++) { ax[k] = pos[b + k] - pos[a + k]; bx[k] = pos[c + k] - pos[a + k]; }
  const cx = ax[1] * bx[2] - ax[2] * bx[1];
  const cy = ax[2] * bx[0] - ax[0] * bx[2];
  const cz = ax[0] * bx[1] - ax[1] * bx[0];
  area += 0.5 * Math.hypot(cx, cy, cz);
  cdf[t] = area;
}

// PRNG con semilla fija: la nube tiene que ser SIEMPRE la misma, o cada
// regeneración movería los puntos y el resultado dejaría de ser reproducible.
let s = 0x9e3779b9;
const rnd = () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buscar = (v) => { // binaria sobre la CDF
  let lo = 0, hi = nTri - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < v) lo = m + 1; else hi = m; }
  return lo;
};

const pts = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const t = buscar(rnd() * area);
  const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
  // Baricéntricas uniformes (el sqrt evita que se apelotonen en un vértice)
  let u = rnd(), v = rnd();
  if (u + v > 1) { u = 1 - u; v = 1 - v; }
  const w = 1 - u - v;
  for (let k = 0; k < 3; k++) pts[i * 3 + k] = pos[a + k] * w + pos[b + k] * u + pos[c + k] * v;
}

// ---- Centrar en su bounding box y normalizar al radio mayor
let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) {
  const val = pts[i * 3 + k];
  if (val < mn[k]) mn[k] = val;
  if (val > mx[k]) mx[k] = val;
}
const ctr = mn.map((v, k) => (v + mx[k]) / 2);
let rMax = 0;
for (let i = 0; i < N; i++) {
  const x = pts[i * 3] - ctr[0], y = pts[i * 3 + 1] - ctr[1], z = pts[i * 3 + 2] - ctr[2];
  rMax = Math.max(rMax, Math.hypot(x, y, z));
}
console.log("centro:", ctr.map((v) => v.toFixed(4)).join(", "), "| radio:", rMax.toFixed(4));

// ---- Cuantizar a Int16. 2 bytes por eje en vez de 4: la mitad de archivo, y
// el error máximo es 1/32767 del radio — muy por debajo de un píxel en
// pantalla para cualquier tamaño al que se vaya a dibujar.
const q = new Int16Array(N * 3);
for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) {
  const v = (pts[i * 3 + k] - ctr[k]) / rMax; // [-1, 1]
  q[i * 3 + k] = Math.max(-32767, Math.min(32767, Math.round(v * 32767)));
}
fs.writeFileSync(salida, Buffer.from(q.buffer));
console.log(`escrito ${salida}: ${N} puntos, ${(q.byteLength / 1024).toFixed(1)} KB`);
