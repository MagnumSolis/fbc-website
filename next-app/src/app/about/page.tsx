import type { Metadata } from "next";
import View from "@/views/About";
export const metadata: Metadata = { title: "About", description: "FBC is a student-run entrepreneurship community at BITS Pilani." };
export default function Page() { return <View />; }
