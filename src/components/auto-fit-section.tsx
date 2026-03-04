"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Wand2,
  X,
  Check,
  ChevronsUpDown,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  ListPlus,
  Star,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Course } from "@/types/course";
import { hasValidSchedule, calculateTotalCredits } from "@/lib/schedule-utils";
import { autoFitSchedule } from "@/lib/auto-fit-algorithm";

const AUTOFIT_STORAGE_KEY = "vinuni-autofit-config";

interface AutoFitSectionProps {
  allCourses: Course[];
  onApply: (courses: Course[]) => void;
}

/**
 * Derive unique course titles from all courses.
 * Excludes 0-credit courses. Returns sorted array of unique titles.
 */
function getUniqueTitles(courses: Course[]): string[] {
  const titles = new Set<string>();
  for (const c of courses) {
    if (parseFloat(c.Credits) > 0) {
      titles.add(c["Course Title"]);
    }
  }
  return [...titles].sort();
}

/**
 * Multi-select combobox for course titles.
 */
function CourseTitleSelect({
  label,
  icon: Icon,
  placeholder,
  allTitles,
  selectedTitles,
  disabledTitles,
  onToggle,
  variant,
}: {
  label: string;
  icon: React.ElementType;
  placeholder: string;
  allTitles: string[];
  selectedTitles: string[];
  disabledTitles: Set<string>;
  onToggle: (title: string) => void;
  variant: "elective" | "mandatory";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return allTitles;
    const q = search.toLowerCase();
    return allTitles.filter((t) => t.toLowerCase().includes(q));
  }, [allTitles, search]);

  const selectedSet = useMemo(() => new Set(selectedTitles), [selectedTitles]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        <Icon className="h-4 w-4" />
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 py-2"
          >
            <span className="text-muted-foreground text-sm truncate">
              {selectedTitles.length === 0
                ? placeholder
                : `${selectedTitles.length} course${selectedTitles.length > 1 ? "s" : ""} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search courses..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[250px]">
              <CommandEmpty>No courses found.</CommandEmpty>
              <CommandGroup>
                {filtered.map((title) => {
                  const isSelected = selectedSet.has(title);
                  const isDisabled = disabledTitles.has(title);
                  return (
                    <CommandItem
                      key={title}
                      value={title}
                      onSelect={() => {
                        if (!isDisabled) onToggle(title);
                      }}
                      disabled={isDisabled}
                      className="py-2.5 cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected
                            ? variant === "elective"
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span
                        className={cn("text-sm", isDisabled && "opacity-50")}
                      >
                        {title}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {/* Selected tags */}
      {selectedTitles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTitles.map((title) => (
            <Badge
              key={title}
              variant={variant === "elective" ? "secondary" : "default"}
              className="text-xs gap-1 pr-1"
            >
              <span className="max-w-[200px] truncate">{title}</span>
              <button
                onClick={() => onToggle(title)}
                className="ml-0.5 rounded-full hover:bg-white/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A compact card showing one course in a combination result.
 */
function CombinationCourseItem({ course }: { course: Course }) {
  const hasSched = hasValidSchedule(course);
  return (
    <div className="flex items-start gap-2 py-1.5 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="secondary"
            className="font-mono text-[10px] px-1.5 py-0"
          >
            {course.Course}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {course.Section}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {course.Credits} cr
          </span>
        </div>
        <p className="text-xs font-medium mt-0.5 line-clamp-1">
          {course["Course Title"]}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <User className="h-2.5 w-2.5" />
            {course.Instructor}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {hasSched
              ? course.Schedule.map(
                  (s) => `${s.day.slice(0, 3)} ${s.time}`,
                ).join(", ")
              : "TBA"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AutoFitSection({ allCourses, onApply }: AutoFitSectionProps) {
  const [optionalElectiveTitles, setOptionalElectiveTitles] = useState<
    string[]
  >([]);
  const [mandatoryTitles, setMandatoryTitles] = useState<string[]>([]);
  const [maxCredits, setMaxCredits] = useState(18);
  const [numCombinations, setNumCombinations] = useState(5);
  const [results, setResults] = useState<Course[][] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const allTitles = useMemo(() => getUniqueTitles(allCourses), [allCourses]);

  // Load from localStorage on mount (once allTitles is available)
  useEffect(() => {
    if (allTitles.length === 0) return;
    try {
      const stored = localStorage.getItem(AUTOFIT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          mandatoryTitles?: string[];
          optionalElectiveTitles?: string[];
          maxCredits?: number;
          numCombinations?: number;
        };
        const validTitles = new Set(allTitles);

        // Validate titles against current course data
        const validMandatory = (parsed.mandatoryTitles ?? []).filter((t) =>
          validTitles.has(t),
        );
        const mandatorySet = new Set(validMandatory);
        // Ensure mutual exclusivity
        const validElectives = (parsed.optionalElectiveTitles ?? []).filter(
          (t) => validTitles.has(t) && !mandatorySet.has(t),
        );

        setMandatoryTitles(validMandatory);
        setOptionalElectiveTitles(validElectives);
        if (typeof parsed.maxCredits === "number" && parsed.maxCredits > 0) {
          setMaxCredits(parsed.maxCredits);
        }
        if (
          typeof parsed.numCombinations === "number" &&
          parsed.numCombinations > 0
        ) {
          setNumCombinations(parsed.numCombinations);
        }
      }
    } catch (error) {
      console.error("Failed to load auto-fit config from localStorage:", error);
    }
    setIsLoaded(true);
  }, [allTitles]);

  // Save to localStorage whenever config changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        AUTOFIT_STORAGE_KEY,
        JSON.stringify({
          mandatoryTitles,
          optionalElectiveTitles,
          maxCredits,
          numCombinations,
        }),
      );
    } catch (error) {
      console.error("Failed to save auto-fit config to localStorage:", error);
    }
  }, [
    mandatoryTitles,
    optionalElectiveTitles,
    maxCredits,
    numCombinations,
    isLoaded,
  ]);
  const optionalElectiveSet = useMemo(
    () => new Set(optionalElectiveTitles),
    [optionalElectiveTitles],
  );
  const mandatorySet = useMemo(
    () => new Set(mandatoryTitles),
    [mandatoryTitles],
  );

  // Filtered title lists: mandatory courses don't appear in elective dropdown and vice versa
  const electiveTitleOptions = useMemo(
    () => allTitles.filter((t) => !mandatorySet.has(t)),
    [allTitles, mandatorySet],
  );
  const mandatoryTitleOptions = useMemo(
    () => allTitles.filter((t) => !optionalElectiveSet.has(t)),
    [allTitles, optionalElectiveSet],
  );

  const toggleOptionalElective = useCallback((title: string) => {
    setOptionalElectiveTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
    // Reset results when config changes
    setResults(null);
    setMessage(null);
    setAppliedIndex(null);
  }, []);

  const toggleMandatory = useCallback((title: string) => {
    setMandatoryTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
    // Also remove from optional electives if it was there
    setOptionalElectiveTitles((prev) => prev.filter((t) => t !== title));
    setResults(null);
    setMessage(null);
    setAppliedIndex(null);
  }, []);

  const handleAutoFit = useCallback(() => {
    setIsRunning(true);
    setResults(null);
    setMessage(null);
    setAppliedIndex(null);

    // Use setTimeout to let the UI update before running the (synchronous) algorithm
    setTimeout(() => {
      const result = autoFitSchedule({
        allCourses,
        mandatoryTitles,
        optionalElectiveTitles,
        maxCredits,
        numCombinations,
      });

      setResults(result.combinations);
      setMessage(result.message ?? null);
      setIsRunning(false);
    }, 50);
  }, [
    allCourses,
    mandatoryTitles,
    optionalElectiveTitles,
    maxCredits,
    numCombinations,
  ]);

  const handleApply = useCallback(
    (index: number) => {
      if (results && results[index]) {
        onApply(results[index]);
        setAppliedIndex(index);
      }
    },
    [results, onApply],
  );

  return (
    <section className="mt-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Auto Fit Schedule</CardTitle>
          </div>
          <CardDescription>
            Select mandatory courses (required next semester) and optional
            elective courses you&apos;re interested in, then let the algorithm
            find the best conflict-free schedules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-950/40 dark:text-yellow-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <p>
              Don&apos;t trust this tool 100%. Please double-check the generated
              schedule and verify that the assigned sections match your desired
              learning pathway.
            </p>
          </div>
          {/* Configuration area */}
          <div className="grid gap-6 md:grid-cols-2">
            <CourseTitleSelect
              label="Mandatory Courses"
              icon={Star}
              placeholder="Select mandatory courses..."
              allTitles={mandatoryTitleOptions}
              selectedTitles={mandatoryTitles}
              disabledTitles={new Set()}
              onToggle={toggleMandatory}
              variant="mandatory"
            />
            <CourseTitleSelect
              label="Optional Elective Courses"
              icon={ListPlus}
              placeholder="Select optional elective courses..."
              allTitles={electiveTitleOptions}
              selectedTitles={optionalElectiveTitles}
              disabledTitles={new Set()}
              onToggle={toggleOptionalElective}
              variant="elective"
            />
          </div>

          {/* Max credits & number of combinations inputs */}
          <div className="flex items-end gap-4">
            <div className="space-y-2 w-48">
              <Label htmlFor="max-credits" className="text-sm font-medium">
                Max Total Credits
              </Label>
              <Input
                id="max-credits"
                type="number"
                min={1}
                max={30}
                value={maxCredits}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    setMaxCredits(val);
                    setResults(null);
                    setMessage(null);
                    setAppliedIndex(null);
                  }
                }}
              />
            </div>
            <div className="space-y-2 w-48">
              <Label htmlFor="num-combinations" className="text-sm font-medium">
                Number of Combinations
              </Label>
              <Input
                id="num-combinations"
                type="number"
                min={1}
                max={50}
                value={numCombinations}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    setNumCombinations(val);
                    setResults(null);
                    setMessage(null);
                    setAppliedIndex(null);
                  }
                }}
              />
            </div>
            <Button
              onClick={handleAutoFit}
              disabled={
                isRunning ||
                mandatoryTitles.length + optionalElectiveTitles.length < 1
              }
              size="lg"
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Auto Fit
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {message && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {message}
              </p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {results.length} Schedule Option{results.length > 1 ? "s" : ""}{" "}
                Found
              </h3>
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                {results.map((combination, index) => {
                  const totalCredits = calculateTotalCredits(combination);
                  const isApplied = appliedIndex === index;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "rounded-lg border p-4 transition-colors",
                        isApplied
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : "border-border hover:border-primary/30",
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isApplied ? "default" : "secondary"}
                            className="text-sm"
                          >
                            Option {index + 1}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {combination.length} course
                            {combination.length !== 1 ? "s" : ""} •{" "}
                            {totalCredits} credits
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={isApplied ? "outline" : "default"}
                          className="gap-1.5"
                          onClick={() => handleApply(index)}
                          disabled={isApplied}
                        >
                          {isApplied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Applied
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-3.5 w-3.5" />
                              Apply Schedule
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="divide-y divide-border/50">
                        {combination.map((course) => (
                          <CombinationCourseItem
                            key={course.Section}
                            course={course}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {results && results.length === 0 && !message && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                No valid schedule combinations found. Try adjusting your
                selections.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
