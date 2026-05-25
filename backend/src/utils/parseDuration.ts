/**
 * Parse a human-readable course duration string into a number of days.
 * Supports French and English units.
 *
 * Examples:
 *   "30 jours"   → 30
 *   "12 semaines" → 84
 *   "3 mois"     → 90
 *   "1 an"       → 365
 *   "7 days"     → 7
 *   "4 weeks"    → 28
 *   "30"         → 30  (bare number = days)
 *
 * Returns null when the string cannot be parsed (no expiry will be set).
 */
export function parseDurationToDays(duration: string): number | null {
  if (!duration) return null;

  const lower = duration.toLowerCase().trim();
  const match = lower.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return null;

  const value = parseFloat(match[1].replace(',', '.'));
  if (isNaN(value) || value <= 0) return null;

  const unit = match[2].trim();

  if (!unit) return Math.round(value); // bare number → days

  if (/^(j|jour|jours|day|days|d)$/.test(unit))             return Math.round(value);
  if (/^(sem|semaine|semaines|week|weeks|w)$/.test(unit))    return Math.round(value * 7);
  if (/^(mois|month|months|mo|m)$/.test(unit))              return Math.round(value * 30);
  if (/^(an|ans|année|années|year|years|yr|yrs|y)$/.test(unit)) return Math.round(value * 365);

  return null;
}
