import type { Metadata } from "next";
import View from "@/views/Matchmaking";
export const metadata: Metadata = { title: "Co-founder matchmaking", description: "Founders list ideas and the skills they need; builders apply. BITS Pilani." };
export default function Page() { return <View />; }
