import { RecruiterPage } from "@/features/recruiter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recruiter Assessment Sandbox | Odyssey",
  description:
    "Evaluate applicant suitability in real-time. Calculate compatibility scores, view specialized metrics, and inspect career milestones.",
};

export default function RecruiterRoute() {
  return <RecruiterPage />;
}
