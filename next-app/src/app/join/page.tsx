import { Suspense } from "react";
import Auth from "@/views/Auth";
export const metadata = { title: "Join" };
export default function Page() { return <Suspense><Auth join /></Suspense>; }
