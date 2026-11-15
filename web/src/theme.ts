import { useEffect, useState } from 'react'

const ROLES = [
  'surface', 'text-primary', 'text-secondary', 'text-muted', 'grid', 'axis', 'accent', 'neutral',
  'cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5',
] as const

export type Palette = Record<(typeof ROLES)[number], string>

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement)
  return Object.fromEntries(ROLES.map((r) => [r, css.getPropertyValue(`--${r}`).trim()])) as Palette
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Resolved colour roles, re-read when the OS switches light/dark. */
export function usePalette(): { palette: Palette; dark: boolean } {
  const [state, setState] = useState(() => ({ palette: readPalette(), dark: darkQuery().matches }))
  useEffect(() => {
    const mq = darkQuery()
    const update = () => setState({ palette: readPalette(), dark: mq.matches })
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return state
}
