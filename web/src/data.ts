import { useEffect, useState } from 'react'

export type Level = 'gul' | 'il' | 'ri'
export type EpPoint = { rp: number; loss: number }

/** Shape of public/data/piwind.json, written by pipeline/export_results.py. */
export interface SiteData {
  generated: string
  oasislmf: string
  model: string
  samples: number | null
  locations: { id: string; lat: number; lon: number; tiv: number; occupancy: number; construction: number }[]
  policies: { PolNumber: string; LayerNumber: number; LayerParticipation: number; LayerAttachment: number; LayerLimit: number }[]
  reinsurance: {
    info: Record<string, string | number>[]
    scope: { ReinsNumber: number; LocNumber: number; CededPercent: number }[]
  }
  aal: Record<Level, { analytical: number; sample: number; sd: number }>
  oep: Record<Level, EpPoint[]>
  aep: Record<Level, EpPoint[]>
}

export const LEVEL_LABEL: Record<Level, string> = {
  gul: 'Ground-up (gross)',
  il: 'Insured',
  ri: 'Net of reinsurance',
}

export function useSiteData() {
  const [data, setData] = useState<SiteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('./data/piwind.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])
  return { data, error }
}
