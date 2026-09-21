import Link from "next/link";
import { PageHeader, Card, SectionTitle } from "@/components/ui";

export const metadata = { title: "About — Haven" };

export default function AboutPage() {
  return (
    <div>
      <PageHeader title="About Haven" description="A working demonstrator for CivTech Challenge 12.6 — improving living conditions and tackling fuel poverty for social housing residents in Scotland." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>The problem</SectionTitle>
          <p className="text-sm text-navy-600">
            Data about a home and the people in it is fragmented across asset, repairs, energy and support systems. Risks — damp,
            cold, fuel poverty, vulnerability — build up unseen until they become crises. Haven brings these signals together and
            answers one question: <em>which households or properties need attention now, why, and what should happen next?</em>
          </p>
        </Card>
        <Card>
          <SectionTitle>The challenge</SectionTitle>
          <p className="text-sm text-navy-600">
            CivTech 12.6, sponsored by <strong>Cloch Housing Association</strong>: how can technology improve living conditions and
            quality of life for social housing residents in Scotland, with a focus on preventing the impacts of fuel poverty. See{" "}
            <Link href="/methodology" className="underline">methodology</Link> and the CivTech alignment in the repository docs.
          </p>
        </Card>
        <Card>
          <SectionTitle>The partnership</SectionTitle>
          <p className="text-sm text-navy-600">
            <strong>Ambidexters Ltd</strong> — technology, software, data, AI, analytics, product and implementation. <br />
            <strong>The DataKirk SCIO</strong> — Scottish ecosystem insight, community engagement, inclusion, co-design, data
            literacy, user research and stakeholder engagement.
          </p>
        </Card>
        <Card>
          <SectionTitle>What Haven is — and isn&apos;t</SectionTitle>
          <ul className="list-inside list-disc space-y-1 text-sm text-navy-600">
            <li>It <strong>is</strong> transparent decision-support for trained housing and support professionals.</li>
            <li>It <strong>is not</strong> a clinical decision system and does not diagnose medical conditions.</li>
            <li>It <strong>does not</strong> take autonomous action — a human reviews and decides.</li>
            <li>All data shown is <strong>synthetic</strong>; no real tenant identities are used.</li>
          </ul>
        </Card>
      </div>

      <Card className="mt-4 border-l-4 border-amber-300">
        <SectionTitle>Disclaimer</SectionTitle>
        <p className="text-sm text-navy-600">
          Haven is a product demonstrator. All household and property data is synthetic. Risk scores and recommendations are
          prototype decision-support outputs and are not clinically validated. Displayed integrations are simulated unless
          specifically stated otherwise. Nothing here implies endorsement by Cloch Housing Association or CivTech. A Data Protection
          Impact Assessment has not been completed for this demonstrator.
        </p>
      </Card>
    </div>
  );
}
