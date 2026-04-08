---
name: capacity-planning
description: >
  SDR capacity projection and staffing management. Track current load per SDR,
  forecast client demand, generate staffing recommendations, and manage peak
  periods to ensure contractual call quotas are met.
---

# Capacity Planning

Planification de la capacite SDR et gestion du staffing.

## Fonctionnalites

- **Charge par SDR** : calculer la charge courante de chaque SDR — nombre d'appels/jour reel vs capacite theorique (40-60 appels/jour selon le profil)
- **Allocation par client** : determiner combien de SDR sont affectes a chaque client et si le nombre est suffisant pour atteindre le quota contractuel
- **Prevision de la demande** : projeter les besoins en SDR a 1, 2 et 3 mois en fonction du pipeline commercial (nouveaux contrats en signature) et des tendances saisonnieres
- **Recommandations de staffing** : generer des recommandations concretes — recrutement, reallocation, recours a des freelances, heures supplementaires
- **Gestion des pics** : identifier les periodes de forte demande (lancement de campagne, fin de trimestre) et proposer des plans de couverture

## Modele de calcul

```
SDR requis par client = quota_appels_jour / capacite_moyenne_SDR
Capacite disponible = nombre_SDR_actifs * capacite_moyenne_SDR
Taux d'utilisation = appels_realises / capacite_disponible
Marge de capacite = capacite_disponible - somme(quotas_clients)
```

## Parametres

| Parametre | Valeur par defaut | Description |
|-----------|-------------------|-------------|
| Capacite moyenne SDR | 50 appels/jour | Nombre moyen d'appels qu'un SDR peut realiser par jour |
| Seuil de surcharge | 90% | Au-dela de ce taux d'utilisation, le SDR est considere en surcharge |
| Seuil de sous-utilisation | 60% | En dessous de ce taux, le SDR est sous-utilise |
| Buffer de securite | 10% | Marge de capacite supplementaire recommandee pour absorber les imprevisibles |

## Sorties

- Tableau de charge par SDR (quotidien)
- Projection de staffing a M+1, M+2, M+3
- Alertes de sous-capacite ou surcharge
- Scenarios d'impact pour nouveaux contrats
