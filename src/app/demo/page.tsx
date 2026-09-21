import Link from "next/link";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ResetButton } from "@/components/reset-button";

export const metadata = { title: "Demo — Haven" };

const STEPS: { do: string; say: string }[] = [
  { do: "Open the Overview dashboard.", say: "Haven monitors 55 properties and 45 households. Six are High and one is Critical right now." },
  { do: "Open the Risk Queue and read the top row.", say: "The queue ranks by urgency then risk. HAV-P-0001 is Critical — a pre-1919 tenement with recurring damp, an under-heating fuel-poor household and a vulnerable older resident." },
  { do: "Open case HAV-C-0001.", say: "This is the working case. Notice the status, owner and prototype response window." },
  { do: "Scroll to ‘Why is this risk high?’.", say: "The score is fully explained: component scores, top drivers with evidence, protective factors and any missing evidence — no black box." },
  { do: "Open the property (HAV-P-0001) and household (HAV-H-0001).", say: "Fabric, environmental readings and non-clinical household indicators — the signals feeding the engine." },
  { do: "Back on the case, review Engine recommendations.", say: "Haven suggests inspection, heating support, damp/mould investigation and tenant contact — each with a reason and expected outcome." },
  { do: "Assign the case and Start it.", say: "Assignment and status changes persist to the database and the audit trail." },
  { do: "Mark an intervention ‘Completed’ with an outcome.", say: "The action and its outcome are recorded against the case." },
  { do: "Click ‘Run follow-up assessment’.", say: "Haven re-measures risk, reflecting the completed work, and records the change." },
  { do: "Read the Risk reduction panel.", say: "Opening → current → follow-up, with the point reduction — evidence the intervention worked." },
  { do: "Open a closed case (e.g. HAV-C-0007 or HAV-C-0022).", say: "A resolved journey: High/Moderate down to Low, with timeline and outcome." },
  { do: "Return to Analytics.", say: "Risk by geography and property type, intervention effectiveness, and recurring-issue properties for a fabric review." },
];

export default function DemoPage() {
  return (
    <div>
      <PageHeader
        title="Guided demo (6–8 minutes)"
        description="A presenter script that walks a household from risk to intervention to measured risk reduction and back to the portfolio view."
        actions={<ResetButton />}
      />

      <Card className="mb-4">
        <SectionTitle>What not to claim</SectionTitle>
        <ul className="list-inside list-disc space-y-1 text-sm text-navy-600">
          <li>Don&apos;t present risk scores as clinically validated or as medical assessments.</li>
          <li>Don&apos;t imply live integrations — the connectors shown are demo/simulated.</li>
          <li>Don&apos;t imply endorsement by Cloch Housing Association or CivTech.</li>
          <li>Do say the data is synthetic and every decision needs a human.</li>
        </ul>
      </Card>

      <Card>
        <SectionTitle>Steps</SectionTitle>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-700 text-xs font-bold text-white">{i + 1}</span>
              <div>
                <div className="text-sm font-medium text-navy-800">{s.do}</div>
                <div className="text-sm text-navy-500">“{s.say}”</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/" className="btn-secondary">Overview</Link>
          <Link href="/risk-queue" className="btn-secondary">Risk Queue</Link>
          <Link href="/cases/HAV-C-0001" className="btn-primary">Open flagship case →</Link>
        </div>
      </Card>
    </div>
  );
}
