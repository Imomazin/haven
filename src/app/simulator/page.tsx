import { PageHeader } from "@/components/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Simulator } from "@/components/simulator";

export const metadata = { title: "Risk simulator — Haven" };

export default function SimulatorPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Methodology", href: "/methodology" }, { label: "Risk simulator" }]} />
      <PageHeader
        title="Risk simulator"
        description="Move any signal and watch the risk score, bands, drivers, confidence and recommended interventions recompute instantly — using the exact same transparent engine the platform runs. A fast way to understand and challenge the scoring."
      />
      <Simulator />
    </div>
  );
}
