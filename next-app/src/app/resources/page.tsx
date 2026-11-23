import type { Metadata } from "next";
import View from "@/views/Resources";
export const metadata: Metadata = { title: "Resources", description: "Guides, templates, books and tools for student founders." };
export default function Page() { return <View />; }
