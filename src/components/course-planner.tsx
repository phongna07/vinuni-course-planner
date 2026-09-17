"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { AutoFitSection } from "@/components/auto-fit-section";
import { CountdownTimer } from "@/components/countdown-timer";
import { CourseSelector } from "@/components/course-selector";
import {
  CourseFilters,
  CourseFiltersContent,
} from "@/components/course-filters";
import { ExportCalendarButton } from "@/components/export-calendar-button";
import { LanguageToggle } from "@/components/language-toggle";
import { PlanningDisclaimerDialog } from "@/components/planning-disclaimer-dialog";
import { SelectedCourses } from "@/components/selected-courses";
import { SupportProjectButton } from "@/components/support-project-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ViewListButton } from "@/components/view-list-button";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { APP_CONFIG } from "@/config";
import coursesData from "@/data/courses.json";
import coursesMetadata from "@/data/courses.meta.json";
import { useCourseFilters } from "@/hooks/use-course-filters";
import { useSelectedCourses } from "@/hooks/use-selected-courses";
import { APP_TIME_ZONE } from "@/i18n/config";
import { Course } from "@/types/course";

const courses = coursesData as Course[];

export function CoursePlanner() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const format = useFormatter();
  const t = useTranslations("Home");

  const {
    selectedCourses,
    addCourse,
    removeCourse,
    clearAllCourses,
    replaceAllCourses,
    isCourseSelected,
    isCourseCodeSelected,
    isLoaded,
  } = useSelectedCourses();

  const {
    filters,
    hasActiveFilters,
    getFilterDescription,
    applyPreset,
    updateDays,
    updateTimeRange,
    updateHideConflicts,
    resetFilters,
  } = useCourseFilters();

  const lastUpdated = format.dateTime(new Date(coursesMetadata.lastUpdated), {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background">
      <PlanningDisclaimerDialog />

      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-lg font-semibold">{APP_CONFIG.site.name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <SupportProjectButton />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <span className="font-semibold">📋 {t("noticeTitle")}</span>{" "}
            {t("notice", { lastUpdated })}
          </p>
        </div>

        <section className="mb-6">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">
              {t("searchHeading", {
                term: t("termName"),
                count: courses.length,
              })}
            </h2>
            <div className="flex items-center justify-end gap-2">
              <ViewListButton courses={selectedCourses} />
              <ExportCalendarButton courses={selectedCourses} />
              <CourseFilters
                filters={filters}
                hasActiveFilters={hasActiveFilters}
                getFilterDescription={getFilterDescription}
                applyPreset={applyPreset}
                updateDays={updateDays}
                updateTimeRange={updateTimeRange}
                updateHideConflicts={updateHideConflicts}
                resetFilters={resetFilters}
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                selectedCoursesCount={selectedCourses.length}
              />
            </div>
          </div>

          <CourseFiltersContent
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            applyPreset={applyPreset}
            updateDays={updateDays}
            updateTimeRange={updateTimeRange}
            updateHideConflicts={updateHideConflicts}
            resetFilters={resetFilters}
            open={filtersOpen}
            selectedCoursesCount={selectedCourses.length}
          />

          {filtersOpen && <div className="mb-3" />}

          <CourseSelector
            courses={courses}
            selectedCourses={selectedCourses}
            onSelectCourse={addCourse}
            isCourseSelected={isCourseSelected}
            isCourseCodeSelected={isCourseCodeSelected}
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            resetFilters={resetFilters}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("searchHelp")}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          <section className="order-2 min-w-0 lg:order-1">
            <WeeklyCalendar courses={selectedCourses} />
            <CountdownTimer />
          </section>

          <aside className="order-1 lg:relative lg:min-h-0 lg:order-2">
            {isLoaded ? (
              <SelectedCourses
                courses={selectedCourses}
                onRemoveCourse={removeCourse}
                onClearAll={clearAllCourses}
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                  {t("loadingSavedCourses")}
                </div>
              </div>
            )}
          </aside>
        </div>

        <AutoFitSection allCourses={courses} onApply={replaceAllCourses} />
      </main>

      <footer className="mt-8 border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t("footerText")}</p>
          <p className="mx-auto mt-3 max-w-3xl text-xs leading-relaxed">
            {t("disclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
