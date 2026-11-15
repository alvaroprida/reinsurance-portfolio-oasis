import { Card, Info } from './ui'

/** Placeholder for a tab whose content needs the open-data model; says what it will show and which Oasis files feed it. */
export function Planned({ title, shows, oasis, now }: { title: string; shows: string[]; oasis: string[]; now: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card title={title} subtitle="Planned">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
          {shows.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <Info>{now}</Info>
      </Card>
      <Card title="Oasis files behind this tab">
        <ul className="space-y-1 text-sm text-ink-2">
          {oasis.map((f) => <li key={f}><code className="rounded bg-banner px-1.5 py-0.5 text-[13px] text-ink">{f}</code></li>)}
        </ul>
      </Card>
    </div>
  )
}
