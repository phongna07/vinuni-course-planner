"use client";

import { useState } from "react";
import { FileText, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SelectedCourse } from "@/types/course";

interface ViewListButtonProps {
  courses: SelectedCourse[];
}

export function ViewListButton({ courses }: ViewListButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("ViewList");
  const tCommon = useTranslations("Common");
  const noCourses = courses.length === 0;

  // Generate the text content for the courses
  const generateCourseList = () => {
    return courses
      .map(
        (course) =>
          `${course["Course Title"]} - ${course.Course} - ${course.Section}`
      )
      .join("\n");
  };

  const courseListText = generateCourseList();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(courseListText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={noCourses}
                  aria-label={t("button")}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("button")}</span>
                </Button>
              </DialogTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {noCourses ? t("addCourses") : t("tooltip")}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent
        className="sm:max-w-[500px]"
        closeLabel={tCommon("close")}
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Textarea
          value={courseListText}
          readOnly
          className="min-h-[200px] font-mono text-sm resize-none"
          placeholder={t("empty")}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t("copy")}
              </>
            )}
          </Button>
          <DialogClose asChild>
            <Button variant="default">{tCommon("close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
