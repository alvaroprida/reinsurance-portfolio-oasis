import type { EChartsOption } from 'echarts'
import { LEVEL_LABEL, type Level, type SiteData } from '../data'
import { fmt } from '../format'
import type { Palette } from '../theme'
import { EpChart } from './LossModel'
import { Card, Chart, DataTable, Info } from './ui'

const LEVELS: Level[] = ['gul', 'il', 'ri']
const SLOTS = ['cat-1', 'cat-2', 'cat-3'] as const

export function Reinsurance({ data, palette }: { data: SiteData; palette: Palette }) {
  const info = data.reinsurance.info[0]
  const bar: EChartsOption = {
    grid: { left: 70, right: 16, top: 16, bottom: 36 },
    tooltip: { trigger: 'axis', valueFormatter: (v: unknown) => `£${fmt(Number(v))}` },
    xAxis: { type: 'category', data: LEVELS.map((l) => LEVEL_LABEL[l]), axisLabel: { color: palette['text-secondary'] }, axisLine: { lineStyle: { color: palette.axis } } },
    yAxis: { type: 'value', name: 'Average annual loss (£)', nameTextStyle: { color: palette['text-secondary'] }, axisLabel: { color: palette['text-secondary'], formatter: (v: number) => `${fmt(v / 1000, 0)}k` }, splitLine: { lineStyle: { color: palette.grid } } },
    series: [{ type: 'bar', barMaxWidth: 56, data: LEVELS.map((l, i) => ({ value: data.aal[l].sample, itemStyle: { color: palette[SLOTS[i]] } })) }],
  }
  const ceded = data.aal.il.sample - data.aal.ri.sample
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="From gross to net" subtitle="Average annual loss at each stage of the Oasis pipeline">
          <Chart option={bar} height={300} label="Bar chart of average annual loss: ground-up, insured and net of reinsurance" />
          <Info>
            Policy terms (deductibles and limits) take the ground-up AAL of £{fmt(data.aal.gul.sample / 1000, 0)}k down to
            £{fmt(data.aal.il.sample / 1000, 0)}k insured. The reinsurance removes a further £{fmt(ceded / 1000, 1)}k,
            leaving £{fmt(data.aal.ri.sample / 1000, 0)}k net.
          </Info>
        </Card>
        <Card title="Insured against net curves" subtitle="Annual exceedance probability (AEP)">
          <EpChart data={data} palette={palette} kind="aep" levels={['il', 'ri']} />
        </Card>
      </div>
      <Card title="Treaty in this run" subtitle="OED reinsurance info and scope files">
        <DataTable name="reinsurance info" caption="Reinsurance contract terms"
          head={['Name', 'Type', 'Peril', 'Ceded %', 'Placed %', 'Inuring priority']}
          rows={[[String(info.ReinsName), String(info.ReinsType), String(info.ReinsPeril), `${Number(info.CededPercent) * 100}%`, `${Number(info.PlacedPercent) * 100}%`, String(info.InuringPriority)]]} />
        <DataTable name="reinsurance scope" caption="Locations covered by the treaty and share ceded"
          head={['Location', 'Share ceded']} rows={data.reinsurance.scope.map((s) => [String(s.LocNumber), `${s.CededPercent * 100}%`])} />
        <Info>
          PiWind's treaty is a small surplus share on two locations, so net and insured curves are close. It exercises the
          reinsurance machinery but is not an excess-of-loss layer. Writing XL terms in <code>ri_info.csv</code> and <code>ri_scope.csv</code> on a larger
          portfolio is the next step, and the Layer pricing tab depends on it.
        </Info>
      </Card>
    </div>
  )
}
