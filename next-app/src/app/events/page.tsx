import type { Metadata } from "next";
import View from "@/views/Events";
export const metadata: Metadata = { title: "Events", description: "Pitch nights, workshops, founder firesides and community meets." };
export default function Page() { return <View />; }
