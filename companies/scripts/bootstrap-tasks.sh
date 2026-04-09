#!/usr/bin/env bash
# Create initial bootstrap tasks for each company's CEO
# These are the first tasks that kick off autonomous operation
# Usage: ./bootstrap-tasks.sh [company-slug]

set -euo pipefail

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:4242}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY:?Set PAPERCLIP_API_KEY env var}"

create_task() {
  local company_id="$1"
  local agent_id="$2"
  local title="$3"
  local description="$4"
  local priority="${5:-high}"

  curl -sS -X POST "$PAPERCLIP_API_URL/api/companies/$company_id/issues" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"description\": \"$description\",
      \"assigneeAgentId\": \"$agent_id\",
      \"status\": \"todo\",
      \"priority\": \"$priority\"
    }" > /dev/null 2>&1 \
    && echo "  ✓ $title" \
    || echo "  ✗ Failed: $title"
}

get_ceo_id() {
  local company_id="$1"
  curl -sS "$PAPERCLIP_API_URL/api/companies/$company_id/agents" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
agents = data if isinstance(data, list) else data.get('data', [])
for a in agents:
    if a.get('role') == 'ceo':
        print(a['id']); break
" 2>/dev/null || echo ""
}

get_company_id() {
  local slug="$1"
  curl -sS "$PAPERCLIP_API_URL/api/companies" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
companies = data if isinstance(data, list) else data.get('data', [])
for c in companies:
    if c.get('slug') == '$slug' or '$slug' in c.get('name','').lower().replace(' ','-'):
        print(c['id']); break
" 2>/dev/null || echo ""
}

echo "╔══════════════════════════════════════════╗"
echo "║   Scale Group — Bootstrap Initial Tasks  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

TARGET="${1:-all}"

if [ "$TARGET" = "all" ]; then
  SLUGS=("scale-group-hq" "scalefast" "scalecall" "scaleacademy" "scalehq")
else
  SLUGS=("$TARGET")
fi

for slug in "${SLUGS[@]}"; do
  company_id=$(get_company_id "$slug")
  if [ -z "$company_id" ]; then
    echo "Warning: Company '$slug' not found. Import it first."
    continue
  fi

  ceo_id=$(get_ceo_id "$company_id")
  if [ -z "$ceo_id" ]; then
    echo "Warning: CEO not found for '$slug'."
    continue
  fi

  echo "═══ $slug (CEO: $ceo_id) ═══"

  case "$slug" in
    scale-group-hq)
      create_task "$company_id" "$ceo_id" \
        "Initialiser le pilotage financier du groupe" \
        "Configurer les connexions Qonto et Pennylane. Vérifier que le Controller peut accéder aux soldes bancaires. Lancer le premier Daily Cash Position manuellement pour valider le workflow. Objectif : avoir le rapport de trésorerie quotidien opérationnel d'ici vendredi." \
        "critical"

      create_task "$company_id" "$ceo_id" \
        "Établir la grille salariale et le process de paie" \
        "Demander au CHRO de définir la grille salariale Syntec pour chaque poste. Le Payroll Manager doit préparer le template de fiche de paie et vérifier les taux de charges sociales 2026. Objectif : premier cycle de paie automatisé le 25 du mois." \
        "high"

      create_task "$company_id" "$ceo_id" \
        "Lancer la stratégie LinkedIn du groupe" \
        "Le CMO doit définir les 5 piliers de contenu, le calendrier éditorial, et publier les 3 premiers posts. Cibler les dirigeants de PME B2B en France. KPI : 1000 impressions/semaine d'ici 1 mois." \
        "medium"
      ;;

    scalefast)
      create_task "$company_id" "$ceo_id" \
        "Auditer la performance actuelle des SDR" \
        "Le Sales Ops Manager doit générer le dashboard de performance de chaque SDR sur les 30 derniers jours : appels/jour, taux de conversion, no-show rate. Identifier les SDR sous-performants et les top performers. Fournir un rapport avec recommandations." \
        "critical"

      create_task "$company_id" "$ceo_id" \
        "Activer le système anti no-show amélioré" \
        "Vérifier que le Discord webhook est configuré. Tester l'envoi d'un rappel de test. Valider que les jours fériés français sont bien pris en compte (prochain : 1er mai). Activer le cron daily-anti-noshow." \
        "high"

      create_task "$company_id" "$ceo_id" \
        "Configurer le Live Call Coach pour un SDR pilote" \
        "Choisir 1 SDR volontaire pour tester le Live Call Coach. Configurer la connexion Ringover/Deepgram. Faire 5 appels avec l'assistance temps réel activée. Collecter le feedback du SDR. Décider si on déploie à toute l'équipe." \
        "high"
      ;;

    scalecall)
      create_task "$company_id" "$ceo_id" \
        "Onboarder le premier client volume" \
        "Définir le contrat type pour un client volume (ex: Codialis). Configurer les quotas (200 appels/jour). Assigner les SDR. Activer le tracking en temps réel. Générer le premier daily volume report." \
        "critical"

      create_task "$company_id" "$ceo_id" \
        "Définir le process qualité des appels" \
        "Le QA Agent doit créer la grille de scoring pour les appels volume (respect du script, ton, durée minimum). Écouter un échantillon de 20 appels et calibrer les seuils d'alerte qualité." \
        "high"
      ;;

    scaleacademy)
      create_task "$company_id" "$ceo_id" \
        "Migrer le contenu de formation existant" \
        "Récupérer les 20 articles wiki Google Docs existants dans scalefast-devis. Les convertir en modules e-learning avec le format du skill elearning-management. Créer le premier learning path 'SDR Junior Onboarding'." \
        "critical"

      create_task "$company_id" "$ceo_id" \
        "Créer les 3 premiers scénarios de simulation d'appel" \
        "L'AI Tutor Bot doit avoir au minimum 3 scénarios fonctionnels : 'Le décideur pressé', 'Le sceptique technique', 'Déjà un prestataire'. Tester chaque scénario avec un SDR senior pour valider le réalisme." \
        "high"
      ;;

    scalehq)
      create_task "$company_id" "$ceo_id" \
        "Mettre en place le pipeline feedback → fix automatique" \
        "Le PM doit configurer le widget de feedback in-app. Le Support Agent doit tester le triage automatique sur 10 feedbacks de test. Le Bug Fixer doit réussir à créer une PR automatiquement à partir d'un bug trié. Valider le flow de bout en bout." \
        "critical"

      create_task "$company_id" "$ceo_id" \
        "Implémenter le Live Call Assistant comme feature SaaS" \
        "Le CTO doit planifier l'implémentation du Live Call Assistant sur le plan Scale. Commencer par les Prisma models (LiveCallSession, LiveCallObjection, ObjectionTemplate). Puis l'API route /api/calls/live. Objectif : MVP fonctionnel en 2 sprints." \
        "high"

      create_task "$company_id" "$ceo_id" \
        "Configurer le monitoring continu" \
        "Le DevOps doit implémenter le health check endpoint /api/health. Activer la routine continuous-monitoring (toutes les 5 min). Configurer les alertes Discord en cas de downtime. Tester en simulant un crash." \
        "high"
      ;;
  esac

  echo ""
done

echo "Done! Initial tasks created for all companies."
echo "The CEO agents will pick them up on their next heartbeat."
