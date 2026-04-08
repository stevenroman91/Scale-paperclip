---
name: Daily Anti No-Show Reminders
slug: daily-anti-noshow
assignee: anti-noshow-agent
recurring: true
schedule:
  recurrence: daily
  time: "09:00"
  timezone: Europe/Paris
tags:
  - daily
  - anti-noshow
  - reminders
---

# Daily Anti No-Show Reminders

Chaque jour a 9h00 (Europe/Paris), identifier et envoyer les rappels pour tous les rendez-vous prevus a J+2 jours ouvres.

## Process

1. Calculer la date cible : aujourd'hui + 2 jours ouvres (exclure samedis, dimanches, et jours feries francais)
2. Recuperer tous les RDV prevus a la date cible
3. Pour chaque RDV, envoyer un rappel Discord dans le channel anti no-show
4. Mettre a jour la colonne Relance a "⏳ En attente" pour chaque RDV relance
5. Verifier les RDV relances la veille : si pas de confirmation recu, envoyer une deuxieme relance et alerter le SDR

## Verification jour ferie

Avant d'envoyer les rappels :
- Verifier que aujourd'hui n'est PAS un jour ferie (si oui, ne rien envoyer — les rappels auraient du etre anticipes au jour ouvre precedent)
- Verifier que la date cible (J+2 ouvres) n'est PAS un jour ferie (si oui, alerter le SDR car le RDV est un jour ferie)

## Format du rappel

```
📅 Rappel RDV — J-2
Client : [Nom client agence]
Prospect : [Prenom Nom] — [Poste] @ [Entreprise]
Date : [JJ/MM/AAAA] a [HH:MM]
SDR : [Prenom SDR]
Statut relance : ⏳ En attente

👉 Merci de confirmer la presence du prospect.
```

## Suivi des confirmations

| Statut | Signification | Action |
|--------|---------------|--------|
| ⏳ | Relance envoyee, en attente | Surveiller la confirmation |
| ✅ | Confirme par le prospect | Rien a faire |
| (vide) | Pas encore relance | Anomalie — envoyer le rappel immediatement |

## Metriques

- Nombre de rappels envoyes par jour
- Taux de confirmation apres rappel
- Taux de no-show sur les RDV relances vs non relances (pour mesurer l'efficacite du systeme)
