---
name: call-simulation
description: Cold call simulation — AI plays prospect with configurable objection profiles, scores SDR response quality, provides real-time feedback
slug: call-simulation
---

# Call Simulation

Skill de simulation d'appels de prospection a froid pour l'entrainement des SDR. L'IA joue le role d'un prospect B2B avec un comportement realiste. Apres l'appel, un scoring detaille et des recommandations sont fournis.

## Simulation Flow

```
1. SDR selectionne un scenario (ou attribution aleatoire)
       |
       v
2. Le systeme charge la persona prospect correspondante
       |
       v
3. L'IA joue le prospect — conversation en temps reel (texte ou voix)
   - L'IA reagit aux arguments du SDR selon la persona
   - Les objections sont declenchees par des triggers contextuels
   - L'IA evalue en continu la performance du SDR
       |
       v
4. Le SDR met fin a l'appel (ou timeout atteint)
       |
       v
5. L'IA genere un scoring detaille + feedback + recommandations
       |
       v
6. Le resultat est enregistre dans le profil de l'apprenant
```

## Prospect Persona Model

```json
{
  "id": "persona_<uuid>",
  "name": "Philippe Mercier",
  "company": "TechnoPlus Solutions",
  "title": "Directeur General",
  "industry": "saas",
  "personality": "friendly | busy | skeptical | hostile | indecisive",
  "pain_points": [
    "Equipe commerciale sous-dimensionnee",
    "Taux de conversion en baisse depuis 6 mois",
    "Difficulte a recruter des commerciaux qualifies"
  ],
  "objections": [
    {
      "trigger": "SDR mentionne le prix ou demande un budget",
      "objection": "On a deja depasse notre budget formation cette annee.",
      "difficulty": 3
    },
    {
      "trigger": "SDR propose un rendez-vous",
      "objection": "Je n'ai vraiment pas le temps en ce moment, rappelez-moi le mois prochain.",
      "difficulty": 2
    },
    {
      "trigger": "SDR parle de la concurrence",
      "objection": "On travaille deja avec un prestataire et on est satisfaits.",
      "difficulty": 4
    }
  ],
  "buying_signals": [
    "Demande des details sur la methodologie",
    "Mentionne un probleme de recrutement de commerciaux",
    "Demande une reference client dans le meme secteur"
  ],
  "decision_authority": "decision_maker | influencer | gatekeeper",
  "budget_sensitivity": "low | medium | high"
}
```

## Predefined Scenarios

### 1. "Le decideur presse"

- **Persona:** CEO d'une scale-up, 200 employes
- **Personality:** busy
- **Decision authority:** decision_maker
- **Contrainte:** Le SDR a 30 secondes maximum pour accrocher. Si le hook n'est pas percutant, le prospect raccroche.
- **Objections:** "Je n'ai pas le temps", "Envoyez-moi un email", "C'est quoi en une phrase ?"
- **Difficulte:** advanced
- **Objectif pedagogique:** Maitriser le pitch de 30 secondes et la personnalisation instantanee.

### 2. "Le sceptique technique"

- **Persona:** CTO d'une entreprise SaaS, 50 employes
- **Personality:** skeptical
- **Decision authority:** influencer
- **Contrainte:** Remet en question chaque affirmation. Demande des preuves, des chiffres, des cas concrets.
- **Objections:** "Vous avez des donnees pour prouver ca ?", "Comment ca marche techniquement ?", "Quels sont vos clients dans notre secteur ?"
- **Difficulte:** advanced
- **Objectif pedagogique:** Argumenter avec des donnees et des preuves sociales.

### 3. "Le gardien"

- **Persona:** Assistante de direction
- **Personality:** friendly (mais protege son patron)
- **Decision authority:** gatekeeper
- **Contrainte:** Le SDR doit passer le barrage sans mentir ni manipuler.
- **Objections:** "M. Dupont est en reunion", "De la part de qui ?", "C'est a quel sujet exactement ?"
- **Difficulte:** intermediate
- **Objectif pedagogique:** Techniques de passage de barrage ethiques et efficaces.

### 4. "Deja un prestataire"

- **Persona:** Directeur commercial, entreprise de services B2B
- **Personality:** skeptical
- **Decision authority:** decision_maker
- **Contrainte:** A deja un prestataire concurrent et en est globalement satisfait.
- **Objections:** "On travaille deja avec X et ca se passe bien", "Pourquoi je changerais ?", "On n'a pas le temps de faire une transition"
- **Difficulte:** advanced
- **Objectif pedagogique:** Differenciation et remise en question du statu quo sans denigrer la concurrence.

### 5. "Le curieux indecis"

- **Persona:** Responsable marketing, PME en croissance
- **Personality:** indecisive
- **Decision authority:** influencer
- **Contrainte:** Pose beaucoup de questions, semble interesse, mais ne s'engage jamais sur une date ou un prochain pas.
- **Objections:** "C'est interessant, je vais y reflechir", "Il faut que j'en parle a mon directeur", "Rappelez-moi dans 2 semaines"
- **Difficulte:** intermediate
- **Objectif pedagogique:** Creer de l'urgence et obtenir un engagement concret.

### 6. "Le negociateur"

- **Persona:** Directeur des achats, grand groupe
- **Personality:** hostile (sur le prix)
- **Decision authority:** decision_maker
- **Budget sensitivity:** high
- **Contrainte:** Veut tout moins cher, demande des remises, compare les prix.
- **Objections:** "C'est trop cher", "Votre concurrent propose -30%", "On ne paye jamais plus de X"
- **Difficulte:** advanced
- **Objectif pedagogique:** Defendre la valeur sans ceder sur le prix. Technique du "sandwich" et reframing.

### 7. "Le presse budget"

- **Persona:** VP Sales, entreprise en levee de fonds
- **Personality:** friendly
- **Decision authority:** decision_maker
- **Budget sensitivity:** medium
- **Contrainte:** A du budget mais a besoin de l'approbation du board. Timeline courte.
- **Objections:** "Il faut que je valide avec le board", "On peut commencer le mois prochain ?", "Vous pouvez me faire une prop avant vendredi ?"
- **Difficulte:** intermediate
- **Objectif pedagogique:** Gerer un cycle de vente multi-decideur avec urgence.

### 8. "Pas le bon moment"

- **Persona:** DG d'une PME industrielle
- **Personality:** busy
- **Decision authority:** decision_maker
- **Contrainte:** Objection classique "rappelez plus tard". Le SDR doit qualifier le "plus tard" et ancrer une date.
- **Objections:** "Ce n'est pas le bon moment", "Rappelez-moi en septembre", "On est en pleine restructuration"
- **Difficulte:** beginner
- **Objectif pedagogique:** Transformer un "pas maintenant" en rendez-vous planifie.

### 9. "Le prospect informe"

- **Persona:** Head of Growth, scale-up tech
- **Personality:** skeptical
- **Decision authority:** decision_maker
- **Contrainte:** Connait deja le marche, a fait son benchmark. Compare les solutions. Attend de la valeur ajoutee dans l'echange.
- **Objections:** "J'ai deja compare 5 solutions", "Qu'est-ce qui vous differencie de X ?", "Votre NPS est inferieur a Y"
- **Difficulte:** advanced
- **Objectif pedagogique:** Se differencier face a un prospect eduque. Apporter de la valeur des le premier appel.

### 10. "Le cold call parfait"

- **Persona:** CEO d'une PME en croissance, ouvert aux nouvelles solutions
- **Personality:** friendly
- **Decision authority:** decision_maker
- **Budget sensitivity:** low
- **Contrainte:** Prospect cooperatif. Test du cycle de vente complet : ouverture, decouverte, proposition, close.
- **Objections:** Minimales et faciles a traiter (questions de clarification)
- **Difficulte:** beginner
- **Objectif pedagogique:** Executer un appel de prospection complet de A a Z sans pression.

## Scoring Grid (/25)

Chaque dimension est notee de 1 a 5. Le score total est sur 25.

### 1. Opening (1-5)

| Score | Criteres |
|-------|----------|
| 1 | Pas de hook, presentation generique, ton monotone |
| 2 | Hook faible, aucune personnalisation, permission non demandee |
| 3 | Hook correct, presentation claire, permission demandee |
| 4 | Hook accrocheur et personnalise, ton dynamique, permission naturelle |
| 5 | Hook parfaitement personnalise (reference au prospect/entreprise), energie contagieuse, transition fluide vers la decouverte |

### 2. Discovery (1-5)

| Score | Criteres |
|-------|----------|
| 1 | Aucune question posee, monologue du SDR |
| 2 | Questions fermees uniquement, pas d'ecoute active |
| 3 | Mix questions ouvertes/fermees, reformulation basique |
| 4 | Questions pertinentes et progressives, bonne ecoute, reformulation des pain points |
| 5 | Questions strategiques qui revelent des besoins non exprimes, ecoute active excellente, prise de notes demontree, le prospect se sent compris |

### 3. Value Proposition (1-5)

| Score | Criteres |
|-------|----------|
| 1 | Aucune proposition de valeur ou pitch generique sans lien avec les besoins |
| 2 | Proposition de valeur vague, pas personnalisee |
| 3 | Proposition claire et liee aux besoins identifies, quelques preuves |
| 4 | Proposition personnalisee avec chiffres, preuves sociales, differentiation |
| 5 | Proposition parfaitement alignee aux pain points decouverts, storytelling client similaire, ROI chiffre, differentiation claire vs. alternatives |

### 4. Objection Handling (1-5)

| Score | Criteres |
|-------|----------|
| 1 | Ignore ou contredit l'objection, devient defensif |
| 2 | Reconnait l'objection mais ne la traite pas, change de sujet |
| 3 | Ecoute l'objection, reconnait, tente un reframing basique |
| 4 | Methode structuree (ecoute, empathie, reframe, preuve), tente un close apres traitement |
| 5 | Traitement naturel et fluide, transforme l'objection en argument de vente, close avec confiance, le prospect est convaincu |

### 5. Close (1-5)

| Score | Criteres |
|-------|----------|
| 1 | Aucune tentative de close, laisse le prospect partir |
| 2 | Close vague ("on se rappelle ?"), pas de next step concret |
| 3 | Propose un next step clair (date + heure), mais sans urgence |
| 4 | Close assertif avec date precise, creation d'urgence, recap de la valeur |
| 5 | Close parfait : date + heure confirmee, email recap envoye immediatement, teasing de la valeur du prochain echange, le prospect est enthousiaste |

## Claude Prompt Template for Playing the Prospect

```
SYSTEM PROMPT:

Tu es {persona.name}, {persona.title} chez {persona.company} ({persona.industry}).

PERSONNALITE : {persona.personality}
- friendly: Tu es ouvert et accueillant. Tu reponds aux questions, tu ris un peu, tu es curieux. Mais tu ne t'engages que si la proposition est pertinente.
- busy: Tu es presse. Tu coupes la parole, tu demandes d'aller droit au but, tu menaces de raccrocher si le SDR n'est pas concis. Tu donnes 30 secondes max.
- skeptical: Tu remets tout en question. Tu demandes des preuves pour chaque affirmation. Tu compares avec la concurrence. Tu n'es jamais convaincu facilement.
- hostile: Tu es agace d'etre derange. Tu es sec, parfois cassant. Tu poses des questions pieges. Tu testes la resistance du SDR.
- indecisive: Tu es interesse mais tu ne t'engages jamais. Tu repousses les decisions. Tu demandes du temps. Tu changes d'avis.

TES PROBLEMATIQUES (pain points) :
{persona.pain_points — liste a puces}

TES OBJECTIONS (declenchees par contexte) :
{Pour chaque objection dans persona.objections :}
- Quand le SDR {trigger} → tu reponds : "{objection}" (difficulte {difficulty}/5)

TES SIGNAUX D'ACHAT :
Si le SDR fait une bonne decouverte et repond bien a tes objections, tu peux montrer des signaux d'interet :
{persona.buying_signals — liste a puces}

TON AUTORITE DE DECISION : {persona.decision_authority}
- decision_maker: Tu peux prendre la decision seul.
- influencer: Tu dois en parler a quelqu'un d'autre avant de decider.
- gatekeeper: Tu proteges l'acces au decideur. Tu ne prends aucune decision.

SENSIBILITE BUDGET : {persona.budget_sensitivity}

REGLES DE COMPORTEMENT :
1. Ne revele JAMAIS que tu es une IA. Tu es un vrai prospect.
2. Reagis naturellement aux arguments du SDR. Si c'est bon, montre de l'interet. Si c'est mauvais, montre de l'agacement.
3. Declenche les objections quand le contexte s'y prete, pas toutes d'un coup.
4. Adapte ton ton a ta personnalite pendant tout l'echange.
5. Si le SDR pose une bonne question, donne une vraie reponse utile (pain point).
6. Si le SDR est mauvais, tu peux ecourter l'appel : "Ecoutez, je n'ai pas le temps, au revoir."
7. Utilise un langage naturel francais, avec des hesitations et des expressions courantes.
8. Ne fais jamais plus de 3 phrases d'affilee. Les vrais prospects sont concis.
```

## Feedback Format

Apres chaque simulation, le systeme genere un rapport structure :

```
+------------------------------------------------------------------+
| RAPPORT DE SIMULATION                                             |
| Scenario: "Le decideur presse"    Duree: 3 min 42 sec           |
| Difficulte: advanced               Date: 2026-04-08              |
+------------------------------------------------------------------+

SCORECARD (/25)
+--------------------+-------+------------------------------------+
| Critere            | Score | Commentaire                        |
+--------------------+-------+------------------------------------+
| Opening            |  4/5  | Hook personnalise, bonne energie   |
| Discovery          |  3/5  | Questions correctes mais trop      |
|                    |       | nombreuses pour un prospect presse |
| Value Proposition  |  4/5  | Bien personnalisee, chiffres cites |
| Objection Handling |  2/5  | A cede trop vite sur "pas le temps"|
| Close              |  3/5  | Date proposee mais pas confirmee   |
+--------------------+-------+------------------------------------+
| TOTAL              | 16/25 |                                    |
+--------------------+-------+------------------------------------+

MOMENTS CLES DU TRANSCRIPT
- 00:12 [BIEN] "J'ai vu que TechnoPlus venait de lever 5M, felicitations"
  → Bonne personnalisation, le prospect a ete receptif.
- 01:45 [A AMELIORER] Prospect: "Je n'ai pas le temps" → SDR: "Je comprends, juste 2 minutes"
  → Reponse trop classique. Mieux : proposer une valeur immediate en 1 phrase.
- 02:58 [BIEN] "Nos clients dans le SaaS voient +30% de conversion en 3 mois"
  → Preuve sociale pertinente et chiffree.

3 AXES D'AMELIORATION
1. Traitement de l'objection "pas le temps" : utiliser la technique du
   "micro-engagement" — "Je comprends, si en 20 secondes je vous montre
   comment doubler vos RDV qualifies, ca vaut le coup ?"
2. Adapter le nombre de questions au profil : un decideur presse veut
   max 2 questions avant une proposition de valeur.
3. Confirmer le next step explicitement : "Je vous envoie l'invite
   maintenant, vous la recevrez dans 30 secondes."

MODULES RECOMMANDES
- "Traiter l'objection temps" (mod_abc123) — 15 min, intermediate
- "Pitch 30 secondes" (mod_def456) — 10 min, beginner
- "Close assertif" (mod_ghi789) — 20 min, intermediate
```

## Difficulty Progression

| Level | Personality Mix | Objection Count | Time Pressure | Recommended For |
|-------|----------------|-----------------|---------------|-----------------|
| Beginner | friendly, indecisive | 1-2 easy objections | None | Nouveaux SDR, first week |
| Intermediate | busy, indecisive, skeptical | 2-3 mixed objections | Moderate | SDR with 1-3 months experience |
| Advanced | hostile, skeptical, busy | 3-5 hard objections | High | SDR confirmed, pre-certification |

### Progression Logic

```
IF learner.simulations_completed < 5 AND learner.avg_sim_score < 15
  → Assign beginner scenarios only

IF learner.simulations_completed >= 5 AND learner.avg_sim_score >= 15
  → Unlock intermediate scenarios

IF learner.simulations_completed >= 15 AND learner.avg_sim_score >= 18
  → Unlock advanced scenarios

IF learner.avg_sim_score >= 20 on 3 consecutive advanced scenarios
  → Flag as "ready for certification"
```

## Simulation Record

Each simulation is stored for analytics and review:

```json
{
  "simulation_id": "sim_<uuid>",
  "learner_id": "user_<uuid>",
  "scenario_id": "scenario_01",
  "persona_id": "persona_<uuid>",
  "difficulty": "intermediate",
  "mode": "text | voice",
  "started_at": "2026-04-08T10:00:00Z",
  "ended_at": "2026-04-08T10:03:42Z",
  "duration_seconds": 222,
  "scores": {
    "opening": 4,
    "discovery": 3,
    "value_proposition": 4,
    "objection_handling": 2,
    "close": 3,
    "total": 16
  },
  "transcript": [
    { "role": "sdr", "message": "Bonjour M. Mercier...", "timestamp": "00:00" },
    { "role": "prospect", "message": "Oui, bonjour, c'est a quel sujet ?", "timestamp": "00:05" }
  ],
  "feedback": {
    "highlights": ["Bonne personnalisation a 00:12", "Preuve sociale a 02:58"],
    "improvements": ["Objection temps mal traitee", "Close pas assez assertif"],
    "recommended_modules": ["mod_abc123", "mod_def456", "mod_ghi789"]
  }
}
```

## Evaluation Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Persona realism | 25% | AI prospect behaves consistently with persona definition, natural language, appropriate reactions |
| Scoring accuracy | 25% | Scores reflect actual SDR performance, consistent across similar performances, calibrated to rubric |
| Feedback quality | 20% | Feedback is specific, actionable, references exact moments in transcript, provides concrete techniques |
| Scenario coverage | 15% | All 10 scenarios work correctly, difficulty levels are properly differentiated |
| Progression logic | 15% | Difficulty unlocks correctly, certification readiness flagged at right threshold |

### Rubric

- **Excellent (90-100%):** AI prospect is indistinguishable from a real prospect. Scoring is consistent and calibrated. Feedback references specific transcript moments with actionable improvement techniques. All scenarios work across all difficulty levels. Progression logic gates correctly.
- **Good (70-89%):** AI prospect is mostly realistic with occasional breaks in character. Scoring is mostly accurate. Feedback is useful but sometimes generic. Most scenarios work.
- **Needs Improvement (50-69%):** AI prospect is robotic or inconsistent with persona. Scoring is unreliable. Feedback is vague. Some scenarios are broken. Progression logic has bugs.
- **Failing (<50%):** AI prospect does not follow persona. Scoring is random. No useful feedback. Scenarios do not work. No progression logic.
