export const locales = ["en", "vi"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localePaths: Record<Locale, string> = {
  en: "/",
  vi: "/vi",
};

export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";
