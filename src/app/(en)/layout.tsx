import type { Metadata } from "next";

import { LocalizedLayout } from "@/app/localized-layout";
import { appMetadata } from "@/app/metadata";
import messages from "@/messages/en.json";
import "@/app/globals.css";

export const metadata: Metadata = appMetadata;

export default function EnglishLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <LocalizedLayout locale="en" messages={messages}>
      {children}
    </LocalizedLayout>
  );
}
