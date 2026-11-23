import { Suspense } from "react";
import View from "@/views/Post";
import { Loading } from "@/components/ui";
export const metadata = { title: "Journal" };
export default function Page() { return <Suspense fallback={<Loading />}><View /></Suspense>; }
