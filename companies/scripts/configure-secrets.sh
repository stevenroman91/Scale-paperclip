#!/usr/bin/env bash
# Interactive secret configuration for Scale Group companies
# Usage: ./configure-secrets.sh [company-slug]
# Without argument, configures all companies

set -euo pipefail

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:4242}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY:?Set PAPERCLIP_API_KEY env var}"

prompt_secret() {
  local name="$1"
  local description="$2"
  local where="$3"

  echo ""
  echo "  $name"
  echo "  └─ $description"
  echo "  └─ Où l'obtenir : $where"
  read -sp "  └─ Valeur (entrée vide = skip) : " value
  echo ""

  if [ -n "$value" ]; then
    echo "$value"
  fi
}

configure_company_secrets() {
  local company_slug="$1"
  local company_id="$2"

  echo ""
  echo "══ Secrets pour $company_slug ══"

  case "$company_slug" in
    scale-group-hq)
      local secrets=(
        "QONTO_ORG_SLUG|Organization slug Qonto|Qonto > Paramètres > API"
        "QONTO_SECRET_KEY|Clé secrète API Qonto|Qonto > Paramètres > API"
        "PENNYLANE_API_TOKEN|Token API Pennylane|Pennylane > Paramètres > Intégrations"
        "REVOLUT_ACCESS_TOKEN|Token OAuth2 Revolut Business|Revolut Business > API Settings"
        "REVOLUT_REFRESH_TOKEN|Refresh token Revolut|Généré lors de l'auth OAuth2"
        "LINKEDIN_ACCESS_TOKEN|Token OAuth2 LinkedIn|LinkedIn Developer Portal"
      )
      ;;
    scalefast)
      local secrets=(
        "DISCORD_WEBHOOK_URL|Webhook Discord (rappels anti no-show)|Discord > Paramètres du canal > Intégrations"
        "KASPR_API_KEY|Clé API Kaspr (enrichissement)|Kaspr > Settings > API"
        "FULLENRICH_API_KEY|Token API FullEnrich (enrichissement)|FullEnrich > Dashboard > API"
        "OPENAI_API_KEY|Clé API OpenAI (Whisper + analysis)|platform.openai.com"
        "ANTHROPIC_API_KEY|Clé API Claude (call analysis)|console.anthropic.com"
        "DEEPGRAM_API_KEY|Clé API Deepgram (live transcription)|Deepgram Dashboard"
        "RINGOVER_API_KEY|Clé API Ringover (téléphonie)|Ringover > Intégrations"
        "SENDGRID_API_KEY|Clé API SendGrid (emails)|SendGrid Dashboard"
      )
      ;;
    scalecall)
      local secrets=(
        "RINGOVER_API_KEY|Clé API Ringover|Ringover > Intégrations"
        "AIRCALL_API_ID|API ID Aircall|Aircall > Intégrations"
        "AIRCALL_API_TOKEN|Token Aircall|Aircall > Intégrations"
      )
      ;;
    scaleacademy)
      local secrets=(
        "OPENAI_API_KEY|Clé API OpenAI (call simulation)|platform.openai.com"
        "ANTHROPIC_API_KEY|Clé API Claude (AI Tutor)|console.anthropic.com"
      )
      ;;
    scalehq)
      local secrets=(
        "STRIPE_SECRET_KEY|Clé secrète Stripe|Stripe Dashboard"
        "STRIPE_WEBHOOK_SECRET|Secret webhook Stripe|Stripe > Webhooks"
        "DATABASE_URL|PostgreSQL connection string|Railway ou hébergeur"
        "NEXTAUTH_SECRET|Secret NextAuth (générer avec openssl rand -base64 32)|Auto-généré"
        "OPENAI_API_KEY|Clé API OpenAI|platform.openai.com"
        "ANTHROPIC_API_KEY|Clé API Claude|console.anthropic.com"
        "DEEPGRAM_API_KEY|Clé API Deepgram|Deepgram Dashboard"
        "SENDGRID_API_KEY|Clé API SendGrid|SendGrid Dashboard"
      )
      ;;
    *)
      echo "  Unknown company: $company_slug"
      return
      ;;
  esac

  local configured=0
  for secret_entry in "${secrets[@]}"; do
    IFS='|' read -r name description where <<< "$secret_entry"
    value=$(prompt_secret "$name" "$description" "$where")

    if [ -n "$value" ]; then
      # Store secret via Paperclip API
      curl -sS -X PATCH "$PAPERCLIP_API_URL/api/companies/$company_id" \
        -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"settings\": {\"secrets\": {\"$name\": \"$value\"}}}" > /dev/null 2>&1 \
        && echo "    ✓ $name configured" \
        || echo "    ✗ $name failed"
      configured=$((configured + 1))
    else
      echo "    ○ $name skipped"
    fi
  done

  echo ""
  echo "  $configured/${#secrets[@]} secrets configured for $company_slug"
}

# Main
echo "╔══════════════════════════════════════════╗"
echo "║   Scale Group — Configure Secrets        ║"
echo "╚══════════════════════════════════════════╝"

TARGET="${1:-all}"

# Get list of companies
COMPANIES_JSON=$(curl -sS "$PAPERCLIP_API_URL/api/companies" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" 2>&1)

if [ "$TARGET" = "all" ]; then
  SLUGS=("scale-group-hq" "scalefast" "scalecall" "scaleacademy" "scalehq")
else
  SLUGS=("$TARGET")
fi

for slug in "${SLUGS[@]}"; do
  company_id=$(echo "$COMPANIES_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
companies = data if isinstance(data, list) else data.get('data', [])
for c in companies:
    if c.get('slug') == '$slug' or '$slug' in c.get('name','').lower().replace(' ','-'):
        print(c['id']); break
" 2>/dev/null || echo "")

  if [ -z "$company_id" ]; then
    echo "Warning: Company '$slug' not found in Paperclip. Import it first."
    continue
  fi

  configure_company_secrets "$slug" "$company_id"
done

echo ""
echo "Done! Secrets are stored encrypted in Paperclip."
