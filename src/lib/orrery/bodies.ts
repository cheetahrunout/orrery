import {
  AU_KM,
  EARTH_RADIUS_KM,
  heliocentricUnits,
  moonOrbitUnits,
  radiusUnits,
} from "./scale";

export type BodyKind = "star" | "planet" | "dwarf" | "moon";

export type Vec3 = { x: number; y: number; z: number };

/**
 * Everything here is a true measured value — radii and semi-major axes in km,
 * periods in days. Nothing is pre-scaled for the scene; `scale.ts` converts at
 * render time so "true scale" is a setting rather than a rewrite.
 *
 * Planet figures are IAU/NASA fact-sheet values. Moon radii and orbital
 * elements are JPL Solar System Dynamics (ssd.jpl.nasa.gov/sats).
 */
export type Body = {
  id: string;
  name: string;
  kind: BodyKind;
  /** Moons orbit this body; undefined means it orbits the Sun. */
  parentId?: string;
  /** Mean radius, km. */
  radiusKm: number;
  /** Semi-major axis, km. 0 for the Sun. */
  semiMajorKm: number;
  /** Sidereal orbital period, days. */
  periodDays: number;
  /** Sidereal rotation period, days. Negative = retrograde. */
  rotationDays: number;
  eccentricity: number;
  /** Orbital inclination, radians. Over 90 degrees means a retrograde orbit. */
  inclination: number;
  /** Axial tilt, radians. */
  tilt: number;
  swatch: string;
  atmosphere?: string;
  hasRings?: boolean;
  blurb: string;
  facts: { label: string; value: string }[];
};

const deg = (d: number) => (d * Math.PI) / 180;

export const SUN: Body = {
  id: "sun",
  name: "Sun",
  kind: "star",
  radiusKm: 696_000,
  semiMajorKm: 0,
  periodDays: 1,
  rotationDays: 25.38,
  eccentricity: 0,
  inclination: 0,
  tilt: deg(7.25),
  swatch: "#e8c27a",
  blurb:
    "A G-type main-sequence star holding the system in its gravity. Everything else is a footnote of its mass.",
  facts: [
    { label: "Type", value: "G2V yellow dwarf" },
    { label: "Radius", value: "696,000 km" },
    { label: "Age", value: "4.6 billion years" },
    { label: "Rotation", value: "25.4 days (eq.)" },
    { label: "Surface", value: "5,500 °C" },
  ],
};

export const PLANETS: Body[] = [
  {
    id: "mercury",
    name: "Mercury",
    kind: "planet",
    radiusKm: 2439.7,
    semiMajorKm: 57_909_050,
    periodDays: 87.969,
    rotationDays: 58.646,
    eccentricity: 0.2056,
    inclination: deg(7.005),
    tilt: deg(0.034),
    swatch: "#9a9086",
    blurb:
      "The innermost world. Airless, cratered, and extreme — a day here lasts two of its years.",
    facts: [
      { label: "Class", value: "Terrestrial" },
      { label: "Radius", value: "2,440 km" },
      { label: "Year", value: "88 Earth days" },
      { label: "Day", value: "59 Earth days" },
      { label: "Distance", value: "0.39 AU" },
    ],
  },
  {
    id: "venus",
    name: "Venus",
    kind: "planet",
    radiusKm: 6051.8,
    semiMajorKm: 108_208_000,
    periodDays: 224.701,
    rotationDays: -243.025,
    eccentricity: 0.0068,
    inclination: deg(3.395),
    tilt: deg(177.36),
    swatch: "#d9c3a0",
    atmosphere: "#e8d4b0",
    blurb:
      "Earth's veiled twin. A runaway greenhouse under sulfuric clouds, rotating backwards through a long, slow day.",
    facts: [
      { label: "Class", value: "Terrestrial" },
      { label: "Radius", value: "6,052 km" },
      { label: "Year", value: "225 Earth days" },
      { label: "Day", value: "243 Earth days ↺" },
      { label: "Distance", value: "0.72 AU" },
    ],
  },
  {
    id: "earth",
    name: "Earth",
    kind: "planet",
    radiusKm: 6371.0,
    semiMajorKm: 149_598_023,
    periodDays: 365.256,
    rotationDays: 0.99727,
    eccentricity: 0.0167,
    inclination: 0,
    tilt: deg(23.44),
    swatch: "#6fa3c8",
    atmosphere: "#8ec5e8",
    blurb:
      "The only known harbour of life. A wet, restless world with one large moon and a thin blue veil of air.",
    facts: [
      { label: "Class", value: "Terrestrial" },
      { label: "Radius", value: "6,371 km" },
      { label: "Year", value: "365.25 days" },
      { label: "Day", value: "23 h 56 m" },
      { label: "Moons", value: "1" },
    ],
  },
  {
    id: "mars",
    name: "Mars",
    kind: "planet",
    radiusKm: 3389.5,
    semiMajorKm: 227_939_200,
    periodDays: 686.98,
    rotationDays: 1.025957,
    eccentricity: 0.0934,
    inclination: deg(1.85),
    tilt: deg(25.19),
    swatch: "#c4845a",
    atmosphere: "#c9a07a",
    blurb:
      "The rusted frontier. Polar ice, extinct volcanoes, and a sky the colour of dust at dusk.",
    facts: [
      { label: "Class", value: "Terrestrial" },
      { label: "Radius", value: "3,390 km" },
      { label: "Year", value: "687 Earth days" },
      { label: "Day", value: "24 h 37 m" },
      { label: "Moons", value: "2" },
    ],
  },
  {
    id: "jupiter",
    name: "Jupiter",
    kind: "planet",
    radiusKm: 69_911,
    semiMajorKm: 778_570_000,
    periodDays: 4332.59,
    rotationDays: 0.413538,
    eccentricity: 0.0489,
    inclination: deg(1.303),
    tilt: deg(3.13),
    swatch: "#c4a078",
    atmosphere: "#d4b896",
    blurb:
      "A failed star of hydrogen and helium. Its Great Red Spot has raged longer than written history.",
    facts: [
      { label: "Class", value: "Gas giant" },
      { label: "Radius", value: "69,911 km" },
      { label: "Year", value: "11.9 Earth years" },
      { label: "Day", value: "9 h 56 m" },
      { label: "Moons", value: "95 known" },
    ],
  },
  {
    id: "saturn",
    name: "Saturn",
    kind: "planet",
    radiusKm: 58_232,
    semiMajorKm: 1_433_530_000,
    periodDays: 10_759.22,
    rotationDays: 0.444007,
    eccentricity: 0.0565,
    inclination: deg(2.485),
    tilt: deg(26.73),
    swatch: "#d8c49a",
    atmosphere: "#e4d4b0",
    hasRings: true,
    blurb:
      "Lord of the rings. A pale gold giant so light it would float on water — if you had an ocean large enough.",
    facts: [
      { label: "Class", value: "Gas giant" },
      { label: "Radius", value: "58,232 km" },
      { label: "Year", value: "29.5 Earth years" },
      { label: "Day", value: "10 h 39 m" },
      { label: "Moons", value: "274 known" },
    ],
  },
  {
    id: "uranus",
    name: "Uranus",
    kind: "planet",
    radiusKm: 25_362,
    semiMajorKm: 2_872_460_000,
    periodDays: 30_688.5,
    rotationDays: -0.71833,
    eccentricity: 0.0457,
    inclination: deg(0.773),
    tilt: deg(97.77),
    swatch: "#9bd0d4",
    atmosphere: "#b7e0e2",
    blurb:
      "An ice giant rolled onto its side. Seasons here last decades; its rings stand almost vertical.",
    facts: [
      { label: "Class", value: "Ice giant" },
      { label: "Radius", value: "25,362 km" },
      { label: "Year", value: "84 Earth years" },
      { label: "Day", value: "17 h 14 m ↺" },
      { label: "Moons", value: "28 known" },
    ],
  },
  {
    id: "neptune",
    name: "Neptune",
    kind: "planet",
    radiusKm: 24_622,
    semiMajorKm: 4_495_060_000,
    periodDays: 60_195,
    rotationDays: 0.67125,
    eccentricity: 0.0113,
    inclination: deg(1.77),
    tilt: deg(28.32),
    swatch: "#4d7ec8",
    atmosphere: "#6a96dc",
    blurb:
      "The last giant. Dark, windy, and remote — its storms race faster than sound through methane-blue cloud.",
    facts: [
      { label: "Class", value: "Ice giant" },
      { label: "Radius", value: "24,622 km" },
      { label: "Year", value: "165 Earth years" },
      { label: "Day", value: "16 h 6 m" },
      { label: "Moons", value: "16 known" },
    ],
  },
  {
    id: "pluto",
    name: "Pluto",
    kind: "dwarf",
    radiusKm: 1188.3,
    semiMajorKm: 5_906_380_000,
    periodDays: 90_560,
    rotationDays: -6.38723,
    eccentricity: 0.2488,
    inclination: deg(17.16),
    tilt: deg(122.53),
    swatch: "#c4b4a4",
    blurb:
      "A heart-marked wanderer of the Kuiper Belt. Demoted, not diminished — still the soul of the outer dark.",
    facts: [
      { label: "Class", value: "Dwarf planet" },
      { label: "Radius", value: "1,188 km" },
      { label: "Year", value: "248 Earth years" },
      { label: "Day", value: "6.4 Earth days ↺" },
      { label: "Moons", value: "5" },
    ],
  },
];

/**
 * The major moons: every satellite large enough to be round, plus a few small
 * ones too interesting to leave out (Phobos, Amalthea, Hyperion, Phoebe).
 * Radii and elements are JPL values; rotation is set equal to the orbital
 * period for the tidally locked majority.
 */
type MoonSeed = {
  id: string;
  name: string;
  parentId: string;
  radiusKm: number;
  semiMajorKm: number;
  periodDays: number;
  eccentricity: number;
  inclinationDeg: number;
  /** Omitted when tidally locked (rotation = orbital period). */
  rotationDays?: number;
  swatch: string;
  blurb: string;
};

const MOON_SEEDS: MoonSeed[] = [
  {
    id: "luna", name: "Moon", parentId: "earth",
    radiusKm: 1737.4, semiMajorKm: 384_400, periodDays: 27.322,
    eccentricity: 0.0554, inclinationDeg: 5.16, swatch: "#b8b4ae",
    blurb: "Our own. Tidally locked, so one face has never been seen from the ground.",
  },
  {
    id: "phobos", name: "Phobos", parentId: "mars",
    radiusKm: 11.08, semiMajorKm: 9375, periodDays: 0.3187,
    eccentricity: 0.015, inclinationDeg: 1.1, swatch: "#8a7d70",
    blurb: "A potato of a moon skimming so low it laps Mars three times a day, and slowly falling.",
  },
  {
    id: "deimos", name: "Deimos", parentId: "mars",
    radiusKm: 6.2, semiMajorKm: 23_457, periodDays: 1.2625,
    eccentricity: 0.0, inclinationDeg: 1.8, swatch: "#9c8f80",
    blurb: "The smaller, further Martian rock. From the surface it is barely more than a bright star.",
  },
  {
    id: "io", name: "Io", parentId: "jupiter",
    radiusKm: 1821.49, semiMajorKm: 421_800, periodDays: 1.762732,
    eccentricity: 0.004, inclinationDeg: 0.0, swatch: "#e8d24a",
    blurb: "The most volcanic world known. Jupiter's tides knead it until sulfur plumes reach space.",
  },
  {
    id: "europa", name: "Europa", parentId: "jupiter",
    radiusKm: 1560.8, semiMajorKm: 671_100, periodDays: 3.525463,
    eccentricity: 0.009, inclinationDeg: 0.5, swatch: "#d8c9a8",
    blurb: "A cracked shell of ice over a salt ocean holding more water than all of Earth's.",
  },
  {
    id: "ganymede", name: "Ganymede", parentId: "jupiter",
    radiusKm: 2631.2, semiMajorKm: 1_070_400, periodDays: 7.155588,
    eccentricity: 0.001, inclinationDeg: 0.2, swatch: "#9c9187",
    blurb: "The largest moon in the solar system — bigger than Mercury, and the only one with a magnetic field.",
  },
  {
    id: "callisto", name: "Callisto", parentId: "jupiter",
    radiusKm: 2410.3, semiMajorKm: 1_882_700, periodDays: 16.69044,
    eccentricity: 0.007, inclinationDeg: 0.3, swatch: "#6f665e",
    blurb: "The most heavily cratered object known. Its surface has barely changed in four billion years.",
  },
  {
    id: "amalthea", name: "Amalthea", parentId: "jupiter",
    radiusKm: 83.5, semiMajorKm: 181_400, periodDays: 0.499918,
    eccentricity: 0.003, inclinationDeg: 0.4, swatch: "#a85a48",
    blurb: "A small red shard orbiting inside Io, redder than anything else in the solar system.",
  },
  {
    id: "mimas", name: "Mimas", parentId: "saturn",
    radiusKm: 198.2, semiMajorKm: 186_000, periodDays: 0.942422,
    eccentricity: 0.02, inclinationDeg: 1.6, swatch: "#b9b4ad",
    blurb: "Dominated by the crater Herschel, which makes it look uncannily like a certain battle station.",
  },
  {
    id: "enceladus", name: "Enceladus", parentId: "saturn",
    radiusKm: 252.1, semiMajorKm: 238_400, periodDays: 1.370218,
    eccentricity: 0.005, inclinationDeg: 0.0, swatch: "#eef2f5",
    blurb: "Geysers of ocean water jet from its south pole and feed Saturn's E ring. The whitest world here.",
  },
  {
    id: "tethys", name: "Tethys", parentId: "saturn",
    radiusKm: 531.1, semiMajorKm: 295_000, periodDays: 1.887802,
    eccentricity: 0.001, inclinationDeg: 1.1, swatch: "#ccc6bd",
    blurb: "Almost pure ice, split by Ithaca Chasma — a canyon running most of the way around it.",
  },
  {
    id: "dione", name: "Dione", parentId: "saturn",
    radiusKm: 561.4, semiMajorKm: 377_700, periodDays: 2.736916,
    eccentricity: 0.002, inclinationDeg: 0.0, swatch: "#c2bcb2",
    blurb: "Laced with bright ice cliffs that Voyager mistook for wisps of cloud.",
  },
  {
    id: "rhea", name: "Rhea", parentId: "saturn",
    radiusKm: 763.5, semiMajorKm: 527_200, periodDays: 4.517503,
    eccentricity: 0.001, inclinationDeg: 0.3, swatch: "#bdb7ae",
    blurb: "Saturn's second largest: a dirty snowball that may carry a tenuous ring of its own.",
  },
  {
    id: "titan", name: "Titan", parentId: "saturn",
    radiusKm: 2574.76, semiMajorKm: 1_221_900, periodDays: 15.945448,
    eccentricity: 0.029, inclinationDeg: 0.3, swatch: "#d9a84a",
    blurb: "The only moon with a thick atmosphere, and the only other place with liquid on its surface — methane rivers and seas.",
  },
  {
    id: "hyperion", name: "Hyperion", parentId: "saturn",
    radiusKm: 135, semiMajorKm: 1_481_500, periodDays: 21.276658,
    eccentricity: 0.105, inclinationDeg: 0.6, rotationDays: 0.55, swatch: "#a89578",
    blurb: "A sponge-like rubble pile that tumbles chaotically — its rotation is genuinely unpredictable.",
  },
  {
    id: "iapetus", name: "Iapetus", parentId: "saturn",
    radiusKm: 734.3, semiMajorKm: 3_561_700, periodDays: 79.331002,
    eccentricity: 0.028, inclinationDeg: 7.6, swatch: "#8d8377",
    blurb: "Two-toned: one hemisphere as bright as snow, the other as dark as coal, with a ridge along its equator.",
  },
  {
    id: "phoebe", name: "Phoebe", parentId: "saturn",
    radiusKm: 106.5, semiMajorKm: 12_929_400, periodDays: 550.30391,
    eccentricity: 0.164, inclinationDeg: 175.2, rotationDays: 0.3866, swatch: "#5a544e",
    blurb: "A captured Kuiper Belt object going the wrong way round, far outside the other moons.",
  },
  {
    id: "miranda", name: "Miranda", parentId: "uranus",
    radiusKm: 235.8, semiMajorKm: 129_846, periodDays: 1.413479,
    eccentricity: 0.001, inclinationDeg: 4.4, swatch: "#a8adb0",
    blurb: "A shattered jumble with cliffs twenty kilometres high — the tallest known anywhere.",
  },
  {
    id: "ariel", name: "Ariel", parentId: "uranus",
    radiusKm: 578.9, semiMajorKm: 190_929, periodDays: 2.520379,
    eccentricity: 0.001, inclinationDeg: 0.0, swatch: "#bfc4c6",
    blurb: "The brightest Uranian moon, resurfaced by ice flows that erased its oldest craters.",
  },
  {
    id: "umbriel", name: "Umbriel", parentId: "uranus",
    radiusKm: 584.7, semiMajorKm: 265_986, periodDays: 4.144177,
    eccentricity: 0.004, inclinationDeg: 0.1, swatch: "#6e7276",
    blurb: "The darkest of the Uranian moons, marked by one inexplicably bright ring of frost.",
  },
  {
    id: "titania", name: "Titania", parentId: "uranus",
    radiusKm: 788.9, semiMajorKm: 436_298, periodDays: 8.705869,
    eccentricity: 0.002, inclinationDeg: 0.1, swatch: "#a49c95",
    blurb: "Largest of Uranus's moons, cut by enormous rift valleys from an early freeze.",
  },
  {
    id: "oberon", name: "Oberon", parentId: "uranus",
    radiusKm: 761.4, semiMajorKm: 583_511, periodDays: 13.463237,
    eccentricity: 0.002, inclinationDeg: 0.1, swatch: "#8f857c",
    blurb: "The outermost large Uranian moon, its craters floored with dark unexplained material.",
  },
  {
    id: "triton", name: "Triton", parentId: "neptune",
    radiusKm: 1352.6, semiMajorKm: 354_800, periodDays: 5.876994,
    eccentricity: 0.0, inclinationDeg: 157.3, swatch: "#c9d3d6",
    blurb: "Orbits backwards, so it was captured rather than born there. Nitrogen geysers erupt through its pink ice.",
  },
  {
    id: "proteus", name: "Proteus", parentId: "neptune",
    radiusKm: 208, semiMajorKm: 117_600, periodDays: 1.122315,
    eccentricity: 0.0, inclinationDeg: 0.0, swatch: "#6b6a68",
    blurb: "About as large as a body can get while staying lumpy instead of round.",
  },
  {
    id: "nereid", name: "Nereid", parentId: "neptune",
    radiusKm: 170, semiMajorKm: 5_513_900, periodDays: 360.133039,
    eccentricity: 0.751, inclinationDeg: 5.1, rotationDays: 0.48, swatch: "#8b8a86",
    blurb: "The most eccentric orbit of any known moon — it swings from 1.4 to 9.6 million km out.",
  },
  {
    id: "charon", name: "Charon", parentId: "pluto",
    radiusKm: 606, semiMajorKm: 19_600, periodDays: 6.387222,
    eccentricity: 0.0, inclinationDeg: 0.0, swatch: "#9e968d",
    blurb: "Half Pluto's width. The two are locked face to face, orbiting a point in the empty space between them.",
  },
  {
    id: "nix", name: "Nix", parentId: "pluto",
    radiusKm: 18, semiMajorKm: 49_300, periodDays: 24.85,
    eccentricity: 0.015, inclinationDeg: 0.0, rotationDays: 1.83, swatch: "#b3aca3",
    blurb: "A small elongated moon that tumbles unpredictably in Pluto and Charon's shifting pull.",
  },
  {
    id: "hydra", name: "Hydra", parentId: "pluto",
    radiusKm: 18.5, semiMajorKm: 65_200, periodDays: 38.2,
    eccentricity: 0.009, inclinationDeg: 0.3, rotationDays: 0.43, swatch: "#a9a49c",
    blurb: "Pluto's outermost known moon, spinning end over end once every ten hours.",
  },
];

function fmtKm(km: number) {
  return km >= 1000
    ? `${Math.round(km).toLocaleString("en-US")} km`
    : `${km.toLocaleString("en-US", { maximumFractionDigits: 1 })} km`;
}

function fmtPeriod(days: number) {
  const d = Math.abs(days);
  if (d < 1) return `${(d * 24).toFixed(1)} hours`;
  if (d < 400) return `${d.toFixed(d < 10 ? 2 : 1)} days`;
  return `${(d / 365.25).toFixed(1)} years`;
}

export const MOONS: Body[] = MOON_SEEDS.map((m) => {
  const parent = PLANETS.find((p) => p.id === m.parentId)!;
  return {
    id: m.id,
    name: m.name,
    kind: "moon" as const,
    parentId: m.parentId,
    radiusKm: m.radiusKm,
    semiMajorKm: m.semiMajorKm,
    periodDays: m.periodDays,
    // Tidal locking is the rule, not the exception, among the majors.
    rotationDays: m.rotationDays ?? m.periodDays,
    eccentricity: m.eccentricity,
    inclination: deg(m.inclinationDeg),
    tilt: 0,
    swatch: m.swatch,
    blurb: m.blurb,
    facts: [
      { label: "Orbits", value: parent.name },
      { label: "Radius", value: fmtKm(m.radiusKm) },
      { label: "Orbit", value: fmtKm(m.semiMajorKm) },
      { label: "Period", value: fmtPeriod(m.periodDays) },
      {
        label: "Direction",
        value: m.inclinationDeg > 90 ? "Retrograde ↺" : "Prograde",
      },
    ],
  };
});

export const BODIES: Body[] = [SUN, ...PLANETS, ...MOONS];

const BY_ID = new Map(BODIES.map((b) => [b.id, b]));

export function getBody(id: string): Body {
  return BY_ID.get(id) ?? SUN;
}

export function moonsOf(planetId: string): Body[] {
  return MOONS.filter((m) => m.parentId === planetId);
}

/** Focusable top-level entries, in orbital order. */
export const PRIMARIES: Body[] = [SUN, ...PLANETS];

/** Earth years per day, for converting the true periods into sim time. */
const DAYS_PER_YEAR = 365.256;

/**
 * Deterministic per-body starting angle. Hand-authored phases would be
 * arbitrary anyway, and this keeps the 28 moons from launching in a line.
 */
function phaseOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 4294967296) * Math.PI * 2;
}

const PHASE = new Map(BODIES.map((b) => [b.id, phaseOf(b.id)]));

/** Longitude of ascending node — same rationale as the phase. */
const LAN = new Map(BODIES.map((b) => [b.id, phaseOf(`${b.id}-node`)]));

const _scratch: Vec3 = { x: 0, y: 0, z: 0 };

/**
 * Position in the body's own orbital frame (around the Sun for planets, around
 * the parent for moons), in scene units at the current scale.
 */
export function orbitPosition(body: Body, years: number, out: Vec3 = _scratch): Vec3 {
  if (body.semiMajorKm === 0) {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    return out;
  }
  const a =
    body.parentId === undefined
      ? heliocentricUnits(body.semiMajorKm)
      : moonOrbitUnits(body.semiMajorKm, getBody(body.parentId).radiusKm);

  const periodYears = body.periodDays / DAYS_PER_YEAR;
  const theta = (years / periodYears) * Math.PI * 2 + (PHASE.get(body.id) ?? 0);
  const e = body.eccentricity;
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
  const xOrb = r * Math.cos(theta);
  const zOrb = r * Math.sin(theta);
  const y = zOrb * Math.sin(body.inclination);
  const z = zOrb * Math.cos(body.inclination);
  const lan = LAN.get(body.id) ?? 0;
  const c = Math.cos(lan);
  const s = Math.sin(lan);
  out.x = xOrb * c - z * s;
  out.y = y;
  out.z = xOrb * s + z * c;
  return out;
}

/** Axial rotation angle from sim time, so it pauses and scales with speed. */
export function spinAngle(body: Body, years: number): number {
  if (body.rotationDays === 0) return 0;
  return (years * DAYS_PER_YEAR * Math.PI * 2) / body.rotationDays;
}

export const sim = { time: 0 };

export function radiusOf(body: Body): number {
  return radiusUnits(body.radiusKm);
}

/** Distance from the Sun in AU — display only. */
export function distanceAu(body: Body): number {
  return body.semiMajorKm / AU_KM;
}

export { EARTH_RADIUS_KM };

export const view = {
  theta: 0.62,
  phi: 1.12,
  radius: 74,
  goal: 74,
  minR: 8,
  maxR: 170,
  retarget(radius: number) {
    this.goal = Math.min(this.maxR, Math.max(this.minR, radius));
  },
  zoomBy(factor: number) {
    this.radius = Math.min(this.maxR, Math.max(this.minR, this.radius * factor));
    this.goal = this.radius;
  },
};
