#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$ROOT_DIR/public"
SOURCE="${1:-$PUBLIC_DIR/icon-source.png}"

if [[ ! -f "$SOURCE" ]]; then
  echo "Source image not found: $SOURCE" >&2
  exit 1
fi

cp "$SOURCE" "$PUBLIC_DIR/icon-source.png"

declare -a SPECS=(
  "16:favicon-16"
  "32:favicon-32"
  "180:apple-touch-icon"
  "192:icon-192"
  "512:icon-512"
  "1024:icon-1024"
)

for spec in "${SPECS[@]}"; do
  size="${spec%%:*}"
  name="${spec##*:}"
  sips -z "$size" "$size" "$PUBLIC_DIR/icon-source.png" --out "$PUBLIC_DIR/${name}.png" >/dev/null
  echo "Wrote ${name}.png (${size}x${size})"
done
