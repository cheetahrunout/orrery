/**
 * Scene scaling.
 *
 * All body data is stored in true physical units (km, days). Nothing is
 * pre-scaled, so the two controls here are the only thing standing between the
 * data and the screen.
 *
 * Why two controls: scaling sizes and orbits by the same factor is just a
 * camera zoom and changes nothing on screen. Only the *ratio* between body size
 * and orbit size is visible, so one knob sets orbit spread and the other sets
 * body size, and their combination is the realism.
 *
 * Why sizes use an exponent rather than a multiplier: a uniform multiplier
 * cannot produce a readable orrery. The Sun is 109 Earth radii, so any factor
 * that makes Earth visible makes the Sun swallow the inner planets. The
 * exponent compresses the range instead — and at 1.0 it is the identity, so
 * true scale is a real, reachable setting rather than an approximation.
 */

export const EARTH_RADIUS_KM = 6371;
export const AU_KM = 149_597_870.7;

/** Orbit divisor: 1 = true distances, 10000 = squeezed into a toy. */
export const DISTANCE_DIV_MIN = 1;
export const DISTANCE_DIV_MAX = 10_000;

/** Size exponent: 1 = true radii (Earth = 1 unit), lower = compressed range. */
export const SIZE_EXP_MIN = 0.3;
export const SIZE_EXP_MAX = 1;

export type ScaleSettings = { distanceDiv: number; sizeExp: number };

/** Reads well and keeps every planet on screen at once. */
export const ORRERY_PRESET: ScaleSettings = { distanceDiv: 1276, sizeExp: 0.4 };
/** Everything exactly as it is: sizes, orbits, and moon orbits all true. */
export const TRUE_PRESET: ScaleSettings = { distanceDiv: 1, sizeExp: 1 };

/**
 * Live scale, mirrored out of the zustand store so `useFrame` can read it
 * without subscribing (same pattern as `sim` and `view`).
 */
export const scale: ScaleSettings = { ...ORRERY_PRESET };

/** Rendered radius in scene units, where 1 unit = 1 Earth radius at exp 1. */
export function radiusUnits(radiusKm: number): number {
  return (radiusKm / EARTH_RADIUS_KM) ** scale.sizeExp;
}

/**
 * Orbit spacing exponent, derived from the compression setting.
 *
 * True spacing (exponent 1) puts Mercury 78x closer to the Sun than Neptune,
 * so any view holding the whole system buries the inner planets in the Sun's
 * disc. Compressing the spacing is what makes a drawn orrery readable, so the
 * exponent relaxes toward 1 as the divisor approaches true distance: at ÷1 the
 * spacing is exactly real, and nothing is compressed behind your back.
 */
export function orbitExp(distanceDiv = scale.distanceDiv): number {
  const t = Math.log10(Math.max(distanceDiv, 1)) / Math.log10(DISTANCE_DIV_MAX);
  return 1 - 0.56 * Math.min(Math.max(t, 0), 1);
}

/** Rendered orbit radius for a body going around the Sun. */
export function heliocentricUnits(semiMajorKm: number): number {
  const au = semiMajorKm / AU_KM;
  // Normalised on Earth, so 1 AU is always AU_KM/Re/div regardless of exponent.
  return (AU_KM / EARTH_RADIUS_KM / scale.distanceDiv) * au ** orbitExp();
}

/**
 * Rendered orbit radius for a moon, expressed relative to its parent's drawn
 * size. Using the heliocentric divisor here would bury every moon inside its
 * planet — at ÷420 the Moon would orbit 0.15 units from an Earth of radius 1.
 * Sharing the size exponent keeps exp 1 exactly true.
 */
export function moonOrbitUnits(semiMajorKm: number, parentRadiusKm: number): number {
  return radiusUnits(parentRadiusKm) * (semiMajorKm / parentRadiusKm) ** scale.sizeExp;
}

/**
 * How many times larger bodies appear than they truly are, relative to orbit
 * distances — the honest number behind whatever the sliders are set to.
 * 1 means the view is not lying.
 */
export function exaggeration(): number {
  // Measured on Earth: rendered radius/orbit vs the true ratio.
  const rendered = radiusUnits(EARTH_RADIUS_KM) / heliocentricUnits(AU_KM);
  const truth = EARTH_RADIUS_KM / AU_KM;
  return rendered / truth;
}

/** AU to scene units at the current orbit compression. */
export function auToUnits(au: number, distanceDiv = scale.distanceDiv): number {
  return (AU_KM / EARTH_RADIUS_KM / distanceDiv) * au ** orbitExp(distanceDiv);
}

/** Scene units back to AU — the inverse of `auToUnits`. */
export function unitsToAu(units: number, distanceDiv = scale.distanceDiv): number {
  const perAu = AU_KM / EARTH_RADIUS_KM / distanceDiv;
  return (units / perAu) ** (1 / orbitExp(distanceDiv));
}
