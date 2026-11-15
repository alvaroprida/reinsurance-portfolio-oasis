import type { EChartsOption } from 'echarts'
import { useState } from 'react'
import { LEVEL_LABEL, type Level, type SiteData } from '../data'
import { fmt } from '../format'
import type { Palette } from '../theme'
import { Card, Chart, DataTable, Info, Legend, Segmented } from './ui'

const LEVELS: Level[] = ['gul', 'il', 'ri']
const COLOR: Record<Level, 'cat-1' | 'cat-2' | 'cat-3'> = { gul: 'cat-1', il: 'cat-2', ri: 'cat-3' }

/** Exceedance-probability chart: loss against return period on a log axis. Shared by the loss and reinsurance tabs. */
export function EpChart({ data, palette, kind, levels }: { data: SiteData; palette: Palette; kind: 'oep' | 'aep'; levels: Level[] }) {
  const option: EChartsOption = {
    grid: { left: 70, right: 16, top: 16, bottom: 48 },
    tooltip: { trigger: 'axis', valueFormatter: (v: unknown) => `£${fmt(Number(v))}` },
    xAxis: {
      type: 'log', min: 2, max: 5000, name: 'Return period (years)', nameLocation: 'middle', nameGap: 30,
      axisLabel: { color: palette['text-secondary'] }, nameTextStyle: { color: palette['text-secondary'] },
      axisLine: { lineStyle: { color: palette.axis } }, splitLine: { lineStyle: { color: palette.grid } },
    },
    yAxis: {
      type: 'value', name: 'Loss (£)', nameTextStyle: { color: palette['text-secondary'] },
      axisLabel: { color: palette['text-secondary'], formatter: (v: number) => `${fmt(v / 1e6, 1)}M` }, splitLine: { lineStyle: { color: palette.grid } },
    },
    series: levels.map((l) => ({
      name: LEVEL_LABEL[l], type: 'line', showSymbol: false, lineStyle: { width: 2, color: palette[COLOR[l]] }, itemStyle: { color: palette[COLOR[l]] },
      data: data[kind][l].map((p) => [p.rp, p.loss]),
    })),
  }
  return <Chart option={option} height={360} label={`${kind === 'oep' ? 'Occurrence' : 'Aggregate'} exceedance probability curves by loss level`} />
}

export function LossModel({ data, palette }: { data: SiteData; palette: Palette }) {
  const [kind, setKind] = useState<'oep' | 'aep'>('aep')
  const rps = data[kind].gul.map((p) => p.rp)
  return (
    <div className="space-y-4">
      <Card title="Exceedance probability curves" subtitle={`From ${data.samples ?? '?'} samples per event, full-uncertainty ORD output (${data.model})`}
        actions={<Segmented label="Curve type" value={kind} onChange={setKind}
          options={[{ value: 'aep', label: 'Annual total (AEP)' }, { value: 'oep', label: 'Largest event (OEP)' }]} />}>
        <Legend palette={palette} items={LEVELS.map((l) => ({ label: LEVEL_LABEL[l], role: COLOR[l], line: true }))} />
        <EpChart data={data} palette={palette} kind={kind} levels={LEVELS} />
        <DataTable name="table" caption="Loss by return period at each level"
          head={['Return period', ...LEVELS.map((l) => LEVEL_LABEL[l])]}
          rows={rps.map((rp, i) => [`${fmt(rp)} y`, ...LEVELS.map((l) => `£${fmt(data[kind][l][i].loss)}`)])} />
        <Info>
          AEP is the distribution of the total loss in a year; OEP is the distribution of the single largest event in a year.
          Reinsurers read the OEP for per-occurrence covers and the AEP for aggregate covers. The curves flatten at £3.4M because the
          portfolio cannot lose more than its total insured value.
        </Info>
      </Card>
      <Card title="Average annual loss" subtitle="Mean of the sampled annual losses, with the analytical mean for comparison">
        <DataTable name="table" caption="Average annual loss by level" head={['Level', 'Sample mean (£)', 'Analytical mean (£)', 'Std dev (£)']}
          rows={LEVELS.map((l) => [LEVEL_LABEL[l], fmt(data.aal[l].sample), fmt(data.aal[l].analytical), fmt(data.aal[l].sd)])} />
        <Info>
          The sample and analytical means differ because only {data.samples ?? 10} samples are drawn per event. More samples narrow the
          gap at the cost of run time. Checking that convergence is part of the methodology.
        </Info>
      </Card>
    </div>
  )
}
