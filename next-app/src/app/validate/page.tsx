import type { Metadata } from "next";
import View from "@/views/Validate";
export const metadata: Metadata = { title: "Validate your idea", description: "A seven-question idea check, plus VistaDex for the deep dive." };
export default function Page() { return <View />; }
