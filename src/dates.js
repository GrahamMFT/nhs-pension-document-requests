const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatLong(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShort(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Add calendar months, clamping the day (31 January + 1 month = 28/29 February). */
export function addMonths(date, months) {
  const shifted = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(date.getDate(), lastDay));
  return shifted;
}

/**
 * Later of (today + 3 months) and 6 October following the end of the latest
 * complete tax year. Matches the deadline stated in the pension savings
 * statement request.
 */
export function statutoryDeadline(today) {
  const day = startOfDay(today);
  const plusThree = addMonths(day, 3);
  const onOrAfter6April = day.getMonth() > 3 || (day.getMonth() === 3 && day.getDate() >= 6);
  const october = new Date(onOrAfter6April ? day.getFullYear() : day.getFullYear() - 1, 9, 6);
  return plusThree > october ? plusThree : october;
}

/** Next 31 March on or after today, written the way the estimate template uses it. */
export function defaultEstimateDate(today) {
  const day = startOfDay(today);
  const year = day.getMonth() > 2 ? day.getFullYear() + 1 : day.getFullYear();
  return `31st March ${year}`;
}

export function parseDob(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}
