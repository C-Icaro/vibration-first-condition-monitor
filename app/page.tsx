import { ConditionDashboard } from "@/components/dashboard/ConditionDashboard";
import { getTelemetry } from "@/lib/telemetry/provider";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialSnapshot = await getTelemetry("inspect");
  return <ConditionDashboard initialSnapshot={initialSnapshot} />;
}
