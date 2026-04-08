---
name: user-feedback-pipeline
description: Collecte des retours utilisateurs (widget in-app, email, support), auto-categorisation (bug/feature/question), scoring d'urgence, routage vers l'equipe appropriee
slug: user-feedback-pipeline
---

# User Feedback Pipeline

Skill de collecte et de triage automatise des retours utilisateurs pour ScaleHQ.

## Capacites

- **Collecte multi-canal** : agregation des retours depuis le widget in-app, les emails de support, les conversations chatbot escaladees, et les messages directs.
- **Auto-categorisation** : classification automatique de chaque retour en trois categories — bug (dysfonctionnement), feature request (demande d'amelioration ou de nouvelle fonctionnalite), question (demande d'aide ou d'information).
- **Scoring d'urgence** : evaluation automatique de l'urgence sur trois niveaux — critique (bloquant, perte de donnees, securite), majeur (fonctionnalite degradee mais contournable), mineur (esthetique, confort).
- **Routage automatique** : envoi du retour vers la bonne equipe — bugs vers le Bug Fixer, feature requests vers le PM, questions vers le CS Bot ou le Support Agent selon la complexite.
- **Deduplication** : detection des retours en doublon (meme utilisateur, meme probleme) et regroupement des retours similaires provenant d'utilisateurs differents.
- **Reporting** : generation de metriques agreges — volume par categorie, distribution d'urgence, temps de traitement moyen, top des problemes recurrents.
