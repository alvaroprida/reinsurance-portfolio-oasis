"""Export the Oasis model files (events, footprint, vulnerability) to the JSON behind the Hazard and Vulnerability tabs.

Usage: python export_model.py [run_dir] [model_dir] [out_json]
Reads PiWind's model_data / keys_data plus the keys the run generated (to link locations to area perils).
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
run_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "piwind_run"
model_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / "OasisPiWind"
out = Path(sys.argv[3]) if len(sys.argv) > 3 else HERE.parent / "web" / "public" / "data" / "model.json"

md = model_dir / "model_data" / "PiWind"
kd = model_dir / "keys_data" / "PiWind"

events = pd.read_csv(md / "events_p.csv")
occ = pd.read_csv(md / "occurrence_lt.csv")
fp = pd.read_csv(md / "footprint.csv")
ibins = pd.read_csv(md / "intensity_bin_dict.csv").set_index("bin_index")["interpolation"]
dbins = pd.read_csv(md / "damage_bin_dict.csv")
vuln = pd.read_csv(md / "vulnerability.csv")
vdict = pd.read_csv(kd / "vulnerability_dict.csv")
apdict = pd.read_csv(kd / "areaperil_dict.csv")
keys = pd.read_parquet(run_dir / "input" / "keys.parquet")

N_PERIODS = int(occ.period_no.max())
PERIL_NAME = {"WTC": "Wind (tropical cyclone)", "WSS": "Storm surge"}

# --- Footprint: expected intensity per (event, area peril). PiWind has one bin per pair, so no hazard uncertainty.
fp["intensity"] = fp.intensity_bin_id.map(ibins)
fp = fp.groupby(["event_id", "areaperil_id"]).apply(lambda g: (g.intensity * g.probability).sum(), include_groups=False)
fp = fp.rename("intensity").reset_index()

# Area peril centres and their peril (each area peril id belongs to one peril).
apdict["lon"] = apdict[["LON1", "LON2", "LON3", "LON4"]].mean(axis=1)
apdict["lat"] = apdict[["LAT1", "LAT2", "LAT3", "LAT4"]].mean(axis=1)
ap = apdict.drop_duplicates("AREA_PERIL_ID").set_index("AREA_PERIL_ID")[["PERIL_ID", "lon", "lat"]]
fp = fp.join(ap, on="areaperil_id")

# --- Hazard at the portfolio: annual maximum intensity per simulated year, then return-period curve.
RPS = [2, 5, 10, 20, 50, 100, 200, 500, 1000]
hazard_rp = {}
site = {}
for peril, g in keys[keys.CoverageTypeID == 1].groupby("PerilID"):
    apid = int(g.AreaPerilID.iloc[0])
    site[peril] = apid
    ev = fp[fp.areaperil_id == apid][["event_id", "intensity"]].merge(occ[["event_id", "period_no"]], on="event_id")
    annual = ev.groupby("period_no").intensity.max().reindex(range(1, N_PERIODS + 1), fill_value=0).sort_values(ascending=False).to_numpy()
    # k-th largest of N years has return period N / k
    hazard_rp[peril] = [{"rp": rp, "intensity": float(annual[max(int(round(N_PERIODS / rp)) - 1, 0)])} for rp in RPS]

# --- Footprint of the strongest wind event: area perils plus the portfolio site.
wind = fp[fp.PERIL_ID == "WTC"]
top_event = int(wind.groupby("event_id").intensity.mean().idxmax())
top = wind[wind.event_id == top_event]
loc = pd.read_csv(model_dir / "tests" / "inputs" / "SourceLocOEDPiWind10.csv")

# --- Vulnerability: mean and spread of the damage ratio at each intensity, per curve (building coverage only).
dr = dbins.set_index("bin_index")["interpolation"]
vuln["dr"] = vuln.damage_bin_id.map(dr)
vuln["m1"] = vuln.probability * vuln.dr
vuln["m2"] = vuln.probability * vuln.dr**2
curves = []
for r in vdict[vdict.COVERAGE_TYPE == 1].itertuples():
    v = vuln[vuln.vulnerability_id == r.VULNERABILITY_ID].groupby("intensity_bin_id")[["m1", "m2"]].sum()
    v["x"] = v.index.map(ibins)
    v = v.sort_values("x")
    sd = np.sqrt(np.maximum(v.m2 - v.m1**2, 0))
    curves.append({
        "id": int(r.VULNERABILITY_ID), "peril": r.PERIL_ID, "occupancy": int(r.OCCUPANCYCODE),
        "x": v.x.round(2).tolist(), "mean": v.m1.round(4).tolist(), "sd": sd.round(4).tolist(),
    })

# Damage-ratio distribution of the portfolio's own wind curve at three intensities (low, mid, high mean damage).
site_vid = int(keys[(keys.PerilID == "WTC") & (keys.CoverageTypeID == 1)].VulnerabilityID.iloc[0])
sv = vuln[vuln.vulnerability_id == site_vid]
means = sv.groupby("intensity_bin_id").m1.sum()
pick = [int((means - t).abs().idxmin()) for t in (0.1, 0.45, 0.9)]
dist = [{
    "intensity": float(ibins[b]), "mean": float(means[b]),
    "probs": sv[sv.intensity_bin_id == b].set_index("damage_bin_id").probability.reindex(dbins.bin_index, fill_value=0).round(4).tolist(),
} for b in pick]

n_occ = len(occ)
result = {
    "stats": {
        "events": int(len(events)), "periods": N_PERIODS, "occurrences": n_occ,
        "active_periods": int(occ.period_no.nunique()), "events_per_year": round(n_occ / N_PERIODS, 2),
        "footprint_events": int(fp.event_id.nunique()), "area_perils": int(fp.areaperil_id.nunique()),
    },
    "site": {"area_perils": site, "vulnerability_id": site_vid, "occupancy": int(loc.OccupancyCode.iloc[0])},
    "hazard_rp": hazard_rp,
    "top_event": {
        "id": top_event, "points": [[round(r.lon, 4), round(r.lat, 4), float(r.intensity)] for r in top.itertuples()],
        "site": [float(loc.Longitude.mean()), float(loc.Latitude.mean())],
    },
    "peril_names": PERIL_NAME,
    "curves": curves,
    "damage_bins": [round(x, 3) for x in dbins.interpolation],
    "distribution": dist,
}
out.write_text(json.dumps(result))
print(f"wrote {out} ({out.stat().st_size / 1024:.1f} kB)")
print(json.dumps({k: result[k] for k in ("stats", "site", "hazard_rp")}, indent=1)[:1800])
print("top event", top_event, "points", len(top), "intensity range", float(top.intensity.min()), float(top.intensity.max()))
