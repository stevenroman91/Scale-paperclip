#!/usr/bin/env bash
# Import all 5 Scale Group companies into Paperclip
# Usage: ./import-all.sh
# Requires: PAPERCLIP_API_URL and PAPERCLIP_API_KEY env vars

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Import order matters: holding first, then subsidiaries
COMPANIES=(
  "scale-group-hq"
  "scalefast"
  "scalehq"
  "scalecall"
  "scaleacademy"
)

echo "╔══════════════════════════════════════════╗"
echo "║   Scale Group — Import all companies     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check prerequisites
if [ -z "${PAPERCLIP_API_URL:-}" ]; then
  export PAPERCLIP_API_URL="http://localhost:4242"
  echo "PAPERCLIP_API_URL not set, using default: $PAPERCLIP_API_URL"
fi

if [ -z "${PAPERCLIP_API_KEY:-}" ]; then
  echo "Error: PAPERCLIP_API_KEY is required."
  echo ""
  echo "Get your API key from the Paperclip UI (http://localhost:4242)"
  echo "or set it with: export PAPERCLIP_API_KEY=your-key-here"
  exit 1
fi

# Check Paperclip is running
echo "Checking Paperclip connection..."
if ! curl -sS --max-time 5 "$PAPERCLIP_API_URL/api/health" > /dev/null 2>&1; then
  echo "Error: Cannot reach Paperclip at $PAPERCLIP_API_URL"
  echo "Start Paperclip first: npx paperclipai start"
  exit 1
fi
echo "  Connected to Paperclip at $PAPERCLIP_API_URL"
echo ""

# Import each company
FAILED=()
for company in "${COMPANIES[@]}"; do
  echo "────────────────────────────────────────"
  "$SCRIPT_DIR/import-company.sh" "$company" || {
    echo "  FAILED: $company"
    FAILED+=("$company")
  }
  echo ""
done

# Summary
echo "════════════════════════════════════════"
echo "Import complete!"
echo ""
echo "  Successful: $((${#COMPANIES[@]} - ${#FAILED[@]}))/${#COMPANIES[@]}"
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "  Failed: ${FAILED[*]}"
fi
echo ""
echo "Next steps:"
echo "  1. Configure secrets: ./configure-secrets.sh"
echo "  2. Activate routines: ./activate-routines.sh"
echo "  3. Open Paperclip UI: $PAPERCLIP_API_URL"
