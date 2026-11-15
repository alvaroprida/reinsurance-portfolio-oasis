import { useEffect, useState } from 'react'
import { Exposure } from './components/Exposure'
import { LossModel } from './components/LossModel'
import { Method } from './components/Method'
import { Overview } from './components/Overview'
import { Planned } from './components/Planned'
import { Reinsurance } from './components/Reinsurance'
import { useSiteData } from './data'
import { usePalette } from './theme'

const TABS = [
  ['overview', 'Overview'],
  ['exposure', 'Exposure'],
  ['hazard', 'Hazard'],
  ['vulnerability', 'Vulnerability'],
  ['loss', 'Loss model'],
  ['reinsurance', 'Reinsurance'],
  ['pricing', 'Layer pricing'],
  ['method', 'Methodology'],
] as const
export type TabKey = (typeof TABS)[number][0]

function initialTab(): TabKey {
  const h = window.location.hash.slice(1)
  return (TABS.find(([k]) => k === h)?.[0] ?? 'overview') as TabKey
}

export default function App() {
  const { palette } = usePalette()
  const { data, error } = useSiteData()
  const [tab, setTab] = useState<TabKey>(initialTab)

  useEffect(() => {
    const onHash = () => setTab(initialTab())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (k: TabKey) => {
    window.location.hash = k
    setTab(k)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 md:p-6">
      <header>
        <p className="text-sm font-medium text-accent">Retention &amp; transfer · reinsurance portfolio assessment</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Assessing a reinsurance treaty with Oasis LMF</h1>
        <p className="max-w-3xl text-sm text-ink-2">
          From a cedant's exposure to the technical price of an excess-of-loss layer, using the open-source Oasis Loss Modelling
          Framework: exposure in OED format, a catastrophe model, gross, insured and net loss curves, and treaty terms applied on top.
        </p>
      </header>

      <div role="note" className="rounded-lg bg-banner px-4 py-2 text-sm text-ink">
        <strong>Work in progress.</strong> The results shown so far come from PiWind, Oasis's demonstration model (10 buildings,
        UK windstorm), used to learn the framework. Tabs marked "planned" will use a model built from open data. Illustrative
        exercise on a synthetic portfolio, not a quote or a pricing opinion.
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Sections">
        {TABS.map(([k, name]) => (
          <button key={k} onClick={() => go(k)} aria-current={tab === k ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm ${tab === k ? 'border-accent font-medium text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}>
            {name}
          </button>
        ))}
      </nav>

      {error && <div className="p-8 text-ink">Could not load data: {error}</div>}
      {!data && !error && <div className="p-8 text-ink-3">Loading…</div>}
      {data && (
        <main className="min-w-0">
          {tab === 'overview' && <Overview data={data} go={go} />}
          {tab === 'exposure' && <Exposure data={data} palette={palette} />}
          {tab === 'hazard' && (
            <Planned
              title="Hazard: event footprints and rates"
              shows={[
                'The stochastic event set: how many events, their annual rates, and the period-based occurrence (10,000 simulated years).',
                'Footprint maps: hazard intensity per event and location, built from open data with CLIMADA.',
                'Return-period hazard at the portfolio locations, checked against published values.',
              ]}
              oasis={['events.bin', 'occurrence.bin', 'footprint.bin / .idx', 'areaperil_dict']}
              now="PiWind ships a toy 1-in-N windstorm footprint, so there is nothing meaningful to show yet."
            />
          )}
          {tab === 'vulnerability' && (
            <Planned
              title="Vulnerability: damage curves and uncertainty"
              shows={[
                'Mean damage ratio against hazard intensity, by construction and occupancy class.',
                'The damage distribution around the mean (secondary uncertainty), which drives the tail of the loss curve.',
                'Sensitivity of the average annual loss to the choice of curve.',
              ]}
              oasis={['vulnerability.bin', 'damage_bin_dict.bin', 'items / coverages', 'model_settings.json']}
              now="PiWind's curves are demonstration values, so the plots arrive with the open-data model."
            />
          )}
          {tab === 'loss' && <LossModel data={data} palette={palette} />}
          {tab === 'reinsurance' && <Reinsurance data={data} palette={palette} />}
          {tab === 'pricing' && (
            <Planned
              title="Layer pricing: from the loss curve to a technical price"
              shows={[
                'Expected loss, attachment and exhaustion probability and burn cost for an excess-of-loss layer.',
                'Rate on line, loss on line and a technical premium with a loading for risk and expenses.',
                'Sensitivity of the price to attachment, limit, reinstatements and model assumptions.',
              ]}
              oasis={['ri_info.csv', 'ri_scope.csv', 'ri_ ORD outputs (ELT / PLT / EPT)']}
              now="Needs an excess-of-loss treaty over a portfolio large enough to reach the layer. PiWind's total value is only £3.4M."
            />
          )}
          {tab === 'method' && <Method data={data} />}
        </main>
      )}

      <footer className="pt-4 text-sm text-ink-3">
        © 2026 Alvaro Prida · Site code under the MIT licence; Oasis LMF and the PiWind model are by the Oasis LMF project (BSD-2).
        Research work in progress, not an offer of reinsurance.
      </footer>
    </div>
  )
}
