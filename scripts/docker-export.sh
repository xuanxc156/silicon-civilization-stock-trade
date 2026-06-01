#!/usr/bin/env bash
# ==========================================================================
# Build Docker images on a dev machine and export them as a portable tar.
#
# Prerequisites: copy .env.docker.example to .env and fill in your tokens
#   (also set mirror vars if you're in China — see .env.docker.example)
#
# Usage:
#   bash scripts/docker-export.sh              # default output: ./scs-images.tar
#   bash scripts/docker-export.sh ./my.tar     # custom output path
#
# Then copy the tar + docker-compose.yml + .env to your NAS:
#   docker load -i scs-images.tar
#   NAS_DATA_PATH=/volume1/docker/scs docker compose up -d
# ==========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/scs-images.tar}"

# Warn if .env is missing or has dummy tokens
if [ ! -f "$ROOT/.env" ]; then
  echo "WARNING: $ROOT/.env not found.  Copy .env.docker.example to .env first."
fi

echo "=== Building images (docker compose reads .env for mirror & token overrides) ==="
(cd "$ROOT" && docker compose build)

echo "=== Exporting images to $OUT ==="
docker save scs-pyserver:latest scs-web:latest -o "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo ""
echo "Done.  Exported: $OUT ($SIZE)"
echo ""
echo "Next steps:"
echo "  scp $OUT docker-compose.yml .env your-nas:/volume1/docker/scs/"
echo ""
echo "On NAS:"
echo "  cd /volume1/docker/scs"
echo "  docker load -i ../scs-images.tar"
echo "  mkdir -p /volume1/docker/scs/{pyserver,web/cache,web/data}"
echo "  chmod -R 755 /volume1/docker/scs"
echo "  NAS_DATA_PATH=/volume1/docker/scs docker compose up -d"
