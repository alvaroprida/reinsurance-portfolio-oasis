import type { EChartsOption } from 'echarts'
import type { SiteData } from '../data'
import { fmt } from '../format'
import type { Palette } from '../theme'
import { Card, Chart, DataTable, Info, Stat } from './ui'

export function Exposure({ data, palette }: { data: SiteData; palette: Palette }) {
  const locs = data.locations
  const total = locs.reduce((s, l) => s + l.tiv, 0)
  const option: EChartsOption = {
    grid: { left: 70, right: 16, top: 16, bottom: 56 },
    tooltip: { trigger: 'axis', valueFormatter: (v: unknown) => `£${fmt(Number(v))}` },
    xAxis: {
      type: 'category', data: locs.map((l) => l.id.slice(-4)), name: 'Location (last 4 digits of LocNumber)', nameLocation: 'middle', nameGap: 32,
      axisLine: { lineStyle: { color: palette.axis } }, axisLabel: { color: palette['text-secondary'] }, nameTextStyle: { color: palette['text-secondary'] },
    },
    yAxis: {
      type: 'value', name: 'Total insured value (£)', nameTextStyle: { color: palette['text-secondary'] },
      axisLabel: { color: palette['text-secondary'], formatter: (v: number) => `${fmt(v / 1000, 0)}k` }, splitLine: { lineStyle: { color: palette.grid } },
    },
    series: [{ type: 'bar', data: locs.map((l) => l.tiv), itemStyle: { color: palette['cat-1'] }, barMaxWidth: 36 }],
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Locations" value={locs.length} sub="One account, wind and storm surge" />
        <Stat label="Total insured value" value={`£${fmt(total / 1e6, 1)}M`} sub="Building TIV; no contents or BI" />
        <Stat label="Largest location" value={`£${fmt(Math.max(...locs.map((l) => l.tiv)) / 1000, 0)}k`} sub="Sets the cap on any single-site loss" />
      </div>
      <Card title="Exposure by location" subtitle="PiWind's sample portfolio, read from the OED location file">
        <Chart option={option} height={300} label="Bar chart of total insured value for each of the ten locations" />
        <DataTable name="table" caption="Locations with coordinates, occupancy, construction and TIV"
          head={['Location', 'Lat', 'Lon', 'Occupancy', 'Construction', 'TIV (£)']}
          rows={locs.map((l) => [l.id, l.lat.toFixed(4), l.lon.toFixed(4), l.occupancy, l.construction, fmt(l.tiv)])} />
        <Info>
          All ten buildings sit on one street in Leicestershire, so a single storm hits them together. That is why the
          ground-up loss can reach the full £3.4M in the worst years. A real treaty submission would spread across many regions.
        </Info>
      </Card>
      <Card title="Policy terms" subtitle="From the OED account file: two layers on the same account">
        <DataTable name="policy layers" caption="Policy layers with participation, attachment and limit"
          head={['Policy', 'Layer', 'Participation', 'Attachment (£)', 'Limit (£)']}
          rows={data.policies.map((p) => [p.PolNumber, p.LayerNumber, `${p.LayerParticipation * 100}%`, fmt(p.LayerAttachment), fmt(p.LayerLimit)])} />
      </Card>
    </div>
  )
}
