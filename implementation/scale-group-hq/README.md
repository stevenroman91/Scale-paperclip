# Scale Group HQ

Plateforme de pilotage du groupe Scale — la holding qui consolide les fonctions Finance, RH et Marketing pour l'ensemble des filiales.

## Architecture

Scale Group HQ est une application **Next.js 15** avec **TypeScript**, **Tailwind CSS** (theme bleu corporate), et **Prisma** comme ORM.

### Structure

```
scale-group-hq/
├── prisma/
│   └── schema.prisma          # Modeles de donnees (9 modeles)
├── src/
│   ├── lib/
│   │   ├── db.ts              # Singleton Prisma client
│   │   ├── utils.ts           # Utilitaires (cn, formatCurrency, etc.)
│   │   └── services/
│   │       ├── finance.ts     # Tresorerie, P&L, previsions
│   │       ├── hr-analytics.ts # Effectifs, turnover, recrutement
│   │       └── payroll-fr.ts  # Paie francaise, charges sociales
│   ├── app/
│   │   ├── layout.tsx         # Layout racine
│   │   ├── page.tsx           # Page d'accueil holding
│   │   ├── globals.css        # Theme dark blue corporate
│   │   ├── api/
│   │   │   ├── finance/       # GET tresorerie / P&L / previsions
│   │   │   ├── hr/            # GET metriques RH
│   │   │   ├── payroll/       # GET/POST bulletins de paie
│   │   │   ├── recruitment/   # GET/POST pipeline recrutement
│   │   │   └── content/       # GET/POST calendrier editorial
│   │   └── dashboard/
│   │       ├── layout.tsx     # Layout avec sidebar
│   │       ├── page.tsx       # Dashboard consolide
│   │       ├── finance/       # Tresorerie, P&L, transactions
│   │       ├── hr/            # Effectifs, turnover, analytiques
│   │       ├── payroll/       # Paie, DSN, simulateur
│   │       ├── recruitment/   # Pipeline kanban
│   │       └── marketing/     # Calendrier, LinkedIn analytics
```

## Modeles de donnees

| Modele | Description |
|--------|-------------|
| **Subsidiary** | Filiales du groupe (nom, type juridique, CA, charges, effectif) |
| **BankAccount** | Comptes bancaires Qonto / Revolut |
| **Transaction** | Transactions bancaires avec categorie et contrepartie |
| **Employee** | Collaborateurs (CDI, CDD, Freelance) avec salaire |
| **PayrollRun** | Executions de paie mensuelles (brut, net, charges) |
| **PayrollLine** | Detail paie par employe |
| **RecruitmentPipeline** | Pipeline de recrutement (sourcing -> embauche) |
| **ContentCalendar** | Calendrier editorial LinkedIn |
| **FinancialReport** | Rapports financiers (journalier, hebdo, mensuel, trimestriel) |

## Services metier

### Finance (`finance.ts`)
- `consolidateTreasury()` — Solde total multi-banques (Qonto + Revolut)
- `calculateSubsidiaryPnL(id)` — CA, charges, marge par filiale
- `generateCashFlowForecast(months)` — Projection de tresorerie
- `getConsolidatedPnL()` — P&L consolide groupe

### RH (`hr-analytics.ts`)
- `getHeadcountBySubsidiary()` — Effectifs par filiale, departement, contrat
- `calculateTurnover(period)` — Taux de turnover sur une periode
- `getRecruitmentFunnel()` — Entonnoir de recrutement par etape
- `calculateCostPerHire()` — Cout moyen par embauche

### Paie (`payroll-fr.ts`)
- `calculateGrossToNet(brut, contrat)` — Decomposition brut/net avec charges francaises
- Charges sociales detaillees : CSG, CRDS, retraite, chomage, maladie, etc.
- `generatePayrollRun(mois, annee)` — Generation automatique de tous les bulletins

## Demarrage

```bash
# Installation
npm install

# Configuration base de donnees
cp .env.example .env
# Modifier DATABASE_URL dans .env

# Migration Prisma
npx prisma migrate dev

# Demarrage
npm run dev
```

## Stack technique

- **Next.js 15** — App Router, Server Components
- **TypeScript 5.6** — Typage strict
- **Tailwind CSS 3.4** — Theme dark blue corporate
- **Prisma 6** — ORM PostgreSQL
- **Zod** — Validation des entrees API
