---
name: Daily Feedback Triage
description: Triage quotidien des retours utilisateurs arrives pendant la nuit
slug: daily-feedback-triage
assignee: support-agent
schedule:
  timezone: Europe/Paris
  recurrence:
    frequency: daily
    interval: 1
    time:
      hour: 9
      minute: 0
---

# Daily Feedback Triage

Chaque matin a 9h00 (Europe/Paris), le Support Agent trie les retours utilisateurs arrives pendant la nuit.

## Procedure

1. **Collecter** : recuperer tous les retours non traites depuis le dernier triage (widget in-app, emails, conversations chatbot escaladees).
2. **Categoriser** : classer chaque retour en bug, feature request, ou question.
3. **Scorer l'urgence** : evaluer l'urgence — critique (bloquant, perte de donnees, securite), majeur (fonctionnalite degradee), mineur (confort, esthetique).
4. **Repondre** : envoyer un accuse de reception a chaque utilisateur. Pour les questions simples, fournir une reponse directe.
5. **Escalader** : assigner les bugs au Bug Fixer avec un ticket structure. Assigner les feature requests au PM. Remonter les questions recurrentes au CS Bot Manager.
6. **Documenter** : mettre a jour le log de retours pour le rapport hebdomadaire du PM.

## Criteres de completion

- Tous les retours de la nuit sont categorises et assignes.
- Chaque utilisateur a recu une reponse ou un accuse de reception.
- Les bugs critiques sont escalades immediatement (meme avant la fin du triage).
- Le log de retours est a jour.
