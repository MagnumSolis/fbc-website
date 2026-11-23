import type { Metadata } from "next";
import View from "@/views/Journal";
export const metadata: Metadata = { title: "Journal", description: "Startup stories, analysis and the FBC newsletter." };
export default function Page() { return <View />; }
