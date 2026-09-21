import Link from "next/link";

export function DisclaimerBar() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs">
        <span className="font-semibold">Product demonstrator.</span> All household and property data is{" "}
        <span className="font-semibold">synthetic</span>. Risk scores are prototype decision-support outputs for trained staff — not
        clinical advice. Displayed integrations are simulated.
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 border-t border-navy-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-navy-600">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <div className="font-semibold text-navy-800">Haven</div>
            <p className="mt-1 text-xs">
              A housing risk and intervention platform demonstrator for CivTech Challenge 12.6 (fuel poverty &amp; living
              conditions in social housing).
            </p>
          </div>
          <div>
            <div className="font-semibold text-navy-800">Important</div>
            <p className="mt-1 text-xs">
              Synthetic data only. Not a clinical decision system. Does not imply endorsement by Cloch Housing Association or
              CivTech. See{" "}
              <Link href="/about" className="underline">
                About
              </Link>{" "}
              and{" "}
              <Link href="/governance" className="underline">
                Governance
              </Link>
              .
            </p>
          </div>
          <div>
            <div className="font-semibold text-navy-800">Partnership</div>
            <p className="mt-1 text-xs">Ambidexters Ltd (technology, data, AI, product) × The DataKirk SCIO (community engagement, inclusion, co-design, data literacy).</p>
          </div>
        </div>
        <p className="mt-6 text-xs text-navy-400">Prototype v0.1 · Human oversight required for all decisions.</p>
      </div>
    </footer>
  );
}
