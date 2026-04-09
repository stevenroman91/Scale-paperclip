# Scale Group — Guide de déploiement

Ce répertoire contient les 5 companies du Scale Group, prêtes à être importées dans Paperclip.

## Prérequis

1. **Paperclip** installé et lancé (`npx paperclipai` ou Docker)
2. **Clés API** pour les intégrations (voir section Secrets)
3. **Node.js 18+** pour les scripts d'import

## Architecture

```
Scale Group
├── scale-group-hq/    Holding — finance, RH, marketing (12 agents)
├── scalefast/         Agence SDR → RDV qualifiés (9 agents)
├── scalecall/         Agence SDR → volume d'appels (5 agents)
├── scaleacademy/      Formation SDR (6 agents)
└── scalehq/           SaaS B2B (12 agents)
```

## Déploiement rapide

### Étape 1 — Lancer Paperclip

```bash
# Option A : CLI (recommandé pour commencer)
npx paperclipai start

# Option B : Docker
docker compose -f docker/docker-compose.yml up -d
```

L'interface sera disponible sur `http://localhost:4242`.

### Étape 2 — Importer les companies

```bash
# Importer les 5 companies une par une
./scripts/import-all.sh

# Ou importer une seule company
./scripts/import-company.sh scale-group-hq
```

### Étape 3 — Configurer les secrets

```bash
# Interactif : configure les clés API pour chaque company
./scripts/configure-secrets.sh
```

### Étape 4 — Activer les routines

```bash
# Crée toutes les routines (crons) définies dans les tasks/
./scripts/activate-routines.sh
```

### Étape 5 — Donner du travail initial

```bash
# Crée les premières tasks pour les CEO de chaque company
./scripts/bootstrap-tasks.sh
```

## Secrets requis par company

### Scale Group HQ

| Secret | Description | Où l'obtenir |
|--------|-------------|-------------|
| `QONTO_ORG_SLUG` | Organization slug Qonto | Qonto > Paramètres > API |
| `QONTO_SECRET_KEY` | Clé API Qonto | Qonto > Paramètres > API |
| `PENNYLANE_API_TOKEN` | Token API Pennylane | Pennylane > Paramètres > Intégrations |
| `REVOLUT_ACCESS_TOKEN` | Token OAuth2 Revolut Business | Revolut Business > API Settings |
| `REVOLUT_REFRESH_TOKEN` | Refresh token Revolut | Généré lors de l'auth OAuth2 |
| `LINKEDIN_ACCESS_TOKEN` | Token OAuth2 LinkedIn | LinkedIn Developer Portal |

### ScaleFast

| Secret | Description | Où l'obtenir |
|--------|-------------|-------------|
| `DISCORD_WEBHOOK_URL` | Webhook Discord pour les rappels | Discord > Paramètres du canal > Intégrations |
| `KASPR_API_KEY` | Clé API Kaspr | Kaspr > Settings > API |
| `FULLENRICH_API_KEY` | Token API FullEnrich | FullEnrich > Dashboard > API |
| `OPENAI_API_KEY` | Clé API OpenAI (Whisper + analysis) | platform.openai.com |
| `ANTHROPIC_API_KEY` | Clé API Claude (call analysis) | console.anthropic.com |
| `DEEPGRAM_API_KEY` | Clé API Deepgram (live transcription) | Deepgram Dashboard |
| `RINGOVER_API_KEY` | Clé API Ringover | Ringover > Intégrations |
| `GOOGLE_CALENDAR_CREDS` | Service account JSON Google Calendar | Google Cloud Console |
| `SENDGRID_API_KEY` | Clé API SendGrid (emails) | SendGrid Dashboard |

### ScaleCall

| Secret | Description | Où l'obtenir |
|--------|-------------|-------------|
| `RINGOVER_API_KEY` | Clé API Ringover | Ringover > Intégrations |
| `AIRCALL_API_ID` | API ID Aircall | Aircall > Intégrations |
| `AIRCALL_API_TOKEN` | Token Aircall | Aircall > Intégrations |

### ScaleAcademy

| Secret | Description | Où l'obtenir |
|--------|-------------|-------------|
| `OPENAI_API_KEY` | Clé API OpenAI (call simulation) | platform.openai.com |
| `ANTHROPIC_API_KEY` | Clé API Claude (AI Tutor) | console.anthropic.com |

### ScaleHQ

| Secret | Description | Où l'obtenir |
|--------|-------------|-------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | Stripe > Webhooks |
| `DATABASE_URL` | PostgreSQL connection string | Railway ou hébergeur |
| `NEXTAUTH_SECRET` | Secret NextAuth | Générer avec `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Clé API OpenAI | platform.openai.com |
| `ANTHROPIC_API_KEY` | Clé API Claude | console.anthropic.com |
| `DEEPGRAM_API_KEY` | Clé API Deepgram | Deepgram Dashboard |
| `SENDGRID_API_KEY` | Clé API SendGrid | SendGrid Dashboard |

## Routines activées

| Company | Routine | Fréquence | Agent |
|---------|---------|-----------|-------|
| Scale Group HQ | Daily Cash Position | Chaque jour 8h | Controller |
| Scale Group HQ | Weekly Financial Report | Lundi 9h | CFO |
| Scale Group HQ | Monthly Closing | 1er du mois 8h | Controller |
| Scale Group HQ | Payroll Cycle | 25 du mois 9h | Payroll Manager |
| Scale Group HQ | Weekly Content Calendar | Lundi 10h | Content Manager |
| Scale Group HQ | Monthly HR Review | 1er du mois 10h | CHRO |
| Scale Group HQ | Quarterly Performance Review | Trimestriel | People Development |
| ScaleFast | Daily SDR Performance | Chaque jour 18h | Sales Ops Manager |
| ScaleFast | Weekly Client Report | Vendredi 17h | Pipeline Controller |
| ScaleFast | Daily Anti No-Show | Chaque jour 9h | Anti No-Show Agent |
| ScaleFast | Weekly Coaching Review | Mercredi 10h | SDR Coach |
| ScaleCall | Daily Volume Report | Chaque jour 18h | Sales Ops Manager |
| ScaleCall | Weekly Quality Audit | Vendredi 14h | QA Agent |
| ScaleCall | Monthly Capacity Review | 1er du mois 10h | Capacity Planner |
| ScaleAcademy | Monthly Content Review | 1er du mois 14h | Curriculum Designer |
| ScaleAcademy | Weekly Learner Progress | Lundi 9h | Trainer Agent |
| ScaleHQ | Daily Feedback Triage | Chaque jour 9h | Support Agent |
| ScaleHQ | Weekly Product Review | Lundi 10h | PM |
| ScaleHQ | Continuous Monitoring | Toutes les 5 min | DevOps |
| ScaleHQ | Release Changelog | Sur deploy | Engineer |

## Ordre de déploiement recommandé

1. **Scale Group HQ** en premier (c'est la holding, elle coordonne tout)
2. **ScaleFast** (l'agence existante, la plus critique)
3. **ScaleHQ** (le SaaS, a son propre repo)
4. **ScaleCall** (nouvelle agence, fork partiel de ScaleFast)
5. **ScaleAcademy** (formation, peut attendre que les données terrain soient disponibles)

## Liens utiles

- ScaleFast Copilot repo : `stevenroman91/scalefast-devis`
- ScaleHQ repo : `stevenroman91/ScaleHQ`
- Paperclip docs : `doc/PRODUCT.md`
