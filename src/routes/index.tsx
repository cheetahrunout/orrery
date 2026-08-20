import { createFileRoute } from "@tanstack/react-router";
import { OrreryApp } from "@/components/orrery/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <OrreryApp />;
}
