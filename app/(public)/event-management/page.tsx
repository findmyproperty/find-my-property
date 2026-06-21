import type { Metadata } from "next";
import EventManagementPage from "@/modules/services/EventManagementPage";

export const metadata: Metadata = {
  title: "Event Management",
  description:
    "Plan birthdays, weddings, baby showers and corporate events with verified event management partners.",
};

export default function Page() {
  return <EventManagementPage />;
}
