# Reinsurance portfolio assessment with Oasis LMF

Case study for the *Retention & Transfer* phase of [alvaroprida.github.io](https://alvaroprida.github.io):
from a cedant's exposure to gross, insured and net loss curves and, next, the technical price of an
excess-of-loss layer, using the open-source [Oasis Loss Modelling Framework](https://github.com/OasisLMF).

**Status: work in progress.** Results so far come from Oasis's PiWind demonstration model
(10 buildings, UK windstorm), used to learn the framework. A model built from open hazard data
and a larger synthetic portfolio come next.

## Layout

| Path | What |
|---|---|
| `pipeline/run_piwind.sh` | Runs PiWind end-to-end with `oasislmf` (WSL2 / Linux). Setup steps are in its comments |
| `pipeline/export_results.py` | Exports exposure and ORD outputs to `web/public/data/piwind.json` |
| `web/` | The tabbed site (React, Vite, ECharts, Tailwind) |

`pipeline/OasisPiWind/` is a clone of the PiWind repo and is git-ignored.

## Run it

```sh
bash pipeline/run_piwind.sh          # Linux or WSL2, about 3 minutes
python pipeline/export_results.py
cd web && npm ci && npm run dev
```

Notes from setting it up: the ktools engine is not bundled with the `oasislmf` pip package and is
downloaded separately; PiWind's default of 8 processes ran out of memory on a 7 GB WSL machine, so
the script uses 2.

## Licence

Site code under the MIT licence. Oasis LMF and PiWind are by the Oasis LMF project (BSD-2).
Illustrative exercise on a synthetic portfolio; not an offer of reinsurance.
