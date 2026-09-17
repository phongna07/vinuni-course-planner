"use client";

import Image from "next/image";
import { Coffee, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SupportProjectButton() {
  const t = useTranslations("Support");
  const tCommon = useTranslations("Common");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-full shadow-sm"
          aria-label={t("title")}
        >
          <Coffee className="size-4.5" strokeWidth={2.25} />
          <span className="hidden md:inline">{t("title")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" closeLabel={tCommon("close")}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <figure className="space-y-3">
          <div className="mx-auto w-fit overflow-hidden rounded-lg border bg-white p-2 shadow-sm">
            <Image
              src="/qr-code.jpg"
              alt={t("qrAlt")}
              width={1154}
              height={1281}
              className="max-h-[55vh] w-auto max-w-full object-contain"
              priority={false}
            />
          </div>
          <figcaption className="text-center text-sm font-medium">
            {t("scanQr")}
          </figcaption>
        </figure>

        <div className="flex gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-medium leading-relaxed text-yellow-950 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-100">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-400"
            aria-hidden="true"
          />
          <p>
            {t("optional")}
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
