---
name: onboarding-workflow
description: Employee onboarding flow — "Who we are" mission & culture presentation, step-by-step values, certification checkbox, notification email
slug: onboarding-workflow
---

# Onboarding Workflow

Skill de gestion du parcours d'onboarding de ScaleAcademy. Le flow "Who we are" est le point d'entree obligatoire pour tout nouvel employe avant d'acceder aux modules e-learning.

## "Who we are" Flow

### ScaleFast Mission — 4 Sections

Chaque section est presentee sur un ecran individuel avec un bouton "Suivant" pour avancer. L'employe ne peut pas sauter de section.

#### Section 1: "Our Mission"

**Contenu:** Ce que ScaleFast fait et pourquoi.

> ScaleFast est le partenaire de croissance des entreprises B2B. Nous externalisons et optimisons la prospection commerciale pour permettre a nos clients de se concentrer sur ce qu'ils font de mieux : closer des deals et servir leurs clients. Notre mission est de rendre la prospection B2B previsible, scalable et data-driven.

**Ecran:** Titre + texte + illustration + bouton "Suivant"

#### Section 2: "Our Approach"

**Contenu:** Comment ScaleFast delivre des resultats (methodologie).

> Notre approche repose sur trois piliers : (1) Des SDR formes par ScaleAcademy avec les meilleures pratiques du marche, (2) Une methodologie data-driven ou chaque appel, chaque email est mesure et optimise, (3) Une boucle de feedback continu entre les performances terrain et la formation. Chaque campagne est un laboratoire d'apprentissage.

**Ecran:** Titre + texte + schema methodologique + bouton "Suivant"

#### Section 3: "Our Technology"

**Contenu:** Les outils et la stack technique.

> Notre stack : CRM (HubSpot/Salesforce), telephonie (Aircall/Ringover), enrichissement (Kaspr/Lusha/Apollo), sequencing (Lemlist/La Growth Machine), analytics (dashboards internes). L'IA est au coeur de notre approche : analyse d'appels automatisee, scoring de leads, simulation d'entrainement.

**Ecran:** Titre + texte + logos des outils + bouton "Suivant"

#### Section 4: "Our Ambition"

**Contenu:** Ou nous allons (vision).

> Notre ambition : devenir la reference europeenne de la prospection B2B externalisee. D'ici 2027, nous visons 500 SDR formes, 200 clients actifs et une expansion dans 5 pays. ScaleAcademy deviendra la premiere plateforme de certification SDR en Europe.

**Ecran:** Titre + texte + timeline visuelle + bouton "Suivant"

### 11 Culture Values

Presentees une par une, chaque valeur sur son propre ecran avec un bouton "Suivant". L'employe doit parcourir les 11 valeurs dans l'ordre.

| # | Valeur | Description | Exemple concret |
|---|--------|-------------|-----------------|
| 1 | **Ownership** | Tu es responsable de tes resultats. Pas d'excuses, que des solutions. | Un SDR remarque que son taux de reponse baisse. Il analyse ses emails, teste 3 nouvelles accroches et remonte ses resultats de 15% en une semaine. |
| 2 | **Transparency** | On partage tout : les victoires, les echecs, les chiffres. | Chaque lundi, l'equipe partage ses KPIs en toute transparence, y compris les semaines difficiles. |
| 3 | **Speed** | Mieux vaut 80% aujourd'hui que 100% la semaine prochaine. | Un nouveau script est teste dans l'heure qui suit son ecriture, pas apres 3 jours de validation. |
| 4 | **Client obsession** | Le client est au centre de chaque decision. | Un SDR re-qualifie un lead qui ne matche pas le ICP plutot que de forcer un RDV qui ferait perdre du temps au client. |
| 5 | **Data-driven** | Les opinions sont interessantes, les donnees sont decisives. | On ne change pas un pitch parce que "ca sonne mieux" mais parce que les donnees montrent un meilleur taux de conversion. |
| 6 | **Continuous learning** | Chaque jour est une occasion d'apprendre. | Chaque SDR ecoute au moins 2 appels de collegues par semaine pour s'inspirer. |
| 7 | **Team first** | Le succes individuel n'existe pas sans succes collectif. | Un SDR senior prend 30 minutes pour debriefer un junior apres une serie d'appels difficiles. |
| 8 | **Resilience** | Le rejet fait partie du job. On se releve et on rappelle. | Apres 20 refus consecutifs, un SDR ajuste son approche et decroche 3 RDV dans l'heure suivante. |
| 9 | **Innovation** | On remet en question le statu quo. | Un SDR propose d'utiliser des messages vocaux LinkedIn au lieu d'emails — le test montre +25% de taux de reponse. |
| 10 | **Excellence** | On vise le meilleur dans tout ce qu'on fait. | Chaque email, chaque appel, chaque message est redige comme si c'etait le plus important. |
| 11 | **Fun** | On travaille dur, mais on s'amuse. | Challenges hebdomadaires, celebrations des victoires, ambiance positive meme dans les periodes intenses. |

**Format d'ecran par valeur:**
```
+-------------------------------------------+
|  [Icone de la valeur]                     |
|                                           |
|  # {Valeur}                               |
|                                           |
|  {Description}                            |
|                                           |
|  Exemple concret :                        |
|  "{Exemple}"                              |
|                                           |
|              [Suivant ->]                  |
+-------------------------------------------+
```

## Certification Step

Apres avoir parcouru les 4 sections mission et les 11 valeurs :

1. **Ecran de certification:** Affiche un resume du parcours complete.
2. **Checkbox obligatoire:**
   > ☐ Je certifie avoir lu et m'aligner pleinement avec la mission et la culture de ScaleFast.
3. **Bouton "Valider"** (grise tant que la checkbox n'est pas cochee).
4. **A la soumission:**
   - Enregistrer la certification en base :
     ```json
     {
       "employee_id": "user_<uuid>",
       "certification_type": "who_we_are",
       "completed_at": "2026-04-08T14:30:00Z",
       "checkbox_confirmed": true
     }
     ```
   - Envoyer un email a Alex et Steven avec l'employe en CC :
     ```
     To: alex@scalefast.fr, steven@scalefast.fr
     CC: {employee_email}
     Subject: Onboarding certifie — {employee_name}
     Body:
       {employee_name} a complete la certification onboarding le {date}.
       L'ensemble du parcours "Who we are" (mission + 11 valeurs) a ete valide.
     ```

## Gate: E-learning Access Control

Les modules e-learning sont **BLOQUES** tant que le parcours "Who we are" n'est pas complete.

```
Nouvel employe arrive
       |
       v
  "Who we are" complete?
     /          \
   Non           Oui
    |              |
    v              v
Afficher:       Debloquer tous
"Completez      les modules
d'abord le      e-learning et
parcours        le reste du
Who we are"     checklist
```

**Implementation:**
- Avant d'afficher le catalogue e-learning, verifier `onboarding_status.who_we_are_completed === true`.
- Si non complete, rediriger vers le flow "Who we are" avec un message explicatif.

## Onboarding Checklist

Au-dela du parcours culture, l'onboarding complet comprend 7 etapes. Chaque etape a un statut trackable par employe.

```json
{
  "employee_id": "user_<uuid>",
  "checklist": [
    {
      "step": 1,
      "name": "who_we_are",
      "label": "Who we are (certification culture)",
      "status": "completed",
      "completed_at": "2026-04-01T10:00:00Z",
      "gate": true
    },
    {
      "step": 2,
      "name": "tool_setup",
      "label": "Tool setup (CRM, telephonie, Slack/Discord)",
      "status": "in_progress",
      "completed_at": null,
      "details": {
        "crm_access": true,
        "telephony_access": false,
        "slack_joined": true,
        "discord_joined": false
      }
    },
    {
      "step": 3,
      "name": "wiki_reading",
      "label": "Wiki reading (20 articles minimum)",
      "status": "not_started",
      "completed_at": null,
      "details": { "articles_read": 0, "articles_required": 20 }
    },
    {
      "step": 4,
      "name": "first_learning_path",
      "label": "First learning path completion",
      "status": "not_started",
      "completed_at": null,
      "details": { "path_id": null, "progress_percent": 0 }
    },
    {
      "step": 5,
      "name": "shadow_calls",
      "label": "Shadow calls (10 senior SDR calls)",
      "status": "not_started",
      "completed_at": null,
      "details": { "calls_listened": 0, "calls_required": 10 }
    },
    {
      "step": 6,
      "name": "practice_calls",
      "label": "Practice calls (5 simulated calls with AI Tutor)",
      "status": "not_started",
      "completed_at": null,
      "details": { "simulations_completed": 0, "simulations_required": 5 }
    },
    {
      "step": 7,
      "name": "first_solo_call",
      "label": "First solo call validation (manager approval)",
      "status": "not_started",
      "completed_at": null,
      "details": { "manager_approved": false, "manager_id": null }
    }
  ]
}
```

### Step Completion Rules

| Step | Completion Condition | Auto/Manual |
|------|---------------------|-------------|
| 1. Who we are | Checkbox certified + email sent | Auto |
| 2. Tool setup | All 4 access flags = true | Manual (admin confirms) |
| 3. Wiki reading | articles_read >= 20 | Auto (tracked per article) |
| 4. First learning path | Learning path status = "completed" | Auto (from elearning-management) |
| 5. Shadow calls | calls_listened >= 10 | Manual (SDR logs each call) |
| 6. Practice calls | simulations_completed >= 5 | Auto (from call-simulation) |
| 7. First solo call | manager_approved = true | Manual (manager validates) |

### Manager Dashboard

Managers can see a real-time overview of all onboarding employees:

```
+--------------------------------------------------------------+
| Employee      | Step 1 | Step 2 | Step 3 | ... | Step 7     |
+--------------------------------------------------------------+
| Marie Dupont  |   ✅   |   ✅   |  12/20 | ... |   ⬜       |
| Lucas Martin  |   ✅   |   🔄   |   ⬜   | ... |   ⬜       |
| Sarah Petit   |   🔄   |   ⬜   |   ⬜   | ... |   ⬜       |
+--------------------------------------------------------------+
```

Statuses: ✅ = completed, 🔄 = in progress, ⬜ = not started

## Evaluation Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Flow completeness | 25% | All 4 mission sections and 11 values are presented in correct order |
| Gate enforcement | 25% | E-learning is truly blocked until Who we are is completed |
| Certification accuracy | 20% | Checkbox required, email sent correctly to Alex, Steven, and employee CC |
| Checklist tracking | 20% | All 7 steps tracked per employee, statuses updated correctly |
| Manager visibility | 10% | Dashboard shows accurate real-time status for all onboarding employees |

### Rubric

- **Excellent (90-100%):** Full flow works end-to-end. Gate strictly enforced. Email sent with correct template and recipients. All 7 checklist steps tracked. Manager dashboard accurate in real-time.
- **Good (70-89%):** Flow works but minor ordering issues. Gate works. Email sent but minor template issues. Most checklist steps tracked.
- **Needs Improvement (50-69%):** Flow incomplete (some values missing). Gate bypassed in edge cases. Email not sent or wrong recipients. Checklist partially tracked.
- **Failing (<50%):** Flow broken or out of order. No gate enforcement. No email. Checklist not implemented.
