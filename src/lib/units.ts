/**
 * Weight unit conversion.
 *
 * Everything is stored in kilograms. `UserSettings.units` is a *display*
 * preference only, so values cross this boundary on their way to the UI
 * and back again on their way to the API — never in the database.
 */
import type { UserUnits } from "./types";

const LB_PER_KG = 2.2046226218;

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

/** Converts a stored kilogram value into the unit the user reads in. */
export function fromKg(kg: number, units: UserUnits): number {
  return units === "lb" ? kgToLb(kg) : kg;
}

/** Converts a value the user typed, in their unit, back into kilograms. */
export function toKg(value: number, units: UserUnits): number {
  return units === "lb" ? lbToKg(value) : value;
}

/**
 * Formats a stored kilogram value for display, e.g. `formatWeight(72.5,
 * "lb")` -> `"159.8"`. Pass `withUnit` to append the suffix.
 */
export function formatWeight(
  kg: number | null | undefined,
  units: UserUnits,
  opts: { decimals?: number; withUnit?: boolean } = {},
): string {
  const { decimals = 1, withUnit = false } = opts;
  if (kg === null || kg === undefined || Number.isNaN(kg)) return "—";
  const value = fromKg(kg, units).toFixed(decimals);
  return withUnit ? `${value} ${units}` : value;
}

/** The suffix to render next to a weight, for labels and placeholders. */
export function unitLabel(units: UserUnits): string {
  return units;
}
