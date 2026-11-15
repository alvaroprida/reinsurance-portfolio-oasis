#!/usr/bin/env bash
# Reproducible PiWind run under WSL2 (Ubuntu). One-off setup is at the bottom.
# Usage: bash run_piwind.sh [run_dir]
set -euo pipefail

RUN_DIR="${1:-$HOME/piwind_run}"
HERE="$(cd "$(dirname "$0")" && pwd)"

. ~/.venvs/oasis/bin/activate
cd "$HERE/OasisPiWind"
rm -rf "$RUN_DIR"

# 2 processes: 8 (the PiWind default) gets OOM-killed on a 7 GB WSL VM.
oasislmf model run --config oasislmf.json --model-run-dir "$RUN_DIR" --kernel-num-processes 2

echo "Outputs in $RUN_DIR/output"

# --- One-off setup ---------------------------------------------------------
# curl -LsSf https://astral.sh/uv/install.sh | sh
# uv python install 3.11 && uv venv ~/.venvs/oasis --python 3.11
# . ~/.venvs/oasis/bin/activate && uv pip install "oasislmf[extra]"
# ktools engine is NOT bundled with the pip package:
# curl -sL https://github.com/OasisLMF/ktools/releases/download/v3.12.5/Linux_x86_64.tar.gz | tar xz
# cp <extracted binaries> ~/.venvs/oasis/bin/
# git clone --depth 1 https://github.com/OasisLMF/OasisPiWind.git
