"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SelectedCourse } from "@/types/course";
import { downloadICS, canExportCourses } from "@/lib/ics-generator";

interface ExportCalendarButtonProps {
  courses: SelectedCourse[];
}

export function ExportCalendarButton({ courses }: ExportCalendarButtonProps) {
  const t = useTranslations("ExportCalendar");
  const canExport = canExportCourses(courses);
  const hasConflicts = courses.some((c) => c.hasConflict);
  const noCourses = courses.length === 0;

  const getTooltipMessage = () => {
    if (noCourses) return t("addCourses");
    if (hasConflicts) return t("resolveConflicts");
    return t("tooltip");
  };

  const handleExport = () => {
    if (canExport) {
      downloadICS(courses);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExport}
              disabled={!canExport}
              aria-label={t("button")}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t("button")}</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipMessage()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
