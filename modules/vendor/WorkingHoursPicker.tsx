"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DAY_ORDER,
  DAY_SHORT_LABELS,
  TIME_OPTIONS,
  formatWorkingHours,
  parseWorkingHours,
  type DayKey,
  type WeekSchedule,
} from "@/modules/vendor/working-hours";

interface WorkingHoursPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const WEEKDAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKEND: DayKey[] = ["sat", "sun"];

function cloneSchedule(schedule: WeekSchedule): WeekSchedule {
  return DAY_ORDER.reduce<WeekSchedule>((acc, day) => {
    acc[day] = { ...schedule[day] };
    return acc;
  }, {} as WeekSchedule);
}

function getOpenDays(schedule: WeekSchedule): DayKey[] {
  return DAY_ORDER.filter((day) => schedule[day].open);
}

function getPrimaryHours(schedule: WeekSchedule) {
  const reference =
    WEEKDAYS.find((day) => schedule[day].open) ??
    DAY_ORDER.find((day) => schedule[day].open);
  if (!reference) {
    return { start: "09:00", end: "18:00" };
  }
  return {
    start: schedule[reference].start,
    end: schedule[reference].end,
  };
}

function weekendDiffersFromPrimary(
  schedule: WeekSchedule,
  primary: { start: string; end: string },
) {
  return WEEKEND.some((day) => {
    if (!schedule[day].open) return false;
    return (
      schedule[day].start !== primary.start ||
      schedule[day].end !== primary.end
    );
  });
}

function TimeRangeSelects({
  start,
  end,
  onStartChange,
  onEndChange,
  compact,
}: {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={start} onValueChange={onStartChange}>
        <SelectTrigger className={compact ? "h-8 w-[112px]" : "w-[130px]"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIME_OPTIONS.map((option) => (
            <SelectItem key={`start-${option.value}`} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">to</span>
      <Select value={end} onValueChange={onEndChange}>
        <SelectTrigger className={compact ? "h-8 w-[112px]" : "w-[130px]"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIME_OPTIONS.map((option) => (
            <SelectItem key={`end-${option.value}`} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function WorkingHoursPicker({
  value,
  onChange,
}: WorkingHoursPickerProps) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() =>
    parseWorkingHours(value),
  );
  const primaryHours = useMemo(() => getPrimaryHours(schedule), [schedule]);
  const [customWeekend, setCustomWeekend] = useState(() =>
    weekendDiffersFromPrimary(schedule, getPrimaryHours(schedule)),
  );

  const preview = useMemo(() => formatWorkingHours(schedule), [schedule]);
  const openDays = useMemo(() => getOpenDays(schedule), [schedule]);

  const updateSchedule = (next: WeekSchedule) => {
    setSchedule(next);
    onChange(formatWorkingHours(next));
  };

  const applyPreset = (preset: "weekdays" | "all-days" | "closed") => {
    const next = cloneSchedule(schedule);
    for (const day of DAY_ORDER) {
      if (preset === "closed") {
        next[day].open = false;
        continue;
      }
      next[day].open =
        preset === "all-days" || (preset === "weekdays" && day !== "sat" && day !== "sun");
      next[day].start = "09:00";
      next[day].end = "18:00";
    }
    setCustomWeekend(false);
    updateSchedule(next);
  };

  const handleDaysChange = (days: string[]) => {
    const next = cloneSchedule(schedule);
    const selected = new Set(days as DayKey[]);
    const hours = getPrimaryHours(next);

    for (const day of DAY_ORDER) {
      const wasOpen = next[day].open;
      next[day].open = selected.has(day);
      if (!wasOpen && next[day].open) {
        if (!customWeekend || !WEEKEND.includes(day)) {
          next[day].start = hours.start;
          next[day].end = hours.end;
        }
      }
    }

    updateSchedule(next);
  };

  const applyPrimaryHours = (start: string, end: string) => {
    const next = cloneSchedule(schedule);
    for (const day of DAY_ORDER) {
      if (!next[day].open) continue;
      if (customWeekend && WEEKEND.includes(day)) continue;
      next[day].start = start;
      next[day].end = end;
    }
    updateSchedule(next);
  };

  const updateWeekendDay = (
    day: DayKey,
    patch: Partial<WeekSchedule[DayKey]>,
  ) => {
    if (day !== "sat" && day !== "sun") return;
    const next = cloneSchedule(schedule);
    next[day] = { ...next[day], ...patch };
    updateSchedule(next);
  };

  const handleCustomWeekendChange = (enabled: boolean) => {
    setCustomWeekend(enabled);
    if (!enabled) {
      const next = cloneSchedule(schedule);
      const hours = getPrimaryHours(next);
      for (const day of WEEKEND) {
        if (next[day].open) {
          next[day].start = hours.start;
          next[day].end = hours.end;
        }
      }
      updateSchedule(next);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" aria-hidden />
          <Label className="text-sm font-medium">Working hours</Label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => applyPreset("weekdays")}
          >
            Weekdays 9–6
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => applyPreset("all-days")}
          >
            All days
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => applyPreset("closed")}
          >
            Closed
          </Button>
        </div>
      </div>

      <ToggleGroup
        type="multiple"
        value={openDays}
        onValueChange={handleDaysChange}
        className="flex flex-wrap justify-start gap-1"
      >
        {DAY_ORDER.map((day) => (
          <ToggleGroupItem
            key={day}
            value={day}
            aria-label={DAY_SHORT_LABELS[day]}
            className="h-8 min-w-10 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {DAY_SHORT_LABELS[day]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {openDays.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TimeRangeSelects
            start={primaryHours.start}
            end={primaryHours.end}
            onStartChange={(start) => applyPrimaryHours(start, primaryHours.end)}
            onEndChange={(end) => applyPrimaryHours(primaryHours.start, end)}
          />
          <div className="flex items-center gap-2">
            <Switch
              id="custom-weekend-hours"
              checked={customWeekend}
              onCheckedChange={handleCustomWeekendChange}
            />
            <Label
              htmlFor="custom-weekend-hours"
              className="text-xs font-normal text-muted-foreground"
            >
              Different Sat/Sun hours
            </Label>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select open days above.</p>
      )}

      {customWeekend && openDays.some((day) => WEEKEND.includes(day)) ? (
        <div className="grid gap-2 rounded-lg border border-border/70 bg-background p-3 sm:grid-cols-2">
          {WEEKEND.map((day) => (
            <div key={day} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {day === "sat" ? "Saturday" : "Sunday"}
              </span>
              {schedule[day].open ? (
                <TimeRangeSelects
                  compact
                  start={schedule[day].start}
                  end={schedule[day].end}
                  onStartChange={(start) => updateWeekendDay(day, { start })}
                  onEndChange={(end) => updateWeekendDay(day, { end })}
                />
              ) : (
                <span className="text-xs text-muted-foreground">Closed</span>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {preview ? (
        <p className="text-xs text-muted-foreground">{preview}</p>
      ) : null}
    </div>
  );
}