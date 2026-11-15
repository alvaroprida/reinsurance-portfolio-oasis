"""Export an Oasis run (exposure inputs + ORD outputs) to the JSON the website reads.

Usage: python export_results.py [run_dir] [model_dir] [out_json]
Run it with the same venv as run_piwind.sh. Only reads the run; never modifies it.
"""
import json
import sys
from datetime import date
from pathlib import Path

import oasislmf
import pandas as pd

HERE = Path(__file__).resolve().parent
run_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "piwind_run"
model_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / "OasisPiWind"
out = Path(sys.argv[3]) if len(sys.argv) > 3 else HERE.parent / "web" / "public" / "data" / "piwind.json"

inputs = model_dir / "tests" / "inputs"
loc = pd.read_csv(inputs / "SourceLocOEDPiWind10.csv")
acc = pd.read_csv(inputs / "SourceAccOEDPiWind.csv")
ri_info = pd.read_csv(inputs / "SourceReinsInfoOEDPiWind.csv")
ri_scope = pd.read_csv(inputs / "SourceReinsScopeOEDPiWind.csv")
settings = json.loads((run_dir / "output" / "analysis_settings.json").read_text())

# ORD codes: EPCalc 2 = full uncertainty; EPType 1 = OEP, 3 = AEP.
EP_CALC_FULL, EP_OEP, EP_AEP = 2, 1, 3
# ORD palt SampleType: 1 = analytical mean, 2 = sample mean.
ST_ANALYTICAL, ST_SAMPLE = 1, 2


def ep_curve(level: str, ep_type: int) -> list[dict]:
    e = pd.read_csv(run_dir / "output" / f"{level}_S1_ept.csv")
    e = e[(e.EPCalc == EP_CALC_FULL) & (e.EPType == ep_type)].sort_values("ReturnPeriod")
    return [{"rp": float(r.ReturnPeriod), "loss": float(r.Loss)} for r in e.itertuples()]


def aal(level: str) -> dict:
    a = pd.read_csv(run_dir / "output" / f"{level}_S1_palt.csv").set_index("SampleType")
    return {
        "analytical": float(a.loc[ST_ANALYTICAL, "MeanLoss"]),
        "sample": float(a.loc[ST_SAMPLE, "MeanLoss"]),
        "sd": float(a.loc[ST_SAMPLE, "SDLoss"]),
    }


levels = ["gul", "il", "ri"]
result = {
    "generated": date.today().isoformat(),
    "oasislmf": oasislmf.__version__,
    "model": "PiWind (OasisLMF demonstration model, wind and storm surge)",
    "samples": settings.get("number_of_samples"),
    "locations": [
        {
            "id": str(r.LocNumber),
            "lat": r.Latitude,
            "lon": r.Longitude,
            "tiv": float(r.BuildingTIV + r.ContentsTIV),
            "occupancy": int(r.OccupancyCode),
            "construction": int(r.ConstructionCode),
        }
        for r in loc.itertuples()
    ],
    "policies": acc[["PolNumber", "LayerNumber", "LayerParticipation", "LayerAttachment", "LayerLimit"]].to_dict("records"),
    "reinsurance": {
        "info": ri_info.drop(columns=["OEDVersion"]).to_dict("records"),
        "scope": ri_scope[["ReinsNumber", "LocNumber", "CededPercent"]].to_dict("records"),
    },
    "aal": {lv: aal(lv) for lv in levels},
    "oep": {lv: ep_curve(lv, EP_OEP) for lv in levels},
    "aep": {lv: ep_curve(lv, EP_AEP) for lv in levels},
}
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, indent=1))
print(f"wrote {out} ({out.stat().st_size / 1024:.1f} kB)")
