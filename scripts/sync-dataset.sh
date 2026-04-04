#!/bin/bash
# Sync Sanity dataset: production → staging
#
# Exports the production dataset and imports it into staging with --replace,
# making staging an exact mirror of production.
#
# Prerequisites:
#   - Sanity CLI installed: pnpm add -g sanity / npx sanity
#   - Authenticated: npx sanity login
#
# Usage:
#   ./scripts/sync-dataset.sh
set -euo pipefail

PROJECT_ID="vhb33jaz"
SOURCE_DATASET="production"
TARGET_DATASET="staging"
EXPORT_FILE="$(mktemp -d)/production-backup.tar.gz"

cleanup() {
  if [ -f "$EXPORT_FILE" ]; then
    rm -f "$EXPORT_FILE"
    echo "Cleaned up temporary export file."
  fi
  rmdir "$(dirname "$EXPORT_FILE")" 2>/dev/null || true
}
trap cleanup EXIT

echo "=== Sanity Dataset Sync ==="
echo "  Source:  ${SOURCE_DATASET}"
echo "  Target:  ${TARGET_DATASET}"
echo "  Project: ${PROJECT_ID}"
echo ""
echo "⚠️  This will REPLACE ALL data in the '${TARGET_DATASET}' dataset."
echo "   Any staging-specific data will be permanently deleted."
echo ""
read -r -p "Continue? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Exporting '${SOURCE_DATASET}' dataset..."
npx sanity dataset export "$SOURCE_DATASET" "$EXPORT_FILE" --project-id "$PROJECT_ID"

echo ""
echo "Importing into '${TARGET_DATASET}' dataset (--replace)..."
npx sanity dataset import "$EXPORT_FILE" "$TARGET_DATASET" --replace --project-id "$PROJECT_ID"

echo ""
echo "✅ Dataset sync complete: ${SOURCE_DATASET} → ${TARGET_DATASET}"
