import type { Metadata } from "next";

import { LocalizedLayout } from "@/app/localized-layout";
import { appMetadata } from "@/app/metadata";
import messages from "@/messages/vi.json";
import "@/app/globals.css";

export const metadata: Metadata = appMetadata;

export default function VietnameseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <LocalizedLayout locale="vi" messages={messages}>
      {children}
    </LocalizedLayout>
  );
}
