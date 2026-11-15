import type { TabKey } from '../App'
import { LEVEL_LABEL, type Level, type SiteData } from '../data'
import { fmt } from '../format'
import { Card, Stat, Steps } from './ui'

const gbp = (v: number) => `£${fmt(v / 1000, 0)}k`

export function Overview({ data, go }: { data: SiteData; go: (k: TabKey) => void }) {
  const levels: Level[] = ['gul', 'il', 'ri']
  const aep100 = (l: Level) => data.aep[l].find((p) => p.rp === 100)?.loss ?? 0
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {levels.map((l) => (
          <Stat key={l} label={`${LEVEL_LABEL[l]} · average annual loss`} value={gbp(data.aal[l].sample)}
            sub={`1-in-100 annual loss ${gbp(aep100(l))}`} hero={l === 'gul'} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="The question" subtitle="What a reinsurance portfolio assessment answers">
          <p className="text-sm leading-relaxed text-ink-2">
            A cedant submits its exposure and asks for cover. The reinsurer has to turn that submission into numbers: how much
            could the portfolio lose in a year, how much of that falls on the layer being offered, and what price does that
            justify. This site walks through that chain with Oasis LMF, the open-source catastrophe modelling framework, so that every
            step is inspectable.
          </p>
        </Card>
        <Card title="The Oasis workflow" subtitle="One tab per stage">
          <Steps items={[
            { title: 'Exposure', body: <>Locations and policies in OED format. <Open go={go} k="exposure" /></> },
            { title: 'Hazard and vulnerability', body: <>Event footprints and damage curves make up the model. <Open go={go} k="hazard" /></> },
            { title: 'Loss model', body: <>Oasis samples damage per event and aggregates by year. <Open go={go} k="loss" /></> },
            { title: 'Treaty terms', body: <>Reinsurance info and scope turn gross into net. <Open go={go} k="reinsurance" /></> },
            { title: 'Price the layer', body: <>Expected loss and a technical price. <Open go={go} k="pricing" /></> },
          ]} />
        </Card>
      </div>
    </div>
  )
}

function Open({ go, k }: { go: (k: TabKey) => void; k: TabKey }) {
  return <button className="text-accent underline underline-offset-2" onClick={() => go(k)}>Open</button>
}
