import type { EChartsOption } from 'echarts'
import { useState } from 'react'
import type { ModelData } from '../data'
import { fmt } from '../format'
import type { Palette } from '../theme'
import { Card, Chart, DataTable, Info, Segmented, Stat } from './ui'

const UNIT = 'model units'

export function Hazard({ model, palette }: { model: ModelData; palette: Palette }) {
  const [peril, setPeril] = useState<'WTC' | 'WSS'>('WTC')
  const s = model.stats
  const rp = model.hazard_rp[peril]
  const ink2 = palette['text-secondary']

  const rpOption: EChartsOption = {
    grid: { left: 60, right: 16, top: 16, bottom: 48 },
    tooltip: { trigger: 'axis', valueFormatter: (v: unknown) => `${fmt(Number(v))}` },
    xAxis: { type: 'log', min: 2, max: 1000, name: 'Return period (years)', nameLocation: 'middle', nameGap: 30, axisLabel: { color: ink2 }, nameTextStyle: { color: ink2 }, axisLine: { lineStyle: { color: palette.axis } }, splitLine: { lineStyle: { color: palette.grid } } },
    yAxis: { type: 'value', name: `Intensity (${UNIT})`, nameTextStyle: { color: ink2 }, axisLabel: { color: ink2 }, splitLine: { lineStyle: { color: palette.grid } } },
    series: [{ type: 'line', showSymbol: true, symbolSize: 6, lineStyle: { width: 2, color: palette['cat-1'] }, itemStyle: { color: palette['cat-1'] }, data: rp.map((p) => [p.rp, p.intensity]) }],
  }

  const pts = model.top_event.points
  const lo = Math.min(...pts.map((p) => p[2]))
  const hi = Math.max(...pts.map((p) => p[2]))
  const mapOption: EChartsOption = {
    grid: { left: 56, right: 16, top: 16, bottom: 72 },
    tooltip: { formatter: (p: unknown) => { const v = (p as { value: number[] }).value; return `${v[1].toFixed(3)}°N, ${v[0].toFixed(3)}°E<br/>Intensity ${fmt(v[2] ?? 0)}` } },
    visualMap: { type: 'continuous', min: lo, max: hi, dimension: 2, orient: 'horizontal', left: 'center', bottom: 4, text: [fmt(hi), fmt(lo)], textStyle: { color: ink2 }, inRange: { color: ['#cfe8f7', '#5aa7de', '#1d4f9e', '#13294f'] }, seriesIndex: 0 },
    xAxis: { type: 'value', scale: true, name: 'Longitude', nameLocation: 'middle', nameGap: 28, axisLabel: { color: ink2 }, nameTextStyle: { color: ink2 }, splitLine: { lineStyle: { color: palette.grid } } },
    yAxis: { type: 'value', scale: true, name: 'Latitude', nameTextStyle: { color: ink2 }, axisLabel: { color: ink2 }, splitLine: { lineStyle: { color: palette.grid } } },
    series: [
      { type: 'scatter', symbol: 'rect', symbolSize: 18, data: pts },
      { type: 'scatter', name: 'Portfolio', symbol: 'diamond', symbolSize: 14, itemStyle: { color: palette['cat-2'], borderColor: '#ffffff', borderWidth: 1.5 }, data: [[model.top_event.site[0], model.top_event.site[1], 0]], z: 5 },
    ],
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Events in the model" value={fmt(s.events)} sub={`${s.footprint_events} have a footprint`} />
        <Stat label="Simulated years" value={fmt(s.periods)} sub={`${s.active_periods} with at least one event`} />
        <Stat label="Events per year" value={fmt(s.events_per_year)} sub={`${fmt(s.occurrences)} occurrences in total`} />
        <Stat label="Area perils" value={s.area_perils} sub="Grid cells with hazard data" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Hazard at the portfolio site" subtitle="Annual maximum intensity against return period, from the 1,000 simulated years"
          actions={<Segmented label="Peril" value={peril} onChange={setPeril}
            options={[{ value: 'WTC', label: 'Wind' }, { value: 'WSS', label: 'Storm surge' }]} />}>
          <Chart option={rpOption} height={340} label={`Return period curve of ${model.peril_names[peril]} intensity at the portfolio`} />
          <DataTable name="table" caption="Intensity by return period" head={['Return period', `Intensity (${UNIT})`]}
            rows={rp.map((p) => [`${p.rp} y`, fmt(p.intensity)])} />
          <Info>
            Each year's value is the strongest event at the site that year, and the curve ranks the 1,000 years. The portfolio sits in
            area peril {model.site.area_perils[peril]}. Wind and surge use different intensity scales, which is why they have separate curves.
          </Info>
        </Card>

        <Card title="The strongest simulated wind event" subtitle={`Event ${model.top_event.id}: intensity in each area peril, with the portfolio marked`}>
          <Chart option={mapOption} height={400} label="Map of wind intensity per area peril for the strongest simulated event" />
          <Info>
            This event covers the whole modelled area with high winds, so the ten buildings are hit together. That shared exposure to a
            single footprint is what drives the correlated tail in the loss curves.
          </Info>
        </Card>
      </div>

      <Card title="How this maps to Oasis files">
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
          <li><code>events_p.csv</code> lists the {fmt(s.events)} event ids; <code>occurrence_lt.csv</code> places each one in a simulated year, which is what turns event losses into annual losses.</li>
          <li><code>footprint.csv</code> gives the intensity of each event in each area peril, here with a single intensity bin and no hazard uncertainty.</li>
          <li><code>areaperil_dict.csv</code> (in the keys data) maps coordinates to area perils; the keys lookup uses it to link each location to its footprint cell.</li>
        </ul>
      </Card>
    </div>
  )
}
