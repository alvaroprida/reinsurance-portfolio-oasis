import type { SiteData } from '../data'
import { Card, Steps } from './ui'

export function Method({ data }: { data: SiteData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="How the results were produced" subtitle={`oasislmf ${data.oasislmf}, run ${data.generated}`}>
        <Steps items={[
          { title: 'Exposure', body: 'OED location, account and reinsurance files are validated and turned into Oasis input files, with a keys lookup matching each location to the model.' },
          { title: 'Ground-up loss', body: 'gulmc draws damage samples for each event and location from the vulnerability distributions.' },
          { title: 'Policy terms', body: 'The financial module (fmpy) applies deductibles, limits and layers to give insured loss.' },
          { title: 'Reinsurance', body: 'The reinsurance module applies the contract terms and scope to give loss net of reinsurance.' },
          { title: 'Outputs', body: 'ORD summaries: event and period loss tables, average annual loss and exceedance probability curves, exported to the JSON this site reads.' },
        ]} />
      </Card>
      <Card title="Reproduce it" subtitle="Windows with WSL2, or any Linux">
        <pre className="overflow-x-auto rounded-lg bg-banner p-3 text-[13px] leading-relaxed text-ink">{`# one-off setup: see the comments in pipeline/run_piwind.sh
bash pipeline/run_piwind.sh
python pipeline/export_results.py
python pipeline/export_model.py
cd web && npm ci && npm run dev`}</pre>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          The ktools engine is not bundled with the oasislmf pip package, so it is installed separately. With the default of 8
          parallel processes the run ran out of memory on a 7 GB WSL machine; 2 processes peak at about 4 GB and take 3 minutes.
        </p>
      </Card>
      <Card title="Limitations" className="lg:col-span-2">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
          <li>PiWind is a demonstration model with ten locations and one peril. It is not calibrated and should not be used to draw conclusions about wind risk.</li>
          <li>The treaty is a small surplus share, so this site does not yet show an excess-of-loss layer.</li>
          <li>Only 10 samples per event, so average annual loss still carries sampling noise.</li>
          <li>The planned model uses open hazard data and generic damage curves; open models are not calibrated like vendor models.</li>
        </ul>
      </Card>
    </div>
  )
}
