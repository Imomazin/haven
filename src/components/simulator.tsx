"use client";

import { useMemo, useState } from "react";
import { assessRisk } from "@/lib/risk-engine";
import { recommendInterventions } from "@/lib/intervention-engine";
import { RiskExplanation } from "@/components/risk-explanation";
import { UrgencyBadge } from "@/components/severity";
import { Card, SectionTitle } from "@/components/ui";
import type { RiskInput } from "@/lib/types";
import {
  CONSTRUCTION_ERAS, EPC_RATINGS, HEATING_TYPES, INSULATION_LEVELS, GLAZING_TYPES,
  VENTILATION_LEVELS, PROPERTY_TYPES, RISK_LEVELS, INCOME_RISK, FUEL_POVERTY, ENERGY_USE_PATTERNS,
} from "@/lib/types";
import { label } from "@/lib/format";

const PRESETS: Record<string, RiskInput> = {
  "Older damp tenement (vulnerable)": {
    property: { propertyType: "tenement_flat", constructionEra: "pre1919", epcRating: "F", heatingType: "electric_storage", wallInsulation: "none", loftInsulation: "partial", glazing: "single", ventilation: "poor", dampHistoryCount: 3, mouldHistoryCount: 2, openRepairs: 0, lastRepairDaysAgo: null, indoorHumidityPct: 74, indoorWinterTempC: 15.2, co2Ppm: 1350, readingsAgeDays: 12 },
    household: { householdSize: 2, adultsOver65: 1, childrenUnder5: 0, childrenPresent: false, incomeRiskIndicator: "high", fuelPovertyIndicator: "in_fuel_poverty", mobilitySupport: true, healthVulnerability: "significant", recentHouseholdChange: false, energyUsePattern: "under_heating" },
  },
  "Modern home, fuel-poor": {
    property: { propertyType: "semi_detached", constructionEra: "post2002", epcRating: "B", heatingType: "heat_pump", wallInsulation: "full", loftInsulation: "full", glazing: "double", ventilation: "good", dampHistoryCount: 0, mouldHistoryCount: 0, openRepairs: 0, lastRepairDaysAgo: 300, indoorHumidityPct: 48, indoorWinterTempC: 16.5, co2Ppm: 700, readingsAgeDays: 8 },
    household: { householdSize: 3, adultsOver65: 0, childrenUnder5: 1, childrenPresent: true, incomeRiskIndicator: "high", fuelPovertyIndicator: "in_fuel_poverty", mobilitySupport: false, healthVulnerability: "some", recentHouseholdChange: true, energyUsePattern: "under_heating" },
  },
  "Good home, low risk": {
    property: { propertyType: "semi_detached", constructionEra: "post2002", epcRating: "A", heatingType: "gas_central", wallInsulation: "full", loftInsulation: "full", glazing: "triple", ventilation: "good", dampHistoryCount: 0, mouldHistoryCount: 0, openRepairs: 0, lastRepairDaysAgo: 200, indoorHumidityPct: 44, indoorWinterTempC: 21, co2Ppm: 600, readingsAgeDays: 5 },
    household: { householdSize: 2, adultsOver65: 0, childrenUnder5: 0, childrenPresent: false, incomeRiskIndicator: "low", fuelPovertyIndicator: "none", mobilitySupport: false, healthVulnerability: "none", recentHouseholdChange: false, energyUsePattern: "normal" },
  },
};

function Field({ label: lbl, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-navy-600">
      {lbl}
      {children}
    </label>
  );
}

const Opt = ({ v }: { v: string }) => <option value={v}>{label(v)}</option>;

export function Simulator() {
  const [input, setInput] = useState<RiskInput>(PRESETS["Older damp tenement (vulnerable)"]);
  const assessment = useMemo(() => assessRisk(input), [input]);
  const recs = useMemo(() => recommendInterventions(input, assessment), [input, assessment]);

  const setP = <K extends keyof RiskInput["property"]>(k: K, v: RiskInput["property"][K]) =>
    setInput((s) => ({ ...s, property: { ...s.property, [k]: v } }));
  const setH = <K extends keyof RiskInput["household"]>(k: K, v: RiskInput["household"][K]) =>
    setInput((s) => ({ ...s, household: { ...s.household, [k]: v } }));

  const p = input.property;
  const h = input.household;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-navy-600">Start from:</span>
            {Object.keys(PRESETS).map((name) => (
              <button key={name} onClick={() => setInput(PRESETS[name])} className="btn-secondary py-1 text-xs">
                {name}
              </button>
            ))}
          </div>

          <SectionTitle sub="Adjust the property fabric and environment">Property signals</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Type"><select className="input" value={p.propertyType} onChange={(e) => setP("propertyType", e.target.value as typeof p.propertyType)}>{PROPERTY_TYPES.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="Construction era"><select className="input" value={p.constructionEra} onChange={(e) => setP("constructionEra", e.target.value as typeof p.constructionEra)}>{CONSTRUCTION_ERAS.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="EPC"><select className="input" value={p.epcRating} onChange={(e) => setP("epcRating", e.target.value as typeof p.epcRating)}>{EPC_RATINGS.map((v) => <option key={v} value={v}>{v}</option>)}</select></Field>
            <Field label="Heating"><select className="input" value={p.heatingType} onChange={(e) => setP("heatingType", e.target.value as typeof p.heatingType)}>{HEATING_TYPES.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="Wall insulation"><select className="input" value={p.wallInsulation} onChange={(e) => setP("wallInsulation", e.target.value as typeof p.wallInsulation)}>{INSULATION_LEVELS.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="Loft insulation"><select className="input" value={p.loftInsulation} onChange={(e) => setP("loftInsulation", e.target.value as typeof p.loftInsulation)}>{INSULATION_LEVELS.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="Glazing"><select className="input" value={p.glazing} onChange={(e) => setP("glazing", e.target.value as typeof p.glazing)}>{GLAZING_TYPES.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="Ventilation"><select className="input" value={p.ventilation} onChange={(e) => setP("ventilation", e.target.value as typeof p.ventilation)}>{VENTILATION_LEVELS.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label={`Damp events: ${p.dampHistoryCount}`}><input type="range" min={0} max={5} value={p.dampHistoryCount} onChange={(e) => setP("dampHistoryCount", +e.target.value)} /></Field>
            <Field label={`Mould events: ${p.mouldHistoryCount}`}><input type="range" min={0} max={5} value={p.mouldHistoryCount} onChange={(e) => setP("mouldHistoryCount", +e.target.value)} /></Field>
            <Field label={`Open repairs: ${p.openRepairs}`}><input type="range" min={0} max={5} value={p.openRepairs} onChange={(e) => setP("openRepairs", +e.target.value)} /></Field>
            <Field label={`Humidity: ${p.indoorHumidityPct ?? "—"}%`}><input type="range" min={30} max={90} value={p.indoorHumidityPct ?? 50} onChange={(e) => setP("indoorHumidityPct", +e.target.value)} /></Field>
            <Field label={`Winter temp: ${p.indoorWinterTempC ?? "—"}°C`}><input type="range" min={10} max={24} step={0.5} value={p.indoorWinterTempC ?? 19} onChange={(e) => setP("indoorWinterTempC", +e.target.value)} /></Field>
            <Field label={`CO₂: ${p.co2Ppm ?? "—"} ppm`}><input type="range" min={400} max={2000} step={50} value={p.co2Ppm ?? 800} onChange={(e) => setP("co2Ppm", +e.target.value)} /></Field>
          </div>
        </Card>

        <Card>
          <SectionTitle sub="Non-clinical household indicators">Household signals</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Fuel poverty"><select className="input" value={h.fuelPovertyIndicator} onChange={(e) => setH("fuelPovertyIndicator", e.target.value as typeof h.fuelPovertyIndicator)}>{FUEL_POVERTY.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="Income risk"><select className="input" value={h.incomeRiskIndicator} onChange={(e) => setH("incomeRiskIndicator", e.target.value as typeof h.incomeRiskIndicator)}>{INCOME_RISK.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="Energy use"><select className="input" value={h.energyUsePattern} onChange={(e) => setH("energyUsePattern", e.target.value as typeof h.energyUsePattern)}>{ENERGY_USE_PATTERNS.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label="Support need"><select className="input" value={h.healthVulnerability} onChange={(e) => setH("healthVulnerability", e.target.value as typeof h.healthVulnerability)}>{RISK_LEVELS.map((v) => <Opt key={v} v={v} />)}</select></Field>
            <Field label={`Adults 65+: ${h.adultsOver65}`}><input type="range" min={0} max={3} value={h.adultsOver65} onChange={(e) => setH("adultsOver65", +e.target.value)} /></Field>
            <Field label={`Children under 5: ${h.childrenUnder5}`}><input type="range" min={0} max={3} value={h.childrenUnder5} onChange={(e) => setH("childrenUnder5", +e.target.value)} /></Field>
            <label className="flex items-center gap-2 text-xs font-medium text-navy-600"><input type="checkbox" checked={h.mobilitySupport} onChange={(e) => setH("mobilitySupport", e.target.checked)} /> Mobility support</label>
            <label className="flex items-center gap-2 text-xs font-medium text-navy-600"><input type="checkbox" checked={h.childrenPresent} onChange={(e) => setH("childrenPresent", e.target.checked)} /> Children present</label>
            <label className="flex items-center gap-2 text-xs font-medium text-navy-600"><input type="checkbox" checked={h.recentHouseholdChange} onChange={(e) => setH("recentHouseholdChange", e.target.checked)} /> Recent change</label>
          </div>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <Card className="sticky top-24">
          <SectionTitle sub="Recomputed live — same engine the platform uses">Live assessment</SectionTitle>
          <RiskExplanation a={assessment} />
        </Card>
        <Card>
          <SectionTitle>Would recommend</SectionTitle>
          <ul className="space-y-2">
            {recs.map((r) => (
              <li key={r.type} className="flex items-center justify-between gap-2 border-b border-navy-50 pb-1.5 text-sm">
                <span className="font-medium text-navy-800">{r.label}</span>
                <UrgencyBadge urgency={r.urgency} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
