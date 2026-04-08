---
name: discord-notifications
description: Discord webhook integration — anti no-show reminders, performance alerts, confirmation tracking
slug: discord-notifications
schema: agentcompanies/v1
tags:
  - discord
  - notifications
  - webhooks
---

# Discord Notifications

Skill d'integration Discord par webhook pour les notifications operationnelles de ScaleFast.

## Types de notifications

### Rappels anti no-show

Envoi automatique a 9h00 chaque jour ouvre pour les RDV a J+2 ouvres.

```
📅 Rappel RDV — J-2
Client : [Nom client agence]
Prospect : [Prenom Nom] — [Poste] @ [Entreprise]
Date : [JJ/MM/AAAA] a [HH:MM]
SDR : [Prenom SDR]
Statut relance : ⏳ En attente

👉 Merci de confirmer la presence du prospect.
```

### Alertes de performance

Envoi immediat quand un seuil est franchi.

```
⚠️ Alerte Performance
SDR : [Prenom SDR]
Metrique : [Nom de la metrique]
Valeur actuelle : [valeur]
Seuil : [seuil]
Duree : [depuis X jours]

📊 Action recommandee : [action]
```

### Confirmations de relance

Mise a jour du statut apres confirmation du prospect.

```
✅ Confirmation RDV
Prospect : [Prenom Nom] @ [Entreprise]
Date : [JJ/MM/AAAA] a [HH:MM]
Statut : Confirme
```

### Rapport hebdomadaire

Envoye dans le channel dedie de chaque client le vendredi a 17h.

## Configuration webhook

- Un webhook par channel client (isolation des donnees)
- Un webhook pour le channel interne des alertes de performance
- Un webhook pour le channel interne des rappels anti no-show
- Rate limiting : maximum 30 messages par minute par webhook (limite Discord)

## Regles

- Les notifications doivent etre envoyees dans le bon channel (pas de donnees client dans un channel interne et inversement)
- Les emojis sont utilises pour la lisibilite rapide (📅 = rappel, ⚠️ = alerte, ✅ = confirmation)
- En cas d'echec d'envoi webhook, retry 3 fois avec backoff exponentiel (1s, 5s, 30s), puis alerte dans les logs
