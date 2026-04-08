---
name: volume-quota-tracking
description: >
  Track contractual call quotas per client. Monitor daily, weekly, and monthly
  call volumes against contractual minimums (e.g. 200 calls/day for Codialis).
  Generate alerts when volumes fall below target thresholds.
---

# Volume Quota Tracking

Suivi des quotas contractuels d'appels par client.

## Fonctionnalites

- **Suivi quotidien** : compter le nombre d'appels realises par client et par jour, comparer au quota contractuel
- **Suivi hebdomadaire et mensuel** : agreger les volumes sur la semaine et le mois, calculer les ecarts cumules
- **Alertes sous-quota** : declencher une alerte si le volume d'appels d'un client passe sous 80% du quota a mi-journee, ou sous 100% en fin de journee
- **Tableau de bord** : fournir un tableau synthetique par client avec quota contractuel, volume realise, pourcentage d'atteinte, tendance
- **Historique** : conserver l'historique des volumes pour analyse de tendance et reporting mensuel

## Metriques cles

| Metrique | Description | Frequence |
|----------|-------------|-----------|
| Appels/jour/client | Nombre d'appels realises par jour pour chaque client | Temps reel |
| % atteinte quota | Volume realise / quota contractuel | Temps reel |
| Appels/semaine/client | Volume hebdomadaire agrege | Hebdomadaire |
| Appels/mois/client | Volume mensuel agrege | Mensuel |
| Jours sous-quota | Nombre de jours ou le quota n'a pas ete atteint | Mensuel |

## Seuils d'alerte

- **Alerte orange** : volume a mi-journee < 40% du quota journalier (projection < 80%)
- **Alerte rouge** : volume en fin de journee < 100% du quota journalier
- **Alerte critique** : 2 jours consecutifs sous quota → escalade au CEO
