---
name: Weekly Learner Progress Review
slug: weekly-learner-progress
assignee: trainer-agent
recurring: true
schedule:
  recurrence: weekly
  dayOfWeek: monday
  time: "09:00"
  timezone: Europe/Paris
---

# Weekly Learner Progress Review

## Objectif

Chaque lundi a 9h00 (Europe/Paris), le Trainer Agent realise une revue complete de la progression de tous les apprenants actifs sur la plateforme e-learning.

## Etapes

1. **Extraction des donnees de progression** : recuperer les metriques de progression de tous les apprenants actifs — modules completes, scores obtenus, temps passe, derniere connexion, simulations realisees.

2. **Identification des apprenants en retard** : flagger les apprenants qui :
   - N'ont pas progresse depuis plus de 7 jours
   - Ont un taux de completion inferieur a l'objectif pour leur cohorte
   - Ont echoue a une evaluation plus de 2 fois
   - N'ont pas realise de simulation d'appel depuis plus de 14 jours

3. **Analyse des tendances** : identifier les tendances globales de la semaine :
   - Modules les plus et les moins completes
   - Scores moyens par module (evolution vs semaine precedente)
   - Taux d'utilisation de l'AI Tutor Bot
   - Nombre de certifications delivrees

4. **Actions de remise a niveau** : pour chaque apprenant en difficulte, definir une action appropriee :
   - Relance par notification (inactivite simple)
   - Recommandation de modules complementaires (scores faibles)
   - Simulation d'appel guidee avec l'AI Tutor Bot (blocage sur les mises en situation)
   - Escalade au Content Manager (si le contenu du module est en cause)

5. **Rapport hebdomadaire** : compiler les resultats dans un rapport transmis au CEO comprenant :
   - Nombre total d'apprenants actifs
   - Taux de completion moyen
   - Nombre d'apprenants flagges en difficulte
   - Nombre de certifications delivrees cette semaine
   - Top 3 des modules les plus efficaces
   - Top 3 des modules posant le plus de difficultes

## Livrables

- Rapport hebdomadaire de progression → CEO
- Liste des apprenants flagges avec actions recommandees
- Notifications de relance envoyees aux apprenants en retard
- Mise a jour du dashboard de progression
