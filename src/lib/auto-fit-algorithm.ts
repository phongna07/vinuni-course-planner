import { Course } from "@/types/course";
import {
  coursesConflict,
  hasValidSchedule,
  calculateTotalCredits,
} from "@/lib/schedule-utils";

/**
 * Shuffle an array in-place using Fisher-Yates algorithm.
 * Returns the same array reference.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Check if a candidate course conflicts with any course in the existing selection.
 */
function conflictsWithAny(candidate: Course, selected: Course[]): boolean {
  return selected.some((s) => coursesConflict(candidate, s));
}

/**
 * Get a unique key for a combination (sorted section IDs).
 */
function combinationKey(courses: Course[]): string {
  return courses
    .map((c) => c.Section)
    .sort()
    .join(",");
}

export interface AutoFitInput {
  /** All available course data */
  allCourses: Course[];
  /** Course titles that are mandatory (must appear in every combination) */
  mandatoryTitles: string[];
  /** Course titles the user is interested in as optional electives */
  optionalElectiveTitles: string[];
  /** Maximum total credits allowed */
  maxCredits: number;
}

export interface AutoFitResult {
  /** Up to 5 unique schedule combinations */
  combinations: Course[][];
  /** Message if no combinations were found */
  message?: string;
}

/**
 * Groups courses by their "Course Title".
 * Returns a Map where each key is a course title and
 * value is the array of sections (Course objects) for that title.
 */
function groupByTitle(courses: Course[]): Map<string, Course[]> {
  const groups = new Map<string, Course[]>();
  for (const course of courses) {
    const title = course["Course Title"];
    if (!groups.has(title)) {
      groups.set(title, []);
    }
    groups.get(title)!.push(course);
  }
  return groups;
}

/**
 * Backtracking to place mandatory courses.
 * Each mandatory group has multiple sections; we pick exactly one per group.
 * Returns the selected sections or null if no valid placement exists.
 */
function placeMandatory(
  mandatoryGroups: Course[][],
  index: number,
  selected: Course[],
  maxCredits: number,
): Course[] | null {
  if (index >= mandatoryGroups.length) {
    return [...selected];
  }

  // Shuffle sections for this group to get diverse results across attempts
  const sections = shuffle([...mandatoryGroups[index]]);

  for (const section of sections) {
    // Check conflicts
    if (conflictsWithAny(section, selected)) continue;

    // Check credit cap
    const newCredits =
      calculateTotalCredits(selected) + (parseFloat(section.Credits) || 0);
    if (newCredits > maxCredits) continue;

    // Try placing this section
    selected.push(section);
    const result = placeMandatory(
      mandatoryGroups,
      index + 1,
      selected,
      maxCredits,
    );
    if (result) return result;
    selected.pop();
  }

  return null; // No valid placement for this group
}

/**
 * After mandatory courses are placed, greedily fill with electives.
 * Iterates over shuffled elective groups and picks the first fitting section.
 * Only one section per course title is allowed.
 */
function fillElectives(
  electiveGroups: Course[][],
  selected: Course[],
  maxCredits: number,
): Course[] {
  const result = [...selected];
  const usedTitles = new Set(result.map((c) => c["Course Title"]));

  // Shuffle the order of elective groups for diversity
  const shuffledGroups = shuffle([...electiveGroups]);

  for (const group of shuffledGroups) {
    const title = group[0]["Course Title"];
    if (usedTitles.has(title)) continue;

    // Shuffle sections within the group
    const sections = shuffle([...group]);

    for (const section of sections) {
      if (conflictsWithAny(section, result)) continue;

      const newCredits =
        calculateTotalCredits(result) + (parseFloat(section.Credits) || 0);
      if (newCredits > maxCredits) continue;

      // Found a valid section for this elective
      result.push(section);
      usedTitles.add(title);
      break;
    }
  }

  return result;
}

/**
 * Main auto-fit algorithm.
 *
 * 1. Groups all courses by title.
 * 2. Removes excluded titles.
 * 3. Separates mandatory course groups from elective groups.
 * 4. Filters out sections with no valid schedule (TBA).
 * 5. Runs multiple randomized attempts to produce diverse combinations:
 *    - Phase 1: Backtracking to place all mandatory courses
 *    - Phase 2: Greedy fill with electives
 * 6. De-duplicates and returns up to 5 unique combinations.
 */
export function autoFitSchedule(input: AutoFitInput): AutoFitResult {
  const { allCourses, mandatoryTitles, optionalElectiveTitles, maxCredits } =
    input;

  // Filter out 0-credit courses, then group by title
  const creditCourses = allCourses.filter((c) => parseFloat(c.Credits) > 0);
  const titleGroups = groupByTitle(creditCourses);

  // Build sets for mandatory and optional elective titles
  const mandatorySet = new Set(mandatoryTitles);
  const optionalElectiveSet = new Set(optionalElectiveTitles);

  // Build mandatory and elective groups (only sections with valid schedules)
  // Electives are now ONLY drawn from the user's optional elective selections
  const mandatoryGroups: Course[][] = [];
  const electiveGroups: Course[][] = [];

  for (const [title, sections] of titleGroups) {
    // Only keep sections that have a valid (non-TBA) schedule
    const validSections = sections.filter(hasValidSchedule);
    if (validSections.length === 0) continue;

    if (mandatorySet.has(title)) {
      mandatoryGroups.push(validSections);
    } else if (optionalElectiveSet.has(title)) {
      electiveGroups.push(validSections);
    }
    // Titles not in mandatory or optional elective are simply ignored
  }

  // Validate: check all mandatory titles were found
  if (mandatoryGroups.length < mandatoryTitles.length) {
    const foundTitles = new Set(
      mandatoryGroups.map((g) => g[0]["Course Title"]),
    );
    const missing = mandatoryTitles.filter((t) => !foundTitles.has(t));
    return {
      combinations: [],
      message: `Could not find schedulable sections for: ${missing.join(", ")}. These courses may only have TBA schedules.`,
    };
  }

  const MAX_ATTEMPTS = 80;
  const TARGET_COMBINATIONS = 5;
  const seen = new Set<string>();
  const combinations: Course[][] = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (combinations.length >= TARGET_COMBINATIONS) break;

    // Phase 1: Place mandatory courses via backtracking
    // Shuffle the order of mandatory groups for diversity
    const shuffledMandatory = shuffle([...mandatoryGroups]);
    const mandatoryResult = placeMandatory(
      shuffledMandatory,
      0,
      [],
      maxCredits,
    );

    if (!mandatoryResult) {
      // If we can't even place mandatory courses, keep trying (shuffle may help)
      // But if we fail many times, it's likely impossible
      if (attempt > 20) {
        return {
          combinations,
          message:
            combinations.length === 0
              ? "Could not find any valid schedule. The mandatory courses may have unavoidable time conflicts or exceed the credit limit."
              : undefined,
        };
      }
      continue;
    }

    // Phase 2: Fill with electives
    const fullSchedule = fillElectives(
      electiveGroups,
      mandatoryResult,
      maxCredits,
    );

    // De-duplicate
    const key = combinationKey(fullSchedule);
    if (seen.has(key)) continue;

    seen.add(key);
    combinations.push(fullSchedule);
  }

  if (combinations.length === 0) {
    return {
      combinations: [],
      message:
        "Could not find any valid schedule combinations. Try adjusting mandatory courses or increasing the credit limit.",
    };
  }

  return { combinations };
}
