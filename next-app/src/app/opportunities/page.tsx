import type { Metadata } from "next";
import View from "@/views/Opportunities";
export const metadata: Metadata = { title: "Opportunities", description: "Internships, founder’s office roles and projects with campus and outside startups." };
export default function Page() { return <View />; }
