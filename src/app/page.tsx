import { LandingPage } from "@student/components/Landing/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "GradeU - Master Any Subject",
    description: "Empowering excellence with GradeU. AI-powered education platform with hands-on labs and proctored assessments.",
};

export default function Home() {
    return <LandingPage />;
}
