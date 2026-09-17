import type { Metadata } from "next";

import { APP_CONFIG } from "@/config";

export const appMetadata: Metadata = {
  title: APP_CONFIG.site.name,
  description: APP_CONFIG.site.description,
  openGraph: {
    images: [
      {
        url: "/preview.png",
        width: 2425,
        height: 1541,
        alt: `${APP_CONFIG.site.name} preview`,
      },
    ],
  },
};
