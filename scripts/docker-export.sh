#!/usr/bin/env bash
# ==========================================================================
# Build Docker images on a dev machine and export them as a portable tar.
# Copy the tar + docker-compose.yml + .env to your NAS, then:
#   docker load -i scs-images.tar
#   NAS_DATA_PATH=/volume1/docker/scs docker compose up -d
# ==========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/scs-images.tar}"

echo "=== Building pyserver image ==="
(cd "$ROOT" && docker build -t scs-pyserver:latest -f Dockerfile.pyserver .)

echo "=== Building web image ==="
(cd "$ROOT" && docker build -t scs-web:latest -f Dockerfile.web .)

echo "=== Exporting images to $OUT ==="
docker save scs-pyserver:latest scs-web:latest -o "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo ""
echo "Done.  Next steps:"
echo "  1. Copy to NAS:"
echo "     scp $OUT your-nas:/volume1/docker/"
echo "     scp docker-compose.yml .env your-nas:/volume1/docker/scs/"
echo ""
echo "  2. On NAS:"
echo "     cd /volume1/docker/scs"
echo "     docker load -i ../scs-images.tar"
echo "     mkdir -p /volume1/docker/scs/{pyserver,web/cache,web/data}"
echo "     chmod -R 755 /volume1/docker/scs"
echo "     NAS_DATA_PATH=/volume1/docker/scs docker compose up -d"
echo ""
echo "  Exported: $OUT ($SIZE)"
