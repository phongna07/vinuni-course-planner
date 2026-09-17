"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DayOfWeek, DAYS_OF_WEEK } from "@/types/course";
import { APP_CONFIG } from "@/config";
import { formatTime } from "@/lib/schedule-utils";
import {
  CourseFilters as CourseFiltersType,
  TIME_PRESETS,
  TimePresetKey,
} from "@/hooks/use-course-filters";
import { useIsMobile } from "@/hooks/use-mobile";

const {
  startHour: CALENDAR_START_HOUR,
  endHour: CALENDAR_END_HOUR,
} = APP_CONFIG.calendar;

interface CourseFiltersProps {
  filters: CourseFiltersType;
  hasActiveFilters: boolean;
  getFilterDescription: () => string;
  applyPreset: (preset: string | null) => void;
  updateDays: (day: DayOfWeek, checked: boolean) => void;
  updateTimeRange: (
    field: "startHour" | "endHour",
    value: number | null
  ) => void;
  updateHideConflicts: (checked: boolean) => void;
  resetFilters: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCoursesCount: number;
}

// Filter trigger button component
export function CourseFiltersTrigger({
  hasActiveFilters,
  getFilterDescription,
  open,
  onToggle,
}: {
  hasActiveFilters: boolean;
  getFilterDescription: () => string;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("Filters");

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={onToggle}
      aria-label={t("title")}
    >
      <Filter className="h-4 w-4" />
      <span className="hidden sm:inline">{t("title")}</span>
      {hasActiveFilters && (
        <Badge variant="secondary" className="text-xs font-normal">
          {getFilterDescription()}
        </Badge>
      )}
      <ChevronDown
        className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
      />
    </Button>
  );
}

// Filter content panel component
export function CourseFiltersContent({
  filters,
  hasActiveFilters,
  applyPreset,
  updateDays,
  updateTimeRange,
  updateHideConflicts,
  resetFilters,
  selectedCoursesCount,
  open,
}: Omit<CourseFiltersProps, "getFilterDescription" | "onOpenChange">) {
  const isMobile = useIsMobile();
  const t = useTranslations("Filters");
  const tDays = useTranslations("Days");

  // Generate time options for selects (7 AM to 10 PM)
  const timeOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour++) {
      options.push({
        value: hour.toString(),
        label: formatTime(hour),
      });
    }
    return options;
  }, []);

  if (!open) return null;

  return (
    <div className="p-3 sm:p-4 space-y-4 rounded-lg border bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Preset Select */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {t("quickPresets")}
        </Label>
        <Select
          value={filters.preset || ""}
          onValueChange={(value) => applyPreset(value || null)}
        >
          <SelectTrigger className="w-full sm:w-60" size="sm">
            <SelectValue placeholder={t("selectPreset")} />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TIME_PRESETS) as TimePresetKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {t(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day Checkboxes */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("days")}</Label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex items-center gap-1.5">
              <Checkbox
                id={`filter-day-${day}`}
                checked={filters.days[day]}
                onCheckedChange={(checked) => updateDays(day, checked === true)}
              />
              <Label
                htmlFor={`filter-day-${day}`}
                className="text-xs cursor-pointer"
              >
                {isMobile
                  ? tDays(`${day}Narrow`)
                  : tDays(`${day}Short`)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {t("timeRange")}
        </Label>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t("after")}
            </span>
            <Select
              value={filters.timeRange.startHour?.toString() || "any"}
              onValueChange={(value) =>
                updateTimeRange(
                  "startHour",
                  value === "any" ? null : parseInt(value)
                )
              }
            >
              <SelectTrigger className="w-full sm:w-28" size="sm">
                <SelectValue placeholder={t("any")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("any")}</SelectItem>
                {timeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t("before")}
            </span>
            <Select
              value={filters.timeRange.endHour?.toString() || "any"}
              onValueChange={(value) =>
                updateTimeRange(
                  "endHour",
                  value === "any" ? null : parseInt(value)
                )
              }
            >
              <SelectTrigger className="w-full sm:w-28" size="sm">
                <SelectValue placeholder={t("any")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("any")}</SelectItem>
                {timeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {t("options")}
        </Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hide-conflicts"
            checked={filters.hideConflicts}
            onCheckedChange={updateHideConflicts}
            disabled={selectedCoursesCount === 0}
          />
          <Label
            htmlFor="hide-conflicts"
            className="text-sm font-normal cursor-pointer"
          >
            {t("hideConflicts")}
          </Label>
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="w-full sm:w-auto"
        >
          <X className="h-3 w-3 mr-1" />
          {t("reset")}
        </Button>
      )}
    </div>
  );
}

// Combined component for convenience (wraps both trigger and content)
export function CourseFilters(props: CourseFiltersProps) {
  return (
    <>
      <CourseFiltersTrigger
        hasActiveFilters={props.hasActiveFilters}
        getFilterDescription={props.getFilterDescription}
        open={props.open}
        onToggle={() => props.onOpenChange(!props.open)}
      />
    </>
  );
}
