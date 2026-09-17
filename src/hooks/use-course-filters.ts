"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DayOfWeek, DAYS_OF_WEEK } from "@/types/course";
import { APP_CONFIG } from "@/config";

export interface TimeRange {
  startHour: number | null; // null = any start time
  endHour: number | null; // null = any end time
}

export interface CourseFilters {
  days: Record<DayOfWeek, boolean>;
  timeRange: TimeRange;
  preset: string | null;
  hideConflicts: boolean;
}

export interface TimePreset {
  days?: Partial<Record<DayOfWeek, boolean>>;
  startHour?: number | null;
  endHour?: number | null;
}

export type TimePresetKey =
  | "morning"
  | "afternoon"
  | "evening"
  | "noEarly"
  | "weekdays";

export const TIME_PRESETS: Record<TimePresetKey, TimePreset> = {
  morning: {
    endHour: 12,
  },
  afternoon: {
    startHour: 12,
    endHour: 17,
  },
  evening: {
    startHour: 17,
  },
  noEarly: {
    startHour: 9,
  },
  weekdays: {
    days: { Saturday: false, Sunday: false },
  },
};

const DEFAULT_DAYS: Record<DayOfWeek, boolean> = {
  Monday: true,
  Tuesday: true,
  Wednesday: true,
  Thursday: true,
  Friday: true,
  Saturday: true,
  Sunday: true,
};

const DEFAULT_FILTERS: CourseFilters = {
  days: { ...DEFAULT_DAYS },
  timeRange: { startHour: null, endHour: null },
  preset: null,
  hideConflicts: false,
};

export function useCourseFilters() {
  const [filters, setFilters] = useState<CourseFilters>(DEFAULT_FILTERS);
  const [isLoaded, setIsLoaded] = useState(false);
  const t = useTranslations("Filters");
  const tDays = useTranslations("Days");

  // Load from localStorage on mount
  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(
          APP_CONFIG.storageKeys.courseFilters,
        );
        if (stored) {
          const parsed = JSON.parse(stored) as CourseFilters;
          // Ensure all days exist (in case of schema changes)
          const days = { ...DEFAULT_DAYS, ...parsed.days };
          setFilters({ ...parsed, days });
        }
      } catch (error) {
        console.error("Failed to load filters from localStorage:", error);
      }
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  // Save to localStorage whenever filters change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          APP_CONFIG.storageKeys.courseFilters,
          JSON.stringify(filters),
        );
      } catch (error) {
        console.error("Failed to save filters to localStorage:", error);
      }
    }
  }, [filters, isLoaded]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    const hasDayFilter = Object.values(filters.days).some((v) => !v);
    const hasTimeFilter =
      filters.timeRange.startHour !== null ||
      filters.timeRange.endHour !== null;
    return hasDayFilter || hasTimeFilter || filters.hideConflicts;
  }, [filters]);

  // Get descriptive text for active filters
  const getFilterDescription = useCallback((): string => {
    const parts: string[] = [];

    // Day filters
    const activeDays = DAYS_OF_WEEK.filter((day) => filters.days[day]);
    const inactiveDays = DAYS_OF_WEEK.filter((day) => !filters.days[day]);

    if (inactiveDays.length > 0 && inactiveDays.length <= 3) {
      // Show which days are excluded if only a few
      parts.push(
        t("excludedDays", {
          days: inactiveDays.map((day) => tDays(`${day}Short`)).join(", "),
        }),
      );
    } else if (activeDays.length > 0 && activeDays.length <= 3) {
      // Show which days are included if only a few
      parts.push(
        activeDays.map((day) => tDays(`${day}Short`)).join(", "),
      );
    }

    // Time filters
    if (filters.timeRange.startHour !== null) {
      const hour = filters.timeRange.startHour;
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      parts.push(t("afterTime", { time: `${displayHour}${period}` }));
    }
    if (filters.timeRange.endHour !== null) {
      const hour = filters.timeRange.endHour;
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      parts.push(t("beforeTime", { time: `${displayHour}${period}` }));
    }

    return parts.join(", ");
  }, [filters, t, tDays]);

  // Apply a preset
  const applyPreset = useCallback((presetKey: string | null) => {
    if (!presetKey || !(presetKey in TIME_PRESETS)) {
      // Clear preset and reset to defaults
      setFilters(DEFAULT_FILTERS);
      return;
    }

    const preset = TIME_PRESETS[presetKey as TimePresetKey];
    setFilters({
      days: {
        ...DEFAULT_DAYS,
        ...(preset.days || {}),
      },
      timeRange: {
        startHour: preset.startHour ?? null,
        endHour: preset.endHour ?? null,
      },
      preset: presetKey,
      hideConflicts: false,
    });
  }, []);

  // Update days (clears preset)
  const updateDays = useCallback((day: DayOfWeek, enabled: boolean) => {
    setFilters((prev) => ({
      ...prev,
      days: { ...prev.days, [day]: enabled },
      preset: null, // Clear preset on manual change
    }));
  }, []);

  // Update time range (clears preset)
  const updateTimeRange = useCallback(
    (field: "startHour" | "endHour", value: number | null) => {
      setFilters((prev) => ({
        ...prev,
        timeRange: { ...prev.timeRange, [field]: value },
        preset: null, // Clear preset on manual change
      }));
    },
    []
  );

  // Update hide conflicts toggle
  const updateHideConflicts = useCallback((checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      hideConflicts: checked,
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    hasActiveFilters,
    getFilterDescription,
    applyPreset,
    updateDays,
    updateTimeRange,
    updateHideConflicts,
    resetFilters,
    isLoaded,
  };
}
