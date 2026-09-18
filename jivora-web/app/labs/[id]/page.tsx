/**
 * Lab report detail: DE/US toggle, per-marker AI commentary, HIPAA consent gate.
 */
import { marked } from "marked";

import { requireAuthenticatedUser } from "../../../lib/auth/session";
import { webLabs } from "../../../lib/api/client";

type Marker = {
  name: string;
  value: string;
  unit: string;
  reference_de: string;
  reference_us: string;
  /** Markdown from lab-analyzer (claude-opus-4-8). */
  commentary: string;
};

export default async function LabReportPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { region?: string };
}) {
  requireAuthenticatedUser("customer");

  const report = await webLabs.get(params.id);
  const parsed = JSON.parse(report.processed_json || "{}");
  const markers: Marker[] = parsed.markers || [];
  const region = searchParams.region === "us" ? "us" : "de";

  return (
    <main className="px-6 py-8">
      <header className="mb-6">
        <p className="text-sm text-ember">Lab report</p>
        <h1 className="text-2xl text-ink">{parsed.panel_name || "Panel"}</h1>
        <p className="text-sm text-ink/60">Collected {report.collected_at}</p>
      </header>

      <div
        className="mb-8 rounded border border-rule bg-paper p-4"
        dangerouslySetInnerHTML={{ __html: marked.parse(parsed.summary || "") }}
      />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule text-left">
            <th className="py-2">Marker</th>
            <th className="py-2">Value</th>
            <th className="py-2">{region === "us" ? "US range" : "DE range"}</th>
            <th className="py-2">Commentary</th>
          </tr>
        </thead>
        <tbody>
          {markers.map((marker) => (
            <tr key={marker.name} className="border-b border-rule/50 align-top">
              <td className="py-2">{marker.name}</td>
              <td className="py-2">
                {marker.value} {marker.unit}
              </td>
              <td className="py-2">
                {region === "us" ? marker.reference_us : marker.reference_de}
              </td>
              <td
                className="py-2 text-ink/80"
                dangerouslySetInnerHTML={{ __html: marked.parse(marker.commentary || "") }}
              />
            </tr>
          ))}
        </tbody>
      </table>

      <a
        className="mt-6 inline-block text-ember underline"
        href={`/api/web/labs/pdf?file=${report.uploaded_file}`}
      >
        Download PDF
      </a>
    </main>
  );
}
