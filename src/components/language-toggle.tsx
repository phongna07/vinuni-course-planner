"use client";

import Link from "next/link";
import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localePaths, locales } from "@/i18n/config";

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations("Navigation");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("changeLanguage")}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("changeLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((itemLocale) => (
          <DropdownMenuItem key={itemLocale} asChild>
            <Link
              href={localePaths[itemLocale]}
              hrefLang={itemLocale}
              lang={itemLocale}
              className="justify-between"
            >
              <span>
                {itemLocale === "en" ? t("english") : t("vietnamese")}
              </span>
              {locale === itemLocale && <Check className="h-4 w-4" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
