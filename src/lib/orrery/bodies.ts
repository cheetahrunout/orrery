export type BodyKind = "star" | "planet" | "dwarf";

export type Vec3 = { x: number; y: number; z: number };

export type Body = {
  id: string;
  name: string;
  kind: BodyKind;
  /** Visual orbital radius (scene units). */
  semiMajor: number;
  /** Radius of the mesh (Earth = 1). */
  radius: number;
  /** Sidereal year in Earth years. */
  period: number;
  /** Sidereal day in Earth days. Positive = prograde. */
  day: number;
  eccentricity: number;
  /** Orbital inclination in radians. */
  inclination: number;
  /** Longitude of ascending node in radians. */
  lan: number;
  /** Axial tilt in radians. */
  tilt: number;
  phase: number;
  swatch: string;
  atmosphere?: string;
  hasRings?: boolean;
  moons?: number;
  diameterKm: number;
  distanceAu: number;
  blurb: string;
  facts: { label: string; value: string }[];
};

export const YEAR_SCALE = 1 / 18;

export const BODIES: Body[] = [
  {
    id: "sun",
    name: "Sun",
    kind: "star",
    semiMajor: 0,
    radius: 5.4,
    period: 1,
    day: 25.4,
    eccentricity: 0,
    inclination: 0,
    lan: 0,
    tilt: 0.126,
    phase: 0,
    swatch: "#e8c27a",
    diameterKm: 1_392_700,
    distanceAu: 0,
    blurb:
      "A G-type main-sequence star holding the system in its gravity. Everything else is a footnote of its mass.",
    facts: [
      { label: "Type", value: "G2V yellow dwarf" },
      { label: "Age", value: "4.6 billion years" },
      { label: "Mass", value: "1.989 × 10³⁰ kg" },
      { label: "Rotation", value: "25.4 days (eq.)" },
      { label: "Surface", value: "5,500 °C" },
    ],
  },
  {
    id: "mercury",
    name: "Mercury",
    kind: "planet",
    semiMajor: 10.4,
    radius: 0.38,
    period: 0.241,
    day: 58.6,
    eccentricity: 0.206,
    inclination: 0.122,
    lan: 0.84,
    tilt: 0.0006,
    phase: 0.4,
    swatch: "#9a9086",
    moons: 0,
    diameterKm: 4_879,
    distanceAu: 0.39,
    blurb:
      "The innermost world. Airless, cratered, and extreme — a day here lasts two of its years.",
    facts: [
      { label: "Class", value: "Terrestrial" },
      { label: "Year", value: "88 Earth days" },
      { label: "Day", value: "59 Earth days" },
      { label: "Moons", value: "None" },
      { label: "Distance", value: "0.39 AU" },
    ],
  },
  {
    id: "venus",
    name: "Venus",
    kind: "planet",
    semiMajor: 14.2,
    radius: 0.95,
    period: 0.615,
    day: -243,
    eccentricity: 0.007,
    inclination: 0.059,
    lan: 1.34,
    tilt: 3.096,
    phase: 1.1,
    swatch: "#d9c3a0",
    atmosphere: "#e8d4b0",
    moons: 0,
    diameterKm: 12_104,
    distanceAu: 0.72,
    blurb:
      "Earth’s veiled twin. A runaway greenhouse under sulfuric clouds, rotating backwards through a long, slow day.",
    facts: [
      { label: "Class", value: "Terrestrial" },
      { label: "Year", value: "225 Earth days" },
      { label: "Day", value: "243 Earth days ↺" },
      { label: "Moons", value: "None" },
      { label: "Distance", value: "0.72 AU" },
    ],
  },
  {
    id: "earth",
    name: "Earth",
    kind: "planet",
    semiMajor: 18.4,
    radius: 1,
    period: 1,
    day: 1,
    eccentricity: 0.017,
    inclination: 0,
    lan: 0,
    tilt: 0.409,
    phase: 0.2,
    swatch: "#6fa3c8",
    atmosphere: "#8ec5e8",
    moons: 1,
    diameterKm: 12_742,
    distanceAu: 1,
    blurb:
      "The only known harbour of life. A wet, restless world with one large moon and a thin blue veil of air.",
    facts: [
      { label: "Class", value: "Terrestrial" },
      { label: "Year", value: "365.25 days" },
      { label: "Day", value: "23 h 56 m" },
      { label: "Moons", value: "1 — Luna" },
      { label: "Distance", value: "1.00 AU" },
    ],
  },
  {
    id: "mars",
    name: "Mars",
    kind: "planet",
    semiMajor: 24.2,
    radius: 0.53,
    period: 1.881,
    day: 1.03,
    eccentricity: 0.093,
    inclination: 0.032,
    lan: 0.86,
    tilt: 0.439,
    phase: 2.4,
    swatch: "#c4845a",
    atmosphere: "#c9a07a",
    moons: 2,
    diameterKm: 6_779,
    distanceAu: 1.52,
    blurb:
      "The rusted frontier. Polar ice, extinct volcanoes, and a sky the colour of dust at dusk.",
    facts: [
      { label: "Class", value: "Terrestrial" },
      { label: "Year", value: "687 Earth days" },
      { label: "Day", value: "24 h 37 m" },
      { label: "Moons", value: "2 — Phobos, Deimos" },
      { label: "Distance", value: "1.52 AU" },
    ],
  },
  {
    id: "jupiter",
    name: "Jupiter",
    kind: "planet",
    semiMajor: 40.5,
    radius: 2.85,
    period: 11.86,
    day: 0.41,
    eccentricity: 0.049,
    inclination: 0.023,
    lan: 1.75,
    tilt: 0.055,
    phase: 0.7,
    swatch: "#c4a078",
    atmosphere: "#d4b896",
    moons: 95,
    diameterKm: 139_820,
    distanceAu: 5.2,
    blurb:
      "A failed star of hydrogen and helium. Its Great Red Spot has raged longer than written history.",
    facts: [
      { label: "Class", value: "Gas giant" },
      { label: "Year", value: "11.9 Earth years" },
      { label: "Day", value: "9 h 56 m" },
      { label: "Moons", value: "95 known" },
      { label: "Distance", value: "5.20 AU" },
    ],
  },
  {
    id: "saturn",
    name: "Saturn",
    kind: "planet",
    semiMajor: 54.8,
    radius: 2.4,
    period: 29.46,
    day: 0.45,
    eccentricity: 0.057,
    inclination: 0.043,
    lan: 1.98,
    tilt: 0.467,
    phase: 3.1,
    swatch: "#d8c49a",
    atmosphere: "#e4d4b0",
    hasRings: true,
    moons: 146,
    diameterKm: 116_460,
    distanceAu: 9.58,
    blurb:
      "Lord of the rings. A pale gold giant so light it would float on water — if you had an ocean large enough.",
    facts: [
      { label: "Class", value: "Gas giant" },
      { label: "Year", value: "29.5 Earth years" },
      { label: "Day", value: "10 h 33 m" },
      { label: "Moons", value: "146 known" },
      { label: "Distance", value: "9.58 AU" },
    ],
  },
  {
    id: "uranus",
    name: "Uranus",
    kind: "planet",
    semiMajor: 68.5,
    radius: 1.55,
    period: 84.01,
    day: -0.72,
    eccentricity: 0.046,
    inclination: 0.013,
    lan: 1.29,
    tilt: 1.706,
    phase: 4.2,
    swatch: "#9bd0d4",
    atmosphere: "#b7e0e2",
    moons: 28,
    diameterKm: 50_724,
    distanceAu: 19.2,
    blurb:
      "An ice giant rolled onto its side. Seasons here last decades; its rings stand almost vertical.",
    facts: [
      { label: "Class", value: "Ice giant" },
      { label: "Year", value: "84 Earth years" },
      { label: "Day", value: "17 h 14 m ↺" },
      { label: "Moons", value: "28 known" },
      { label: "Distance", value: "19.2 AU" },
    ],
  },
  {
    id: "neptune",
    name: "Neptune",
    kind: "planet",
    semiMajor: 82.2,
    radius: 1.5,
    period: 164.8,
    day: 0.67,
    eccentricity: 0.01,
    inclination: 0.031,
    lan: 2.3,
    tilt: 0.494,
    phase: 5.5,
    swatch: "#4d7ec8",
    atmosphere: "#6a96dc",
    moons: 16,
    diameterKm: 49_244,
    distanceAu: 30.05,
    blurb:
      "The last giant. Dark, windy, and remote — its storms race faster than sound through methane-blue cloud.",
    facts: [
      { label: "Class", value: "Ice giant" },
      { label: "Year", value: "165 Earth years" },
      { label: "Day", value: "16 h 6 m" },
      { label: "Moons", value: "16 known" },
      { label: "Distance", value: "30.1 AU" },
    ],
  },
  {
    id: "pluto",
    name: "Pluto",
    kind: "dwarf",
    semiMajor: 94.5,
    radius: 0.22,
    period: 247.9,
    day: -6.39,
    eccentricity: 0.248,
    inclination: 0.299,
    lan: 1.92,
    tilt: 2.138,
    phase: 1.8,
    swatch: "#c4b4a4",
    moons: 5,
    diameterKm: 2_377,
    distanceAu: 39.5,
    blurb:
      "A heart-marked wanderer of the Kuiper Belt. Demoted, not diminished — still the soul of the outer dark.",
    facts: [
      { label: "Class", value: "Dwarf planet" },
      { label: "Year", value: "248 Earth years" },
      { label: "Day", value: "6.4 Earth days ↺" },
      { label: "Moons", value: "5 — Charon & kin" },
      { label: "Distance", value: "39.5 AU" },
    ],
  },
];

export const PLANETS = BODIES.filter((b) => b.id !== "sun");
export const SUN = BODIES[0]!;

export function getBody(id: string): Body {
  return BODIES.find((b) => b.id === id) ?? SUN;
}

const _scratch: Vec3 = { x: 0, y: 0, z: 0 };

export function orbitPosition(
  body: Body,
  years: number,
  out: Vec3 = _scratch,
): Vec3 {
  if (body.semiMajor === 0) {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    return out;
  }
  const theta = (years / body.period) * Math.PI * 2 + body.phase;
  const e = body.eccentricity;
  const r = (body.semiMajor * (1 - e * e)) / (1 + e * Math.cos(theta));
  const xOrb = r * Math.cos(theta);
  const zOrb = r * Math.sin(theta);
  const y = zOrb * Math.sin(body.inclination);
  const z = zOrb * Math.cos(body.inclination);
  const c = Math.cos(body.lan);
  const s = Math.sin(body.lan);
  out.x = xOrb * c - z * s;
  out.y = y;
  out.z = xOrb * s + z * c;
  return out;
}

export const sim = {
  time: 0,
};

export const view = {
  theta: 0.62,
  phi: 1.12,
  radius: 74,
  minR: 8,
  maxR: 170,
  zoomBy(factor: number) {
    this.radius = Math.min(this.maxR, Math.max(this.minR, this.radius * factor));
  },
};
