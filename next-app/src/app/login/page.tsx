import { Suspense } from "react";
import Auth from "@/views/Auth";
export const metadata = { title: "Sign in" };
export default function Page() { return <Suspense><Auth join={false} /></Suspense>; }
