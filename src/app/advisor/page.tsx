import type { Metadata } from "next";
import { Advisor } from "@/components/advisor/advisor";

export const metadata: Metadata = {
  title: "Advisor",
  description:
    "Answer four short steps about your project, team and budget and get a full tech stack, ranked and explained.",
};

export default function AdvisorPage() {
  return <Advisor />;
}
