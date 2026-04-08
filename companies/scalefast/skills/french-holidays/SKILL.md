---
name: french-holidays
description: French public holidays management — Computus algorithm, business day calculations, anti no-show integration, pre-computed holidays 2025-2030
slug: french-holidays
schema: agentcompanies/v1
tags:
  - holidays
  - france
  - business-days
  - computus
  - anti-noshow
---

# French Holidays

Skill de gestion des jours feries francais pour le calcul des jours ouvres chez ScaleFast. Fournit les fonctions utilitaires utilisees par tous les autres skills necessitant des calculs de jours ouvres.

## Liste des jours feries francais (11 jours)

| Jour ferie | Date | Type |
|------------|------|------|
| Jour de l'An | 1er janvier | Fixe |
| Lundi de Paques | Paques + 1 jour | Mobile |
| Fete du Travail | 1er mai | Fixe |
| Victoire 1945 | 8 mai | Fixe |
| Ascension | Paques + 39 jours (toujours un jeudi) | Mobile |
| Lundi de Pentecote | Paques + 50 jours | Mobile |
| Fete nationale | 14 juillet | Fixe |
| Assomption | 15 aout | Fixe |
| Toussaint | 1er novembre | Fixe |
| Armistice | 11 novembre | Fixe |
| Noel | 25 decembre | Fixe |

## Computus Algorithm (Calcul de la date de Paques)

L'algorithme de Meeus/Jones/Butcher calcule la date du dimanche de Paques pour toute annee du calendrier gregorien.

### Step-by-Step

```javascript
function computeEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);  // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);  // JavaScript months are 0-indexed
}
```

### Worked Example: 2026

```
year = 2026
a = 2026 % 19 = 12
b = floor(2026 / 100) = 20
c = 2026 % 100 = 26
d = floor(20 / 4) = 5
e = 20 % 4 = 0
f = floor((20 + 8) / 25) = 1
g = floor((20 - 1 + 1) / 3) = 6
h = (19*12 + 20 - 5 - 6 + 15) % 30 = 252 % 30 = 12
i = floor(26 / 4) = 6
k = 26 % 4 = 2
l = (32 + 0 + 12 - 12 - 2) % 7 = 30 % 7 = 2
m = floor((12 + 132 + 44) / 451) = floor(188/451) = 0
month = floor((12 + 2 - 0 + 114) / 31) = floor(128/31) = 4 → April
day = (128 % 31) + 1 = 4 + 1 = 5

Easter 2026 = April 5, 2026
```

## Helper Functions

### getHolidays(year)

```javascript
function getHolidays(year) {
  const easter = computeEaster(year);
  const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  };

  return [
    { date: new Date(year, 0, 1),   name: "Jour de l'An" },
    { date: addDays(easter, 1),     name: "Lundi de Paques" },
    { date: new Date(year, 4, 1),   name: "Fete du Travail" },
    { date: new Date(year, 4, 8),   name: "Victoire 1945" },
    { date: addDays(easter, 39),    name: "Ascension" },
    { date: addDays(easter, 50),    name: "Lundi de Pentecote" },
    { date: new Date(year, 6, 14),  name: "Fete nationale" },
    { date: new Date(year, 7, 15),  name: "Assomption" },
    { date: new Date(year, 10, 1),  name: "Toussaint" },
    { date: new Date(year, 10, 11), name: "Armistice" },
    { date: new Date(year, 11, 25), name: "Noel" }
  ];
}
```

### isHoliday(date)

```javascript
function isHoliday(date) {
  const holidays = getHolidays(date.getFullYear());
  return holidays.some(h =>
    h.date.getFullYear() === date.getFullYear() &&
    h.date.getMonth() === date.getMonth() &&
    h.date.getDate() === date.getDate()
  );
}
```

### isBusinessDay(date)

```javascript
function isBusinessDay(date) {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;  // Sunday or Saturday
  if (isHoliday(date)) return false;
  return true;
}
```

### nextBusinessDay(date)

```javascript
function nextBusinessDay(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (!isBusinessDay(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}
```

### previousBusinessDay(date)

```javascript
function previousBusinessDay(date) {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  while (!isBusinessDay(prev)) {
    prev.setDate(prev.getDate() - 1);
  }
  return prev;
}
```

### addBusinessDays(date, n)

```javascript
function addBusinessDays(date, n) {
  let result = new Date(date);
  let added = 0;
  const direction = n >= 0 ? 1 : -1;
  const absN = Math.abs(n);

  while (added < absN) {
    result.setDate(result.getDate() + direction);
    if (isBusinessDay(result)) {
      added++;
    }
  }
  return result;
}
```

### countBusinessDays(startDate, endDate)

```javascript
function countBusinessDays(startDate, endDate) {
  let count = 0;
  let current = new Date(startDate);
  current.setDate(current.getDate() + 1);  // exclusive of start
  while (current <= endDate) {
    if (isBusinessDay(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}
```

## Pre-Computed Holidays 2025-2030

### 2025

| Jour ferie | Date | Jour |
|------------|------|------|
| Jour de l'An | 01/01/2025 | Mercredi |
| Lundi de Paques | 21/04/2025 | Lundi |
| Fete du Travail | 01/05/2025 | Jeudi |
| Victoire 1945 | 08/05/2025 | Jeudi |
| Ascension | 29/05/2025 | Jeudi |
| Lundi de Pentecote | 09/06/2025 | Lundi |
| Fete nationale | 14/07/2025 | Lundi |
| Assomption | 15/08/2025 | Vendredi |
| Toussaint | 01/11/2025 | Samedi |
| Armistice | 11/11/2025 | Mardi |
| Noel | 25/12/2025 | Jeudi |

### 2026

| Jour ferie | Date | Jour |
|------------|------|------|
| Jour de l'An | 01/01/2026 | Jeudi |
| Lundi de Paques | 06/04/2026 | Lundi |
| Fete du Travail | 01/05/2026 | Vendredi |
| Victoire 1945 | 08/05/2026 | Vendredi |
| Ascension | 14/05/2026 | Jeudi |
| Lundi de Pentecote | 25/05/2026 | Lundi |
| Fete nationale | 14/07/2026 | Mardi |
| Assomption | 15/08/2026 | Samedi |
| Toussaint | 01/11/2026 | Dimanche |
| Armistice | 11/11/2026 | Mercredi |
| Noel | 25/12/2026 | Vendredi |

### 2027

| Jour ferie | Date | Jour |
|------------|------|------|
| Jour de l'An | 01/01/2027 | Vendredi |
| Lundi de Paques | 29/03/2027 | Lundi |
| Fete du Travail | 01/05/2027 | Samedi |
| Victoire 1945 | 08/05/2027 | Samedi |
| Ascension | 06/05/2027 | Jeudi |
| Lundi de Pentecote | 17/05/2027 | Lundi |
| Fete nationale | 14/07/2027 | Mercredi |
| Assomption | 15/08/2027 | Dimanche |
| Toussaint | 01/11/2027 | Lundi |
| Armistice | 11/11/2027 | Jeudi |
| Noel | 25/12/2027 | Samedi |

### 2028

| Jour ferie | Date | Jour |
|------------|------|------|
| Jour de l'An | 01/01/2028 | Samedi |
| Lundi de Paques | 17/04/2028 | Lundi |
| Fete du Travail | 01/05/2028 | Lundi |
| Victoire 1945 | 08/05/2028 | Lundi |
| Ascension | 25/05/2028 | Jeudi |
| Lundi de Pentecote | 05/06/2028 | Lundi |
| Fete nationale | 14/07/2028 | Vendredi |
| Assomption | 15/08/2028 | Mardi |
| Toussaint | 01/11/2028 | Mercredi |
| Armistice | 11/11/2028 | Samedi |
| Noel | 25/12/2028 | Lundi |

### 2029

| Jour ferie | Date | Jour |
|------------|------|------|
| Jour de l'An | 01/01/2029 | Lundi |
| Lundi de Paques | 02/04/2029 | Lundi |
| Fete du Travail | 01/05/2029 | Mardi |
| Victoire 1945 | 08/05/2029 | Mardi |
| Ascension | 10/05/2029 | Jeudi |
| Lundi de Pentecote | 21/05/2029 | Lundi |
| Fete nationale | 14/07/2029 | Samedi |
| Assomption | 15/08/2029 | Mercredi |
| Toussaint | 01/11/2029 | Jeudi |
| Armistice | 11/11/2029 | Dimanche |
| Noel | 25/12/2029 | Mardi |

### 2030

| Jour ferie | Date | Jour |
|------------|------|------|
| Jour de l'An | 01/01/2030 | Mardi |
| Lundi de Paques | 22/04/2030 | Lundi |
| Fete du Travail | 01/05/2030 | Mercredi |
| Victoire 1945 | 08/05/2030 | Mercredi |
| Ascension | 30/05/2030 | Jeudi |
| Lundi de Pentecote | 10/06/2030 | Lundi |
| Fete nationale | 14/07/2030 | Dimanche |
| Assomption | 15/08/2030 | Jeudi |
| Toussaint | 01/11/2030 | Vendredi |
| Armistice | 11/11/2030 | Lundi |
| Noel | 25/12/2030 | Mercredi |

## Anti No-Show Integration

### getAntiNoShowReminderDate(rdvDate)

The anti no-show reminder must be sent exactly 2 business days before the RDV. This function computes that date, accounting for weekends and French holidays.

```javascript
function getAntiNoShowReminderDate(rdvDate) {
  // Go back 2 business days from rdvDate
  let reminderDate = new Date(rdvDate);
  let businessDaysBack = 0;

  while (businessDaysBack < 2) {
    reminderDate.setDate(reminderDate.getDate() - 1);
    if (isBusinessDay(reminderDate)) {
      businessDaysBack++;
    }
  }

  return reminderDate;
}
```

### getRDVsNeedingReminder(today)

Returns all RDV scheduled for the date that is 2 business days after `today`.

```javascript
function getRDVsNeedingReminder(today) {
  const targetRDVDate = addBusinessDays(today, 2);
  // Query: SELECT * FROM rdv WHERE rdv_date = targetRDVDate AND status = 'set'
  return queryRDVsByDate(targetRDVDate);
}
```

### Edge Cases and Examples

#### Case 1: RDV on Monday after a Friday holiday

```
Scenario: RDV on Monday 05/05/2025
- Friday 02/05/2025 = pont after Fete du Travail? No, 01/05 is Thursday
- Actually: Friday 02/05 is a business day
- Reminder = 2 business days before Monday = Thursday 01/05? No, 01/05 = Fete du Travail
- Go back: from Monday 05/05, subtract 1 BD = Friday 02/05, subtract 2 BD = Wednesday 30/04
- Reminder sent: Wednesday 30/04/2025
```

#### Case 2: RDV on first working day after a long weekend (Ascension)

```
Scenario: RDV on Monday 02/06/2025 (first business day after Pentecote weekend)
- Friday 30/05 = business day (day after Ascension 29/05)
  Wait: 29/05 is Ascension (Thursday). 30/05 = Friday (business day, ponts are not official).
- Subtract 1 BD from Monday 02/06 = Friday 30/05
- Subtract 2 BD = Thursday 29/05? No, Ascension!
- So subtract 2 BD = Wednesday 28/05
- Reminder sent: Wednesday 28/05/2025
```

#### Case 3: RDV on a Tuesday, Monday is holiday

```
Scenario: RDV on Tuesday 14/07/2026? No, 14/07 is itself Fete nationale
- Alert: RDV scheduled on a holiday! SDR should be notified to reschedule.

Scenario: RDV on Wednesday 15/07/2026 (day after Fete nationale)
- Subtract 1 BD = Tuesday 14/07? No, Fete nationale
- So subtract 1 BD = Monday 13/07
- Subtract 2 BD = Friday 10/07
- Reminder sent: Friday 10/07/2026
```

#### Case 4: RDV scheduled on a holiday

```
If rdvDate falls on a holiday or weekend:
1. Log a warning: "RDV ${rdvId} scheduled on non-business day ${rdvDate}"
2. Notify SDR via Discord: "⚠️ RDV programme un jour ferie / weekend. Merci de replanifier."
3. Do NOT send anti no-show reminder (no one will be working)
```

### Validation Function

```javascript
function validateRDVDate(rdvDate) {
  if (!isBusinessDay(rdvDate)) {
    const dayOfWeek = rdvDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { valid: false, reason: 'weekend', suggestedDate: nextBusinessDay(rdvDate) };
    }
    const holiday = getHolidays(rdvDate.getFullYear()).find(h =>
      h.date.getDate() === rdvDate.getDate() && h.date.getMonth() === rdvDate.getMonth()
    );
    return { valid: false, reason: `jour_ferie: ${holiday.name}`, suggestedDate: nextBusinessDay(rdvDate) };
  }
  return { valid: true };
}
```

## Ponts (Bridge Days)

Bridge days (ponts) are NOT official French holidays. They are at employer discretion.

- Ponts are treated as normal business days unless the CEO explicitly marks them as off
- Common ponts: Friday after Ascension Thursday, Monday between a Tuesday holiday and weekend
- A `company_closures` table can store ad-hoc non-working days:

```sql
CREATE TABLE company_closures (
  id         SERIAL PRIMARY KEY,
  close_date DATE NOT NULL UNIQUE,
  reason     VARCHAR(255),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

The `isBusinessDay` function should be extended to check this table:

```javascript
async function isBusinessDayFull(date) {
  if (date.getDay() === 0 || date.getDay() === 6) return false;
  if (isHoliday(date)) return false;
  const closure = await db.query('SELECT 1 FROM company_closures WHERE close_date = $1', [date]);
  if (closure.rows.length > 0) return false;
  return true;
}
```

## Annual Validation

At the start of each year (or when a new year's holidays are first needed):

1. Generate the complete list of holidays using `getHolidays(year)`
2. Compare against the pre-computed table above for verification
3. Log any discrepancies
4. Identify holidays falling on weekends (no impact on business days)
5. Identify potential pont days for CEO review

## Integration Points

- **discord-notifications**: uses `isBusinessDay` to determine when to send reminders
- **sales-kpi-tracking**: uses `countBusinessDays` for calls/day calculation
- **client-reporting**: uses business day counts for period calculations
- **anti no-show workflow**: uses `getAntiNoShowReminderDate` to schedule reminders
