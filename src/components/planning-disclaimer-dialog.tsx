"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { APP_CONFIG } from "@/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PlanningDisclaimerDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkAcknowledgement = window.setTimeout(() => {
      try {
        const hasAcknowledged =
          localStorage.getItem(
            APP_CONFIG.storageKeys.planningDisclaimerAcknowledged,
          ) === "true";

        if (!hasAcknowledged) {
          setOpen(true);
        }
      } catch {
        setOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(checkAcknowledgement);
  }, []);

  const acknowledgeDisclaimer = () => {
    try {
      localStorage.setItem(
        APP_CONFIG.storageKeys.planningDisclaimerAcknowledged,
        "true",
      );
    } catch {
      // The dialog still closes for this session when storage is unavailable.
    }

    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Important planning disclaimer</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {APP_CONFIG.site.disclaimer}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
          <TriangleAlert
            className="text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <AlertTitle>Planning tool only</AlertTitle>
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            <p>
              Selecting courses on this website only helps you plan a schedule.
              It does not enroll or register you for courses on VinUniDigi.
              You must complete your official course registration separately on
              the VinUniDigi system.
            </p>
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button onClick={acknowledgeDisclaimer}>I understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
