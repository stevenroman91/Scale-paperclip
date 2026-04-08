---
name: call-simulation
description: Cold call simulation — AI plays prospect with configurable objection profiles, scores SDR response quality, provides real-time feedback
slug: call-simulation
---

# Call Simulation

Skill de simulation d'appels de prospection a froid pour l'entrainement des SDR.

## Capacites

- **Simulation de prospect IA** : le bot joue le role d'un prospect B2B avec un comportement realiste base sur les donnees reelles d'appels de ScaleFast et ScaleCall. Le prospect repond de maniere naturelle, pose des questions, emet des objections et reagit aux arguments du SDR.
- **Profils d'objections configurables** : chaque simulation utilise un profil d'objections selectionne ou aleatoire. Les profils sont construits a partir des patterns d'objections les plus frequents identifies dans les appels de production.
- **Niveaux de difficulte** : le comportement du prospect s'adapte au niveau de l'apprenant — debutant (objections simples, prospect cooperatif), intermediaire (objections multiples, prospect neutre), avance (objections complexes, prospect hostile ou evasif).
- **Scoring multicritere** : chaque simulation est evaluee selon une grille multicritere :
  - Ouverture (accroche, presentation, permission de continuer)
  - Decouverte (questions ouvertes, ecoute active, reformulation)
  - Argumentation (pertinence, personnalisation, preuves sociales)
  - Traitement des objections (ecoute, empathie, reponse structuree)
  - Closing (proposition de next step, engagement, timing)
- **Feedback en temps reel** : pendant la simulation, le systeme peut fournir des indices ou des alertes discrets pour guider l'apprenant (optionnel, desactivable pour les evaluations formelles).
- **Rapport post-simulation** : a la fin de chaque simulation, un rapport detaille est genere avec le score global, les scores par critere, les moments cles de l'appel, les points forts et les axes d'amelioration.

## Configuration

| Parametre | Description | Valeurs |
|-----------|-------------|---------|
| objection_profile | Profil d'objections du prospect | presse, sceptique, satisfait, decideur_fantome, chasseur_prix, technique, mix |
| difficulty | Niveau de difficulte | debutant, intermediaire, avance |
| duration_target | Duree cible de l'appel | 2min, 5min, 10min |
| realtime_feedback | Feedback en temps reel | on, off |
| industry | Secteur d'activite du prospect simule | saas, finance, rh, marketing, industrie |
