export const APP_CONFIG = {
  site: {
    name: "VinUni Course Planner",
    description: "Plan your semester schedule at VinUniversity",
  },
  analytics: {
    googleMeasurementId: "G-S00YVDJTZX",
  },
  countdown: {
    targetDateTime: "2026-08-28T15:00:00+07:00",
    timeZone: "Asia/Bangkok",
  },
  calendar: {
    startHour: 7,
    endHour: 22,
  },
  storageKeys: {
    selectedCourses: "vinuni-selected-courses",
    courseFilters: "vinuni-course-filters",
    autoFit: "vinuni-autofit-config",
    planningDisclaimerAcknowledged:
      "vinuni-planning-disclaimer-acknowledged",
  },
} as const;
