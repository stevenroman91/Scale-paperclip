---
name: call-analysis
description: Call transcription (Whisper) and quality analysis (Claude) — 5-criteria scoring /25, objection handling, talk ratio, winning pattern identification, telephony integration
slug: call-analysis
schema: agentcompanies/v1
tags:
  - coaching
  - transcription
  - whisper
  - quality
  - ringover
  - aircall
---

# Call Analysis

Skill de transcription et d'analyse qualite des appels SDR chez ScaleFast. Pipeline complet : recuperation de l'enregistrement depuis la telephonie, transcription via Whisper, analyse qualite via Claude, scoring sur 5 criteres, et identification des patterns gagnants.

## Telephony Integration

### Ringover API

- **Base URL**: `https://public-api.ringover.com/v2`
- **Auth**: Bearer token in `Authorization` header
- **Documentation**: https://developer.ringover.com

```javascript
const RINGOVER_BASE = 'https://public-api.ringover.com/v2';
const ringoverHeaders = {
  'Authorization': `Bearer ${process.env.RINGOVER_API_KEY}`,
  'Content-Type': 'application/json'
};

// List calls with recordings
async function getRingoverCalls(dateFrom, dateTo) {
  const response = await axios.get(`${RINGOVER_BASE}/calls`, {
    headers: ringoverHeaders,
    params: {
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
      direction: 'OUTBOUND',
      has_recording: true
    }
  });
  return response.data.calls;
}

// Download recording for a specific call
async function getRingoverRecording(callId) {
  const response = await axios.get(`${RINGOVER_BASE}/calls/${callId}/recording`, {
    headers: ringoverHeaders,
    responseType: 'arraybuffer'
  });
  return {
    buffer: response.data,
    contentType: response.headers['content-type'],
    callId
  };
}
```

### Aircall API

- **Base URL**: `https://api.aircall.io/v1`
- **Auth**: Basic auth (`api_id:api_token` base64-encoded)
- **Documentation**: https://developer.aircall.io

```javascript
const AIRCALL_BASE = 'https://api.aircall.io/v1';
const aircallHeaders = {
  'Authorization': `Basic ${Buffer.from(`${process.env.AIRCALL_API_ID}:${process.env.AIRCALL_API_TOKEN}`).toString('base64')}`,
  'Content-Type': 'application/json'
};

// List calls
async function getAircallCalls(dateFrom, dateTo) {
  const response = await axios.get(`${AIRCALL_BASE}/calls`, {
    headers: aircallHeaders,
    params: {
      from: Math.floor(dateFrom.getTime() / 1000),
      to: Math.floor(dateTo.getTime() / 1000),
      direction: 'outbound',
      order: 'desc'
    }
  });
  return response.data.calls.filter(c => c.recording);
}

// Get recording URL
async function getAircallRecording(callId) {
  const response = await axios.get(`${AIRCALL_BASE}/calls/${callId}`, {
    headers: aircallHeaders
  });
  // Recording URL is a temporary signed URL
  return {
    url: response.data.call.recording,
    callId,
    duration: response.data.call.duration
  };
}
```

### Unified Call Fetcher

```javascript
async function fetchCallRecording(callId, provider) {
  if (provider === 'ringover') {
    return getRingoverRecording(callId);
  } else if (provider === 'aircall') {
    return getAircallRecording(callId);
  }
  throw new Error(`Unknown telephony provider: ${provider}`);
}
```

## OpenAI Whisper Integration

### Configuration

- **Model**: `whisper-1`
- **Endpoint**: `POST https://api.openai.com/v1/audio/transcriptions`
- **Supported formats**: mp3, mp4, mpeg, mpga, m4a, wav, webm
- **Max file size**: 25 MB
- **Cost**: $0.006 per minute of audio
- **Language**: specify `fr` for French to improve accuracy

### Transcription Function

```javascript
const FormData = require('form-data');
const fs = require('fs');

async function transcribeCall(audioBuffer, filename, language = 'fr') {
  // Check file size (25 MB limit)
  const MAX_SIZE = 25 * 1024 * 1024;
  if (audioBuffer.length > MAX_SIZE) {
    // Split into chunks using ffmpeg
    return await transcribeLargeFile(audioBuffer, filename, language);
  }

  const form = new FormData();
  form.append('file', audioBuffer, { filename: filename });
  form.append('model', 'whisper-1');
  form.append('language', language);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment');

  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      maxContentLength: 30 * 1024 * 1024,
      timeout: 120000
    }
  );

  return {
    text: response.data.text,
    segments: response.data.segments,  // [{start, end, text}, ...]
    duration: response.data.duration,
    language: response.data.language
  };
}
```

### Speaker Diarization

Whisper does not natively support speaker diarization. Post-process transcription to identify SDR vs prospect turns:

```javascript
function identifySpeakers(segments, sdrName) {
  // Heuristic: SDR speaks first (initiates the call)
  // Use patterns: SDR typically introduces themselves with the agency name
  let sdrSpeaking = true;  // First speaker is SDR

  return segments.map((segment, i) => {
    // Detect speaker change: gap > 1.5s or clear turn signals
    if (i > 0) {
      const gap = segment.start - segments[i - 1].end;
      if (gap > 1.5) {
        sdrSpeaking = !sdrSpeaking;  // Speaker changed
      }
    }

    return {
      ...segment,
      speaker: sdrSpeaking ? 'SDR' : 'Prospect'
    };
  });
}

function calculateTalkRatio(diarizedSegments) {
  let sdrTime = 0, prospectTime = 0;

  for (const seg of diarizedSegments) {
    const duration = seg.end - seg.start;
    if (seg.speaker === 'SDR') sdrTime += duration;
    else prospectTime += duration;
  }

  const total = sdrTime + prospectTime;
  return {
    sdr_pct: total > 0 ? Math.round((sdrTime / total) * 100) : 0,
    prospect_pct: total > 0 ? Math.round((prospectTime / total) * 100) : 0,
    sdr_seconds: Math.round(sdrTime),
    prospect_seconds: Math.round(prospectTime)
  };
}
```

## Claude Analysis — Call Scoring

### Scoring Grid: 5 Criteria, 1-5 each, Total /25

| # | Criteria | Weight | What to Evaluate |
|---|----------|--------|------------------|
| 1 | Opening (Ouverture) | 1-5 | Hook quality, personalization, energy, permission to continue |
| 2 | Discovery (Qualification) | 1-5 | Question quality, active listening, BANT coverage, note-taking cues |
| 3 | Value Proposition | 1-5 | Relevance to prospect's context, clarity, differentiation from competitors |
| 4 | Objection Handling | 1-5 | Acknowledgment, reframe technique, close attempt after objection |
| 5 | Close | 1-5 | Next step secured, calendar invite sent, follow-up plan stated |

### Claude Prompt Template

```javascript
const ANALYSIS_PROMPT = `Tu es un coach commercial expert en prospection telephonique B2B en France.
Analyse la transcription suivante d'un appel de prospection SDR.

CONTEXTE :
- SDR : {sdr_name} (niveau : {sdr_level})
- Prospect : {prospect_name}, {prospect_title} chez {prospect_company}
- Client agence : {client_name}
- Objectif de l'appel : obtenir un RDV qualifie
- Duree : {duration} secondes
- Talk ratio SDR/Prospect : {sdr_pct}%/{prospect_pct}%

TRANSCRIPTION :
{transcript}

EVALUE cet appel selon les 5 criteres suivants. Pour chaque critere, donne un score de 1 a 5 :

1. OUVERTURE (1-5) : L'accroche est-elle personnalisee ? Le SDR a-t-il capte l'attention dans les 15 premieres secondes ? A-t-il demande la permission de continuer ? L'energie vocale est-elle appropriee ?

2. DECOUVERTE (1-5) : Le SDR a-t-il pose des questions ouvertes de qualite ? A-t-il pratique l'ecoute active (reformulation, relance) ? A-t-il couvert les elements BANT (Budget, Autorite, Need, Timing) ? A-t-il pris des notes (indices verbaux) ?

3. PROPOSITION DE VALEUR (1-5) : Le pitch est-il adapte au contexte specifique du prospect ? Est-il clair et concis (< 30 secondes) ? Le SDR differencie-t-il son offre de la concurrence ? Utilise-t-il des preuves sociales (cas clients similaires) ?

4. GESTION DES OBJECTIONS (1-5) : Le SDR a-t-il identifie l'objection reelle ? A-t-il accuse reception (empathie) avant de repondre ? A-t-il recadre avec une question ou un argument pertinent ? A-t-il tente de closer apres la gestion de l'objection ?

5. CLOSING (1-5) : Le SDR a-t-il propose une etape suivante claire ? A-t-il obtenu un engagement (date, heure) ? A-t-il envoye une invitation calendrier ? A-t-il recapitule les points discutes ?

REPONDS STRICTEMENT au format JSON suivant :
{
  "scores": {
    "opening": { "score": N, "justification": "..." },
    "discovery": { "score": N, "justification": "..." },
    "value_proposition": { "score": N, "justification": "..." },
    "objection_handling": { "score": N, "justification": "..." },
    "closing": { "score": N, "justification": "..." }
  },
  "total_score": N,
  "transcript_highlights": [
    { "timestamp": "MM:SS", "speaker": "SDR|Prospect", "text": "...", "comment": "..." }
  ],
  "objections_detected": [
    { "type": "...", "prospect_quote": "...", "sdr_response": "...", "quality": "bon|moyen|faible" }
  ],
  "improvement_tips": [
    { "criteria": "...", "tip": "...", "example_phrase": "..." }
  ],
  "winning_patterns": [
    { "pattern": "...", "example": "..." }
  ],
  "call_outcome_prediction": "rdv_probable|rappel_probable|refus_probable"
}`;
```

### Analysis Function

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

async function analyzeCall(transcript, metadata) {
  const prompt = ANALYSIS_PROMPT
    .replace('{sdr_name}', metadata.sdrName)
    .replace('{sdr_level}', metadata.sdrLevel)
    .replace('{prospect_name}', metadata.prospectName)
    .replace('{prospect_title}', metadata.prospectTitle)
    .replace('{prospect_company}', metadata.prospectCompany)
    .replace('{client_name}', metadata.clientName)
    .replace('{duration}', metadata.durationSeconds)
    .replace('{sdr_pct}', metadata.talkRatio.sdr_pct)
    .replace('{prospect_pct}', metadata.talkRatio.prospect_pct)
    .replace('{transcript}', transcript);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  const analysisText = response.content[0].text;
  return JSON.parse(analysisText);
}
```

## Common Objections Database

| Objection (French) | Type | Recommended Response Technique |
|---------------------|------|-------------------------------|
| "Je n'ai pas le temps" | Time | Micro-engagement: "Je comprends, 30 secondes pour vous expliquer pourquoi j'appelle, et vous me dites si ca vaut 15 minutes de votre temps ?" |
| "Envoyez-moi un email" | Brush-off | Re-qualify: "Bien sur, pour vous envoyer quelque chose de pertinent, j'ai juste 2 questions rapides..." |
| "On a deja un prestataire" | Status quo | Comparison: "Tres bien, c'est un sujet important pour vous alors. Par curiosite, qu'est-ce qui vous satisfait le plus chez eux ?" |
| "C'est trop cher" | Price | Value reframe: "Je comprends. Nos clients nous disent souvent que le cout d'un commercial interne a temps plein est 3x superieur..." |
| "Je ne suis pas le bon interlocuteur" | Wrong contact | Referral: "Merci de votre honnetete. Qui serait la bonne personne ? Je la contacterai en mentionnant notre echange." |
| "Rappelez-moi plus tard" | Delay | Pin down: "Avec plaisir. Quel jour et quelle heure seraient ideals ? Je vous envoie une invitation pour qu'on ne se rate pas." |

## Pattern Detection

### Winning Talk Tracks

Analyze calls that resulted in RDV to identify recurring patterns:

```javascript
async function detectWinningPatterns(clientId, periodDays = 30) {
  // Get all calls with RDV outcome in period
  const successCalls = await db.query(
    `SELECT ca.* FROM call_analyses ca
     JOIN calls c ON c.id = ca.call_id
     WHERE c.client_id = $1
       AND c.outcome = 'rdv_set'
       AND c.call_date >= NOW() - INTERVAL '${periodDays} days'`,
    [clientId]
  );

  // Extract patterns from winning calls
  const patterns = {
    opening_hooks: [],
    discovery_questions: [],
    value_props: [],
    objection_responses: [],
    closing_techniques: []
  };

  for (const call of successCalls.rows) {
    const analysis = JSON.parse(call.analysis_json);
    if (analysis.winning_patterns) {
      analysis.winning_patterns.forEach(p => {
        patterns[categorizePattern(p.pattern)].push(p);
      });
    }
  }

  return patterns;
}
```

### Optimal Talk/Listen Ratio

Target: 40% SDR / 60% Prospect

```javascript
function scoreTalkRatio(sdrPct) {
  if (sdrPct <= 40) return { score: 5, label: 'Excellent — le prospect parle beaucoup' };
  if (sdrPct <= 50) return { score: 4, label: 'Tres bien — bon equilibre' };
  if (sdrPct <= 60) return { score: 3, label: 'Correct — a surveiller' };
  if (sdrPct <= 70) return { score: 2, label: 'Trop haut — le SDR domine' };
  return { score: 1, label: 'Problematique — monologue du SDR' };
}
```

## Data Model

### Table: call_analyses

```sql
CREATE TABLE call_analyses (
  id                SERIAL PRIMARY KEY,
  call_id           INTEGER REFERENCES calls(id) UNIQUE,
  sdr_id            INTEGER REFERENCES sdr_profiles(id),
  client_id         INTEGER REFERENCES clients(id),
  transcript_text   TEXT,
  transcript_segments JSONB,
  duration_seconds  INTEGER,
  sdr_talk_pct      INTEGER,
  prospect_talk_pct INTEGER,
  score_opening     SMALLINT CHECK (score_opening BETWEEN 1 AND 5),
  score_discovery   SMALLINT CHECK (score_discovery BETWEEN 1 AND 5),
  score_value_prop  SMALLINT CHECK (score_value_prop BETWEEN 1 AND 5),
  score_objections  SMALLINT CHECK (score_objections BETWEEN 1 AND 5),
  score_closing     SMALLINT CHECK (score_closing BETWEEN 1 AND 5),
  total_score       SMALLINT CHECK (total_score BETWEEN 5 AND 25),
  analysis_json     JSONB NOT NULL,
  whisper_cost_usd  DECIMAL(6,4),
  claude_cost_usd   DECIMAL(6,4),
  analyzed_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_call_analyses_sdr ON call_analyses(sdr_id, analyzed_at);
CREATE INDEX idx_call_analyses_score ON call_analyses(total_score);
```

## Complete Pipeline

```javascript
async function processCall(callId, provider) {
  // 1. Fetch recording from telephony provider
  const recording = await fetchCallRecording(callId, provider);

  // 2. Transcribe with Whisper
  const transcription = await transcribeCall(
    recording.buffer || await downloadFromUrl(recording.url),
    `call_${callId}.mp3`,
    'fr'
  );

  // 3. Diarize speakers
  const diarized = identifySpeakers(transcription.segments, null);
  const talkRatio = calculateTalkRatio(diarized);

  // 4. Get call metadata
  const callMeta = await db.query('SELECT * FROM calls WHERE id = $1', [callId]);
  const call = callMeta.rows[0];

  // 5. Analyze with Claude
  const analysis = await analyzeCall(transcription.text, {
    sdrName: call.sdr_name,
    sdrLevel: call.sdr_level,
    prospectName: call.prospect_name,
    prospectTitle: call.prospect_title,
    prospectCompany: call.prospect_company,
    clientName: call.client_name,
    durationSeconds: transcription.duration,
    talkRatio
  });

  // 6. Calculate costs
  const whisperCost = (transcription.duration / 60) * 0.006;
  const claudeCost = 0.015; // approximate per analysis

  // 7. Store results
  await db.query(
    `INSERT INTO call_analyses (
      call_id, sdr_id, client_id, transcript_text, transcript_segments,
      duration_seconds, sdr_talk_pct, prospect_talk_pct,
      score_opening, score_discovery, score_value_prop, score_objections, score_closing,
      total_score, analysis_json, whisper_cost_usd, claude_cost_usd
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      callId, call.sdr_id, call.client_id, transcription.text, JSON.stringify(diarized),
      transcription.duration, talkRatio.sdr_pct, talkRatio.prospect_pct,
      analysis.scores.opening.score, analysis.scores.discovery.score,
      analysis.scores.value_proposition.score, analysis.scores.objection_handling.score,
      analysis.scores.closing.score, analysis.total_score,
      JSON.stringify(analysis), whisperCost, claudeCost
    ]
  );

  return analysis;
}
```

## Output Formats

### Per-Call Report

```
📞 Analyse Appel #[ID]
SDR : [Prenom] | Prospect : [Prenom Nom] @ [Entreprise]
Duree : [X min Y sec] | Talk ratio : SDR [XX%] / Prospect [XX%]
Resultat : [RDV pose / Rappel / Refus / Messagerie]

Score global : [XX/25]
  1. Ouverture         : [X/5] — [justification courte]
  2. Decouverte        : [X/5] — [justification courte]
  3. Proposition valeur : [X/5] — [justification courte]
  4. Objections        : [X/5] — [justification courte]
  5. Closing           : [X/5] — [justification courte]

💡 Conseils d'amelioration :
  - [Tip 1 avec phrase d'exemple]
  - [Tip 2 avec phrase d'exemple]

🏆 Points forts :
  - [Pattern gagnant identifie]
```

### Weekly SDR Coaching Summary

```
📊 Coaching Hebdomadaire — [Prenom SDR]
Periode : [DD/MM] — [DD/MM/YYYY]
Appels analyses : [N]
Score moyen : [XX.X/25] ([+/-X.X] vs semaine precedente)

Repartition des scores :
  Ouverture       : [X.X/5] (moy.)
  Decouverte      : [X.X/5]
  Valeur          : [X.X/5]
  Objections      : [X.X/5]
  Closing         : [X.X/5]

Talk ratio moyen : SDR [XX%] / Prospect [XX%]

Top 3 forces :
  1. [Force avec citation d'appel]
  2. [Force]
  3. [Force]

Top 3 axes de progression :
  1. [Axe] — Exemple : "[citation appel]" → Essaye plutot : "[phrase suggeree]"
  2. [Axe] — Exemple : "[citation appel]" → Essaye plutot : "[phrase suggeree]"
  3. [Axe]

Exercice de la semaine :
  [Description d'un exercice pratique cible sur le principal axe de progression]
```

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| fetch_new_recordings | Every 2 hours (business hours) | Fetch new call recordings from telephony API |
| process_call_queue | Every 30 minutes | Transcribe and analyze queued calls |
| weekly_coaching | Every Monday at 08:00 CET | Generate weekly coaching summaries per SDR |
| pattern_analysis | 1st of each month | Run winning pattern detection for all clients |

## Error Handling

| Error | Action |
|-------|--------|
| Recording not available | Skip, retry in 1 hour (recording may still be processing) |
| Whisper file too large (>25 MB) | Split audio with ffmpeg into 10-min chunks, transcribe each, merge |
| Whisper API timeout | Retry up to 3x with exponential backoff |
| Claude JSON parse error | Retry with stricter prompt, fall back to text-only analysis |
| Telephony API auth failure | Alert Sales Ops Manager, check token expiry |
| Call too short (<15 seconds) | Skip analysis, mark as "too_short" |

## Integration Points

- **sales-kpi-tracking**: call quality scores feed into SDR performance profiles and activity scores
- **client-reporting**: call analysis stats included in monthly reports (avg score, talk ratio trends)
- **discord-notifications**: exceptional scores (>22/25) or very low scores (<10/25) trigger Discord alerts
- **prospect-list-builder**: conversion data by prospect segment feeds back into ICP scoring refinement
