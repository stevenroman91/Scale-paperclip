---
name: knowledge-base-rag
description: RAG sur la base de connaissances — indexation des documents, recherche semantique, generation de reponses sourcees
slug: knowledge-base-rag
---

# Knowledge Base RAG

Retrieval-Augmented Generation system for the ScaleHQ chatbot knowledge base, enabling accurate, sourced answers to user questions.

## Knowledge Base Sources

| Source                  | Format         | Update Frequency    | Priority |
|-------------------------|----------------|---------------------|----------|
| Product documentation   | Markdown files | On each release     | High     |
| FAQ                     | Structured Q&A | Weekly review       | High     |
| Help articles           | How-to guides  | As needed           | High     |
| API documentation       | OpenAPI + MD   | On each API change  | Medium   |
| Release notes           | Changelog MD   | On each release     | Medium   |
| Known issues/workarounds| Structured list| As bugs are found   | High     |

### Source File Locations
```
docs/
  product/           # Product documentation (features, concepts)
  faq/               # FAQ entries (question + answer pairs)
  guides/            # Step-by-step how-to guides
  api/               # API reference and integration guides
  known-issues/      # Current known issues with workarounds
CHANGELOG.md         # Release notes (parsed by changelog-generator)
```

## Document Processing Pipeline

### Step 1: Source Ingestion

```typescript
interface KBDocument {
  id: string;
  source: "product" | "faq" | "guide" | "api" | "changelog" | "known_issue";
  title: string;
  content: string;
  file_path: string;
  section?: string;        // h2 heading within the document
  language: "fr" | "en";
  last_updated: Date;
  relevance_tags: string[]; // e.g., ["calls", "export", "billing"]
  active: boolean;          // false = expired/archived
}
```

### Step 2: Chunking

Split documents into overlapping chunks for embedding:

- **Chunk size**: 500 tokens (~375 words)
- **Overlap**: 50 tokens (~37 words) between consecutive chunks
- **Chunking strategy**: split on paragraph boundaries first, then sentence boundaries if paragraph exceeds chunk size
- **Preserve context**: each chunk includes the document title and section heading as a prefix

```typescript
interface KBChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;           // "## Dashboard Overview\n\nThe ScaleHQ dashboard..."
  token_count: number;
  embedding: number[];       // 1536-dimension float array
  metadata: {
    source: string;
    section: string;
    title: string;
    language: string;
    last_updated: Date;
    tags: string[];
  };
}
```

### Step 3: Generate Embeddings

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embedChunk(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}
```

Model: `text-embedding-3-small` (1536 dimensions, $0.02 per 1M tokens)
Cost estimate: ~10,000 chunks = ~5M tokens = ~$0.10 per full re-index

### Step 4: Store in pgvector

PostgreSQL with the `pgvector` extension (available on Railway PostgreSQL):

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Chunks table with vector column
CREATE TABLE kb_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES kb_documents(id),
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  embedding vector(1536) NOT NULL,
  source TEXT NOT NULL,
  section TEXT,
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  last_updated TIMESTAMP NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create HNSW index for fast similarity search
CREATE INDEX ON kb_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

Prisma does not natively support pgvector, so use raw SQL via `prisma.$queryRaw` for vector operations.

## Retrieval Workflow

### Step 1: Query Embedding
```typescript
const queryEmbedding = await embedChunk(userQuery);
```

### Step 2: Cosine Similarity Search
```sql
SELECT id, content, title, section, source, language,
       1 - (embedding <=> $1::vector) AS similarity
FROM kb_chunks
WHERE language = $2
  AND active = true
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

Retrieve top 10 candidates (over-fetch for re-ranking).

### Step 3: Re-Rank

Apply re-ranking score based on:
```typescript
function reRank(chunks: ChunkResult[], query: string): ChunkResult[] {
  return chunks.map(chunk => {
    let score = chunk.similarity;

    // Boost recent content (last 30 days)
    const daysSinceUpdate = daysBetween(chunk.last_updated, new Date());
    if (daysSinceUpdate < 30) score += 0.05;

    // Boost by source authority
    const authorityBoost: Record<string, number> = {
      faq: 0.10,          // FAQ answers are most directly relevant
      known_issue: 0.08,  // Known issues are high-signal
      guide: 0.05,        // Guides are step-by-step
      product: 0.03,      // General docs
      changelog: 0.01,    // Release notes are least directly useful
      api: 0.02,
    };
    score += authorityBoost[chunk.source] || 0;

    // Boost if query language matches chunk language
    if (detectLanguage(query) === chunk.language) score += 0.03;

    return { ...chunk, score };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 5); // Return top 5 after re-ranking
}
```

### Step 4: Build Context Prompt

```typescript
const contextPrompt = `
You are the ScaleHQ support assistant. Answer the user's question based on the following knowledge base excerpts.

Rules:
- Only use information from the provided excerpts
- If the excerpts don't contain the answer, say "I don't have information about that in our knowledge base"
- Always cite your source: [Source: {title}]
- Keep answers concise (2-4 sentences)
- If the question is about a known issue, mention the workaround

Knowledge Base Excerpts:
---
${topChunks.map((c, i) => `[${i + 1}] ${c.title} (${c.source})\n${c.content}`).join("\n---\n")}
---

User question: ${userQuery}
`;
```

### Step 5: Generate Answer with Claude

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 500,
  system: contextPrompt,
  messages: [{ role: "user", content: userQuery }],
});
```

Always include source citations in the response. Example:
> "You can export your call data as CSV from the Calls page by clicking the 'Export' button in the top-right corner. The export includes all filtered results. [Source: Call Management Guide]"

## Quality Signals and Monitoring

### Gap Detection

Track queries that return no good matches (all similarity scores < 0.70):

```typescript
interface KBGap {
  id: string;
  query: string;
  best_similarity: number;
  occurrence_count: number;
  first_seen: Date;
  last_seen: Date;
  suggested_topic: string;   // Claude-generated topic suggestion
  status: "open" | "addressed" | "ignored";
}
```

When a gap is detected:
1. Log the query and similarity score
2. Increment `occurrence_count` if a similar gap exists (similarity > 0.85)
3. If `occurrence_count` >= 3 within a week, flag for CS Bot Manager review

### Quality Tracking

After each RAG response, present the user with thumbs up/down:
- Thumbs up: increment `helpful_count` on the source chunks
- Thumbs down: log the query, response, and chunks used as a `KBQualityIssue`
  - Claude analyzes: was the retrieval bad (wrong chunks) or the generation bad (right chunks, wrong answer)?
  - Route to CS Bot Manager for review

### Weekly Report to CS Bot Manager

```markdown
## Knowledge Base Health — Week of 2026-04-01

### Coverage
- Total queries: 342
- Answered from KB: 289 (84.5%)
- No match (gaps): 53 (15.5%)

### Quality
- Thumbs up: 251 (86.9% of answered)
- Thumbs down: 38 (13.1% of answered)

### Top 5 Coverage Gaps (new this week)
1. "How to set up Aircall integration" (12 queries)
2. "Can I customize the SDR scorecard?" (8 queries)
3. "Bulk delete calls" (7 queries)
4. "WhatsApp integration" (6 queries)
5. "Export RDV to Google Calendar" (5 queries)

### Recommended Actions
- Create article: "Aircall Integration Setup Guide" (addresses 12 queries)
- Update FAQ: add scorecard customization question (8 queries)
- Document known limitation: bulk delete not yet available (7 queries)
```

## Knowledge Base Maintenance

### Auto-Refresh on New Release
When the `changelog-generator` produces a new release:
1. Re-index the changelog entry as a new KB document
2. Scan for new/modified docs in the `docs/` directory
3. Re-embed only changed chunks (compare content hash)
4. Update `last_updated` on affected documents

### Expiry Policy
- Chunks from documents not updated in 6 months are marked `active: false`
- They remain in the database but are excluded from search results
- CS Bot Manager receives monthly list of expiring documents for review

### Manual Controls
- **Pin article**: CS Bot Manager can mark specific chunks as `pinned: true`, which adds a +0.15 boost to their re-ranking score (ensures they surface for relevant queries)
- **Unpin article**: remove the boost
- **Force re-index**: trigger full re-indexing of all documents (useful after bulk edits)
- **Delete document**: remove all chunks for a document and mark as inactive

## Edge Cases

- **Conflicting information**: if two chunks contradict each other, prefer the more recently updated one. Flag the conflict for CS Bot Manager to resolve.
- **Multi-language queries**: if user asks in English but best chunks are in French (or vice versa), translate the answer to the user's language and cite the original source.
- **Very long user queries**: truncate to 200 tokens for embedding (longer queries don't improve retrieval and may add noise).
- **Code-heavy questions**: for API documentation queries, ensure code blocks are preserved intact in chunks (don't split mid-code-block).
- **Stale known issues**: if a known issue references a bug that has been fixed (linked ticket resolved), auto-archive the KB entry and note the fix version.
