---
name: live-call-assistant
description: Assistance temps réel pendant les appels SDR — détection d'objections, suggestions de réponses, actions post-appel automatisées
slug: live-call-assistant
version: 0.1.0
tags:
  - sales
  - real-time
  - telephony
  - coaching
---

# Live Call Assistant

Skill d'assistance en temps réel pour les appels de prospection SDR. Écoute les appels, détecte les objections, suggère des réponses, et automatise les actions post-appel.

## Architecture

### Flux temps réel

```
┌──────────────┐     WebSocket      ┌───────────────┐     Streaming     ┌──────────────┐
│  Téléphonie  │ ──────────────────→ │  Transcriber  │ ────────────────→ │   Analyzer   │
│  (Ringover/  │                     │  (Deepgram/   │                   │   (Claude)   │
│   Aircall)   │                     │   Whisper)    │                   │              │
└──────────────┘                     └───────────────┘                   └──────┬───────┘
                                                                                │
                                                                    ┌───────────┴──────────┐
                                                                    │                      │
                                                              ┌─────▼─────┐        ┌──────▼──────┐
                                                              │ Objection │        │   Context   │
                                                              │ Detector  │        │  Enricher   │
                                                              └─────┬─────┘        └──────┬──────┘
                                                                    │                      │
                                                              ┌─────▼──────────────────────▼─────┐
                                                              │       SDR Sidebar UI             │
                                                              │  (suggestions + infos prospect)  │
                                                              └──────────────────────────────────┘
```

## Intégration téléphonie

### Ringover Real-time API

```
WebSocket: wss://api.ringover.com/v2/realtime
Auth: Bearer token dans le header de connexion

Events reçus :
- call.started    → { call_id, from, to, direction, agent_id, agent_name }
- call.ringing    → { call_id, duration_ring }
- call.answered   → { call_id, answered_at }
- call.audio      → { call_id, audio_chunk: base64, sample_rate: 16000 }
- call.ended      → { call_id, duration, disposition, recording_url }
- call.transcript → { call_id, text, speaker: "agent"|"contact", timestamp }
```

**Note** : Si le provider ne supporte pas le streaming audio, fallback sur la transcription post-appel avec `call.transcript` events ou polling de l'enregistrement.

### Aircall Real-time Events

```
WebSocket: wss://api.aircall.io/v1/websocket
Auth: API ID + API Token

Events :
- call.created    → { id, direction, from, to, user { id, name } }
- call.answered   → { id, answered_at }
- call.ended      → { id, duration, recording }
- call.commented  → { id, comment }
```

Aircall ne fournit pas de streaming audio natif. Utiliser l'intégration Deepgram + numéro SIP pour intercepter l'audio en temps réel.

### Talkdesk

Talkdesk offre le streaming audio via leur "Voice API" (SIPREC).

## Transcription temps réel

### Option 1 : Deepgram (recommandé pour le temps réel)

```
WebSocket: wss://api.deepgram.com/v1/listen
Auth: Token=YOUR_API_KEY

Params: ?model=nova-2&language=fr&smart_format=true&diarize=true&interim_results=true

Envoi : audio chunks (PCM 16-bit, 16kHz, mono)
Réception : { transcript, confidence, is_final, speaker, words: [{ word, start, end }] }

Coût : $0.0043/minute (Nova-2)
Latence : ~300ms
```

### Option 2 : OpenAI Whisper (meilleur pour le français, plus lent)

```
POST https://api.openai.com/v1/audio/transcriptions
Content-Type: multipart/form-data

Body: file=<audio_chunk>, model=whisper-1, language=fr, response_format=verbose_json

Coût : $0.006/minute
Latence : ~2-5s (pas de streaming natif, traitement par chunks de 10s)
```

Pour le temps réel, privilégier Deepgram. Utiliser Whisper en fallback ou pour la transcription post-appel de qualité.

## Détection d'objections

### Modèle de classification

Utiliser Claude en streaming pour classifier chaque phrase du prospect :

```json
{
  "system": "Tu es un détecteur d'objections dans les appels de prospection B2B. Pour chaque phrase du prospect, détermine si c'est une objection, une question, un signal d'achat, ou une conversation neutre. Si c'est une objection, classifie-la.",
  "categories": [
    { "id": "price", "label": "Trop cher / pas le budget", "keywords": ["cher", "budget", "coût", "prix", "investissement"] },
    { "id": "competitor", "label": "Déjà un prestataire", "keywords": ["déjà", "prestataire", "concurrent", "fournisseur", "utilise"] },
    { "id": "timing", "label": "Pas le bon moment", "keywords": ["plus tard", "rappeler", "moment", "occupé", "timing"] },
    { "id": "authority", "label": "Pas le décideur", "keywords": ["décideur", "chef", "directeur", "collègue", "valider"] },
    { "id": "need", "label": "Pas de besoin", "keywords": ["besoin", "intéressé", "satisfait", "problème"] },
    { "id": "email", "label": "Envoyez un email", "keywords": ["email", "mail", "envoyer", "documentation"] },
    { "id": "trust", "label": "Manque de confiance", "keywords": ["références", "prouver", "garantie", "résultats"] },
    { "id": "complexity", "label": "Trop complexe", "keywords": ["compliqué", "complexe", "temps", "intégration"] }
  ]
}
```

### Base de réponses aux objections

```json
{
  "objections": [
    {
      "id": "price",
      "responses": [
        {
          "technique": "ROI",
          "text": "Je comprends la préoccupation budget. Nos clients dans votre secteur voient un ROI de X en Y mois. Si je vous montrais les chiffres concrets, ça vaudrait 15 minutes ?",
          "success_rate": 0.38,
          "usage_count": 245
        },
        {
          "technique": "Comparaison coût inaction",
          "text": "C'est un investissement, oui. Mais combien vous coûte aujourd'hui le fait de ne pas avoir assez de RDV qualifiés ? Si on calcule le coût d'un commercial qui passe 60% de son temps à prospecter...",
          "success_rate": 0.42,
          "usage_count": 189
        },
        {
          "technique": "Test pilote",
          "text": "Et si on faisait un test sur 1 mois ? Comme ça vous voyez les résultats avant de vous engager sur le long terme.",
          "success_rate": 0.51,
          "usage_count": 156
        }
      ]
    },
    {
      "id": "competitor",
      "responses": [
        {
          "technique": "Benchmark",
          "text": "C'est une bonne chose que vous ayez déjà un prestataire, ça veut dire que vous croyez dans l'externalisation. La vraie question c'est : êtes-vous satisfait des résultats ? Nos clients qui avaient un presta avant nous ont amélioré leur taux de conversion de X%.",
          "success_rate": 0.42,
          "usage_count": 312
        },
        {
          "technique": "Complémentarité",
          "text": "On ne cherche pas forcément à remplacer votre prestataire actuel. Beaucoup de nos clients nous utilisent en complément, sur un nouveau marché ou une nouvelle offre. Est-ce que vous avez des projets d'expansion ?",
          "success_rate": 0.35,
          "usage_count": 201
        }
      ]
    },
    {
      "id": "email",
      "responses": [
        {
          "technique": "Question filtre",
          "text": "Bien sûr, je vous envoie ça. Juste pour que l'email soit pertinent : c'est quoi votre principal défi en prospection aujourd'hui ?",
          "success_rate": 0.45,
          "usage_count": 278
        },
        {
          "technique": "Micro-engagement",
          "text": "Absolument. Et si l'email vous parle, est-ce qu'on pourrait bloquer 15 minutes cette semaine pour en discuter ?",
          "success_rate": 0.38,
          "usage_count": 195
        }
      ]
    },
    {
      "id": "timing",
      "responses": [
        {
          "technique": "Ancrage calendrier",
          "text": "Je comprends tout à fait. Pour ne pas vous relancer au mauvais moment, c'est quoi la meilleure période pour reprendre cette discussion ? Septembre ? Octobre ?",
          "success_rate": 0.52,
          "usage_count": 334
        },
        {
          "technique": "Urgence douce",
          "text": "Bien sûr. Juste pour info, on a un créneau de lancement pour de nouveaux clients en [mois]. Si le timing vous intéresse, il faudrait qu'on se parle d'ici [date]. Ça vous irait ?",
          "success_rate": 0.33,
          "usage_count": 167
        }
      ]
    },
    {
      "id": "authority",
      "responses": [
        {
          "technique": "Champion interne",
          "text": "Je comprends. Est-ce que vous seriez la bonne personne pour évaluer si ça pourrait intéresser [décideur] ? Si oui, je peux vous préparer un résumé de 2 pages que vous pourriez lui transmettre.",
          "success_rate": 0.40,
          "usage_count": 143
        }
      ]
    },
    {
      "id": "need",
      "responses": [
        {
          "technique": "Question de découverte",
          "text": "Je comprends. Si je peux me permettre une question : aujourd'hui, comment vous faites pour générer vos RDV avec des prospects qualifiés ?",
          "success_rate": 0.35,
          "usage_count": 256
        }
      ]
    }
  ]
}
```

Les taux de succès (`success_rate`) sont mis à jour en continu par le SDR Coach en analysant les appels passés.

## Actions post-appel

### Email récapitulatif

Claude prompt pour la génération :

```
Système : Tu génères un email de suivi professionnel après un appel de prospection B2B.
Contexte : 
- SDR : {sdr_name}
- Prospect : {prospect_name}, {prospect_title} chez {prospect_company}
- Transcription résumée : {call_summary}
- Points discutés : {discussion_points}
- Objections et réponses : {objections_handled}
- Prochaines étapes convenues : {next_steps}
- Ton détecté : {formality_level: "formel"|"semi-formel"|"décontracté"}

Génère un email de suivi qui :
1. Remercie pour le temps accordé
2. Résume les points clés discutés
3. Répond aux questions restées en suspens
4. Confirme les prochaines étapes
5. Inclut un CTA clair

Format : objet + corps (HTML)
Langue : français
Longueur : 150-250 mots
```

### Invitation calendrier

```json
{
  "detection_patterns": [
    "on se voit le {date}",
    "rendez-vous le {date} à {time}",
    "on se cale un créneau {day}",
    "mardi prochain à {time}",
    "la semaine prochaine"
  ],
  "calendar_event": {
    "title": "RDV {prospect_company} x ScaleFast",
    "description": "Suite à notre échange du {call_date}.\n\nPoints à aborder :\n{discussion_points}\n\nParticipants : {attendees}",
    "duration_minutes": 30,
    "video_link": "auto_generate",
    "reminders": [
      { "minutes": 1440, "method": "email" },
      { "minutes": 30, "method": "popup" }
    ],
    "attendees": ["{prospect_email}", "{sdr_email}", "{am_email}"]
  }
}
```

Google Calendar API :
```
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
Auth: Bearer OAuth2 token
Body: { summary, description, start, end, attendees, conferenceData, reminders }
```

### Notes CRM

Structure des notes auto-générées :

```json
{
  "call_id": "uuid",
  "call_date": "2026-04-09T14:30:00",
  "duration_seconds": 245,
  "sentiment": "positif",
  "qualification_bant": {
    "budget": { "score": 3, "notes": "Budget disponible Q3" },
    "authority": { "score": 4, "notes": "Directeur commercial, décideur" },
    "need": { "score": 5, "notes": "Insatisfait du prestataire actuel" },
    "timeline": { "score": 3, "notes": "Pas avant septembre" }
  },
  "bant_total": 15,
  "objections": [
    { "type": "timing", "response_used": "ancrage_calendrier", "outcome": "accepted" }
  ],
  "questions_prospect": [
    "Combien de SDR par client ?",
    "Quel est le taux de no-show moyen ?"
  ],
  "next_steps": "RDV prévu le 15/04 à 10h avec le DG",
  "follow_up_required": true,
  "summary": "Échange positif avec M. Dupont, Directeur Commercial chez TechCorp. Intéressé par notre offre mais timing Q3. RDV posé le 15/04 pour présentation au DG."
}
```

### Scoring BANT automatique

| Critère | 1 (Faible) | 3 (Moyen) | 5 (Fort) |
|---------|-----------|-----------|----------|
| **Budget** | "Pas de budget" | "Budget à valider" | "Budget disponible" |
| **Authority** | Opérationnel | Manager | Directeur/C-level |
| **Need** | Satisfait actuel | Curieux | Pain point exprimé |
| **Timeline** | "Pas avant 6 mois" | "Dans le trimestre" | "Urgent, ce mois" |

Score total /20 : <8 = froid, 8-14 = tiède, >14 = chaud

## Feedback coaching instantané

Prompt Claude pour le mini-debrief post-appel :

```
Système : Tu es un coach SDR bienveillant mais exigeant. Tu donnes un feedback constructif après chaque appel.

Input : transcription complète de l'appel + score BANT + objections détectées

Output (JSON) :
{
  "score_global": 18,
  "score_detail": { "opening": 4, "discovery": 3, "value_prop": 4, "objection_handling": 3, "close": 4 },
  "point_fort": "Excellent hook personnalisé. Tu as mentionné leur levée de fonds récente, ça a immédiatement capté l'attention.",
  "point_amelioration": "Quand il a dit 'on a déjà un prestataire', tu as directement parlé de prix. Essaie plutôt la technique du benchmark : 'Justement, nos clients qui avaient déjà un presta...'",
  "module_recommande": { "slug": "objection-handling-advanced", "raison": "3ème appel cette semaine où l'objection concurrent n'est pas bien gérée" }
}
```

## Métriques du skill

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Latence détection objection | < 3 secondes | Temps entre fin de phrase prospect et affichage suggestion |
| Taux d'utilisation suggestions | > 40% | Clics sur suggestions / objections détectées |
| Δ conversion SDR assistés | > +15% | Taux conversion assisté vs non assisté |
| Emails récap envoyés | > 95% des appels | Emails générés et envoyés / total appels |
| Précision BANT | > 85% | Score BANT auto vs score manuel du SDR |

## Configuration requise

```yaml
secrets:
  - DEEPGRAM_API_KEY       # Transcription temps réel
  - OPENAI_API_KEY         # Whisper fallback + Claude analysis
  - ANTHROPIC_API_KEY      # Claude pour analyse et génération
  - GOOGLE_CALENDAR_CREDS  # Création d'événements calendrier
  - SENDGRID_API_KEY       # Envoi d'emails récap
  - RINGOVER_API_KEY       # Ou AIRCALL_API_KEY selon le provider
```
