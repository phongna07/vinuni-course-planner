export function getInstructorDisplayName(
  instructor: string,
  fallback = "Unassigned",
): string {
  return instructor || fallback;
}
