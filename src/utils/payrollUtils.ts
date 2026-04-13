/**
 * Payroll & Invoice Calculation Utilities
 *
 * Business Rules (confirmed by client):
 * - Short notice charges the FACILITY extra but does NOT pay staff extra.
 * - Staff pay = hours × staffRate × holidayMultiplier (no shortNoticeMultiplier).
 * - Invoice  = hours × billingRate × shortNoticeMultiplier × holidayMultiplier + HST.
 *
 * The shortNoticeMultiplier in the Staff Rates table should always be 1.0.
 * Only the Billing Rates table shortNoticeMultiplier is applied (to facility invoices).
 */

/** Default HST rate: 14% (as applied to facility invoices only) */
export const DEFAULT_HST_RATE = 14;

/**
 * Calculate staff gross pay for a single shift.
 * Staff are NEVER paid extra for short notice — only the holiday multiplier applies.
 *
 * Formula: totalHours × staffRate × holidayMultiplier
 */
export function calculateStaffPay(params: {
  totalHours: number;
  staffRate: number;
  holidayMultiplier?: number;
}): number {
  const { totalHours, staffRate, holidayMultiplier = 1.0 } = params;
  return roundToTwoDecimals(totalHours * staffRate * holidayMultiplier);
}

/**
 * Calculate the invoice line total for a single shift billed to a facility.
 * Short notice multiplier IS applied here — the facility pays the uplift.
 *
 * Formula: totalHours × billingRate × shortNoticeMultiplier × holidayMultiplier
 */
export function calculateInvoiceLineTotal(params: {
  totalHours: number;
  billingRate: number;
  isShortNotice: boolean;
  shortNoticeMultiplier?: number;
  holidayMultiplier?: number;
}): number {
  const {
    totalHours,
    billingRate,
    isShortNotice,
    shortNoticeMultiplier = 1.0,
    holidayMultiplier = 1.0,
  } = params;

  const effectiveShortNoticeMultiplier = isShortNotice ? shortNoticeMultiplier : 1.0;
  return roundToTwoDecimals(
    totalHours * billingRate * effectiveShortNoticeMultiplier * holidayMultiplier
  );
}

/**
 * Calculate HST amount from a subtotal.
 */
export function calculateHST(subtotal: number, hstRate: number = DEFAULT_HST_RATE): number {
  return roundToTwoDecimals(subtotal * (hstRate / 100));
}

/**
 * Calculate the full invoice total (subtotal + HST).
 */
export function calculateInvoiceTotal(subtotal: number, hstRate: number = DEFAULT_HST_RATE): number {
  const hst = calculateHST(subtotal, hstRate);
  return roundToTwoDecimals(subtotal + hst);
}

/**
 * Determine the multiplier to store on a timesheet record for staff pay.
 * Staff pay never includes short notice — only holiday multiplier if applicable.
 */
export function getStaffPayMultiplier(params: {
  isHoliday?: boolean;
  holidayMultiplier?: number;
}): number {
  const { isHoliday = false, holidayMultiplier = 1.5 } = params;
  return isHoliday ? holidayMultiplier : 1.0;
}

/**
 * Determine the effective multiplier for an invoice line item.
 * Combines short notice and holiday multipliers for facility billing.
 */
export function getInvoiceMultiplier(params: {
  isShortNotice?: boolean;
  shortNoticeMultiplier?: number;
  isHoliday?: boolean;
  holidayMultiplier?: number;
}): number {
  const {
    isShortNotice = false,
    shortNoticeMultiplier = 1.0,
    isHoliday = false,
    holidayMultiplier = 1.5,
  } = params;

  const snMultiplier = isShortNotice ? shortNoticeMultiplier : 1.0;
  const holMultiplier = isHoliday ? holidayMultiplier : 1.0;
  return roundToTwoDecimals(snMultiplier * holMultiplier);
}

/** Round a number to 2 decimal places. */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── Pay Period Validation Utilities ──────────────────────────────────────────

/** Bi-weekly pay period anchor: Monday, January 6, 2025 */
const PAY_PERIOD_ANCHOR = new Date(2025, 0, 6);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Validate that the provided periodStart and periodEnd exactly match
 * a valid bi-weekly pay period boundary based on the anchor date
 * Monday January 6, 2025.
 *
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePayPeriodBoundary(
  periodStart: string,
  periodEnd: string
): string | null {
  // Parse dates
  const startDate = parseDateOnly(periodStart);
  const endDate = parseDateOnly(periodEnd);

  if (!startDate || !endDate) {
    return "Invalid date format. Use YYYY-MM-DD.";
  }

  // periodStart must be a Monday (getDay() === 1)
  if (startDate.getDay() !== 1) {
    return "Invalid pay period: periodStart must be a Monday.";
  }

  // The period must be exactly 13 days long (periodEnd = periodStart + 13 days)
  const diffDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / MS_PER_DAY
  );
  if (diffDays !== 13) {
    return "Invalid pay period: period must be exactly 14 days (periodEnd = periodStart + 13 days).";
  }

  // Anchor-based validation: difference in days from anchor to periodStart
  // must be a non-negative multiple of 14
  const daysSinceAnchor = Math.round(
    (startDate.getTime() - PAY_PERIOD_ANCHOR.getTime()) / MS_PER_DAY
  );

  if (daysSinceAnchor < 0 || daysSinceAnchor % 14 !== 0) {
    return "Invalid pay period: dates must align with bi-weekly pay period boundaries starting Jan 6, 2025";
  }

  return null;
}

/**
 * Compute the sequential period number (1-indexed) since the anchor date (Jan 6, 2025).
 */
export function computePeriodNumber(periodStart: string): number {
  const startDate = parseDateOnly(periodStart);
  if (!startDate) return 0;

  const daysSinceAnchor = Math.round(
    (startDate.getTime() - PAY_PERIOD_ANCHOR.getTime()) / MS_PER_DAY
  );
  return Math.floor(daysSinceAnchor / 14) + 1;
}

/**
 * Compute a human-readable period label, e.g. "Feb 3 – Feb 16, 2026"
 */
export function computePeriodLabel(
  periodStart: string,
  periodEnd: string
): string {
  const startDate = parseDateOnly(periodStart);
  const endDate = parseDateOnly(periodEnd);
  if (!startDate || !endDate) return "";

  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const endDay = endDate.getDate();
  const endYear = endDate.getFullYear();

  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${endYear}`;
}

/**
 * Check if timesheets already exist for a given period.
 * Returns the count of matching timesheets, or 0 if none found.
 */
export function countExistingTimesheets(
  timesheets: Array<{ periodStart?: string; periodEnd?: string }>,
  periodStart: string,
  periodEnd: string
): number {
  return timesheets.filter(
    (ts) => ts.periodStart === periodStart && ts.periodEnd === periodEnd
  ).length;
}

/**
 * Build a duplicate prevention error message.
 */
export function buildDuplicateErrorMessage(
  count: number,
  periodStart: string,
  periodEnd: string
): string {
  return `Payroll already generated for this period. ${count} timesheets already exist for ${periodStart} to ${periodEnd}.`;
}

/**
 * Check if a clockOutTime falls strictly within the pay period window
 * [periodStart 00:00:00, periodEnd 23:59:59].
 */
export function isClockOutInPeriod(
  clockOutTime: string,
  periodStart: string,
  periodEnd: string
): boolean {
  const clockOut = new Date(clockOutTime);
  if (isNaN(clockOut.getTime())) return false;

  const start = parseDateOnly(periodStart);
  const end = parseDateOnly(periodEnd);
  if (!start || !end) return false;

  // Set start to 00:00:00.000
  start.setHours(0, 0, 0, 0);
  // Set end to 23:59:59.999
  end.setHours(23, 59, 59, 999);

  return clockOut >= start && clockOut <= end;
}

/**
 * Parse a YYYY-MM-DD date string into a Date object at midnight local time.
 * Returns null if the string is invalid.
 */
function parseDateOnly(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return null;
  return d;
}