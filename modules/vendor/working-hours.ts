export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface DaySchedule {
  open: boolean;
  start: string;
  end: string;
}

export type WeekSchedule = Record<DayKey, DaySchedule>;

export const DAY_ORDER: DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export const DAY_SHORT_LABELS: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const TIME_OPTIONS = Array.from({ length: 36 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const label = `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  return { value, label };
});

export function createDefaultWeekSchedule(): WeekSchedule {
  return DAY_ORDER.reduce<WeekSchedule>((acc, day) => {
    const isWeekday = day !== "sat" && day !== "sun";
    acc[day] = {
      open: isWeekday,
      start: "09:00",
      end: "18:00",
    };
    return acc;
  }, {} as WeekSchedule);
}

function parseTimeToken(raw: string): string | null {
  const match = raw
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const period = match[3];

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (minutes < 0 || minutes > 59) return null;

  if (period === "pm" && hours < 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;
  if (!period && hours <= 12 && hours >= 1) {
    hours = hours === 12 ? 12 : hours;
  }

  if (hours < 0 || hours > 23) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTimeLabel(value: string): string {
  const option = TIME_OPTIONS.find((item) => item.value === value);
  return option?.label ?? value;
}

function expandDayRange(start: DayKey, end: DayKey): DayKey[] {
  const startIndex = DAY_ORDER.indexOf(start);
  const endIndex = DAY_ORDER.indexOf(end);
  if (startIndex < 0 || endIndex < 0) return [];
  if (startIndex <= endIndex) {
    return DAY_ORDER.slice(startIndex, endIndex + 1);
  }
  return [...DAY_ORDER.slice(startIndex), ...DAY_ORDER.slice(0, endIndex + 1)];
}

function applyDays(
  schedule: WeekSchedule,
  days: DayKey[],
  start: string,
  end: string,
) {
  for (const day of DAY_ORDER) {
    schedule[day].open = days.includes(day);
    if (days.includes(day)) {
      schedule[day].start = start;
      schedule[day].end = end;
    }
  }
}

export function parseWorkingHours(value: string | null | undefined): WeekSchedule {
  const schedule = createDefaultWeekSchedule();
  const text = value?.trim();
  if (!text) return schedule;

  const lower = text.toLowerCase();
  if (lower.includes("24/7") || lower.includes("24 hours")) {
    return DAY_ORDER.reduce<WeekSchedule>((acc, day) => {
      acc[day] = { open: true, start: "00:00", end: "23:30" };
      return acc;
    }, {} as WeekSchedule);
  }

  const segments = text.split(",").map((part) => part.trim()).filter(Boolean);
  let matched = false;

  for (const segment of segments) {
    const rangeMatch = segment.match(
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:[–-](Mon|Tue|Wed|Thu|Fri|Sat|Sun))?\s+(.+)$/i,
    );
    if (!rangeMatch) continue;

    const startDay = rangeMatch[1].toLowerCase().slice(0, 3) as DayKey;
    const endDay = (
      rangeMatch[2] ? rangeMatch[2].toLowerCase().slice(0, 3) : rangeMatch[1].toLowerCase().slice(0, 3)
    ) as DayKey;
    const timePart = rangeMatch[3];
    const timeMatch = timePart.match(
      /(.+?)\s*[–-]\s*(.+)$/,
    );
    if (!timeMatch) continue;

    const start = parseTimeToken(timeMatch[1].replace(/\s+/g, ""));
    const end = parseTimeToken(timeMatch[2].replace(/\s+/g, ""));
    if (!start || !end) continue;

    const days = expandDayRange(startDay, endDay);
    if (days.length === 0) continue;

    applyDays(schedule, days, start, end);
    matched = true;
  }

  if (matched) return schedule;

  const legacyTimeMatch = text.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  );
  if (legacyTimeMatch) {
    const start = parseTimeToken(legacyTimeMatch[1].replace(/\s+/g, ""));
    const end = parseTimeToken(legacyTimeMatch[2].replace(/\s+/g, ""));
    if (start && end) {
      let days: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
      if (/mon\s*[–-]\s*sat/i.test(text)) {
        days = [...days, "sat"];
      } else if (/mon\s*[–-]\s*sun/i.test(text)) {
        days = DAY_ORDER;
      } else if (/mon\s*[–-]\s*fri/i.test(text)) {
        days = ["mon", "tue", "wed", "thu", "fri"];
      }
      applyDays(schedule, days, start, end);
    }
  }

  return schedule;
}

export function formatWorkingHours(schedule: WeekSchedule): string {
  const segments: string[] = [];
  let index = 0;

  while (index < DAY_ORDER.length) {
    const day = DAY_ORDER[index];
    const current = schedule[day];
    if (!current.open) {
      index += 1;
      continue;
    }

    let endIndex = index;
    while (endIndex + 1 < DAY_ORDER.length) {
      const nextDay = DAY_ORDER[endIndex + 1];
      const next = schedule[nextDay];
      if (
        next.open &&
        next.start === current.start &&
        next.end === current.end
      ) {
        endIndex += 1;
      } else {
        break;
      }
    }

    const startLabel = DAY_SHORT_LABELS[DAY_ORDER[index]];
    const endLabel = DAY_SHORT_LABELS[DAY_ORDER[endIndex]];
    const dayLabel =
      index === endIndex ? startLabel : `${startLabel}–${endLabel}`;
    segments.push(
      `${dayLabel} ${formatTimeLabel(current.start)}–${formatTimeLabel(current.end)}`,
    );
    index = endIndex + 1;
  }

  return segments.join(", ");
}