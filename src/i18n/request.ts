import { getRequestConfig } from "next-intl/server";

import messages from "@/messages/en.json";

export default getRequestConfig(async () => ({
  locale: "en",
  messages,
  timeZone: "Asia/Ho_Chi_Minh",
}));
