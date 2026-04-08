---
name: linkedin-publishing
description: LinkedIn API integration — post publishing, scheduling, engagement analytics
slug: linkedin-publishing
version: 0.1.0
tags:
  - marketing
  - linkedin
  - social-media
---

# LinkedIn Publishing

Integration with the LinkedIn API v2 for content publishing, media uploads, and engagement analytics on Scale Group company pages and personal profiles.

## API Reference

### Base URL

```
https://api.linkedin.com/v2
```

For media asset registration:
```
https://api.linkedin.com/v2/assets?action=registerUpload
```

### Authentication

OAuth 2.0 Bearer token:

```
Authorization: Bearer <access_token>
```

**Required scopes:**

| Scope | Purpose |
|---|---|
| `w_member_social` | Post on behalf of authenticated member |
| `r_organization_social` | Read company page posts and analytics |
| `w_organization_social` | Post on company pages |
| `r_organization_followers` | Read follower data and demographics |
| `rw_organization_admin` | Manage company pages (admin actions) |

**Token refresh:** Access tokens expire after 60 days. Refresh tokens last 365 days. Implement automatic refresh:

```http
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=<refresh_token>&client_id=<client_id>&client_secret=<client_secret>
```

### Rate Limits

- 100 requests per day per member for posting (across all apps)
- 100,000 requests per day for organization endpoints
- Share creation: max 25 shares per day per member, 100 per day per organization
- Implement retry with exponential backoff on 429 responses

---

## Endpoints

### POST /ugcPosts — Create a Post

#### Text Post

```http
POST /v2/ugcPosts
Authorization: Bearer <access_token>
Content-Type: application/json
X-Restli-Protocol-Version: 2.0.0

{
  "author": "urn:li:organization:12345678",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Scale Group just closed a record Q1! Our team grew by 30% and we're looking for talented people to join us.\n\n3 key learnings from this quarter:\n1. Focus on customer retention drove 95% renewal rate\n2. Investing in team training (ScaleAcademy) boosted productivity by 20%\n3. Cross-selling between entities generated 15% incremental revenue\n\n#ScaleGroup #Growth #B2B #Startup"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

#### Image Post

**Step 1: Register the upload.**

```http
POST /v2/assets?action=registerUpload
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "registerUploadRequest": {
    "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
    "owner": "urn:li:organization:12345678",
    "serviceRelationships": [
      {
        "relationshipType": "OWNER",
        "identifier": "urn:li:userGeneratedContent"
      }
    ]
  }
}
```

**Response:**
```json
{
  "value": {
    "uploadMechanism": {
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
        "uploadUrl": "https://api.linkedin.com/mediaUpload/...",
        "headers": {
          "media-type-family": "STILLIMAGE"
        }
      }
    },
    "mediaArtifact": "urn:li:digitalmediaAsset:D4E10AQE...",
    "asset": "urn:li:digitalmediaAsset:D4E10AQE..."
  }
}
```

**Step 2: Upload the binary file.**

```http
PUT <uploadUrl from step 1>
Authorization: Bearer <access_token>
Content-Type: image/png

<binary image data>
```

**Step 3: Create the post with the uploaded asset.**

```http
POST /v2/ugcPosts
Authorization: Bearer <access_token>
Content-Type: application/json
X-Restli-Protocol-Version: 2.0.0

{
  "author": "urn:li:organization:12345678",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Our latest case study: How we helped a B2B SaaS company scale from 1M to 5M ARR in 18 months.\n\nFull story in the comments.\n\n#CaseStudy #B2B #SaaS #Growth"
      },
      "shareMediaCategory": "IMAGE",
      "media": [
        {
          "status": "READY",
          "media": "urn:li:digitalmediaAsset:D4E10AQE...",
          "title": {
            "text": "Case Study: SaaS Scaling"
          },
          "description": {
            "text": "From 1M to 5M ARR in 18 months"
          }
        }
      ]
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

#### Document/Carousel Post

Same upload flow as images but with:
- Recipe: `urn:li:digitalmediaRecipe:feedshare-document`
- Content-Type for upload: `application/pdf`
- `shareMediaCategory`: `NATIVE_DOCUMENT`

#### Article Share

```json
{
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Great read on the future of B2B sales in France."
      },
      "shareMediaCategory": "ARTICLE",
      "media": [
        {
          "status": "READY",
          "originalUrl": "https://blog.scalegroup.fr/future-b2b-sales",
          "title": { "text": "The Future of B2B Sales in France" },
          "description": { "text": "Key trends for 2026 and beyond" }
        }
      ]
    }
  }
}
```

### GET /organizationalEntityShareStatistics

Retrieve analytics for a company page's posts.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `q` | string | `organizationalEntity` |
| `organizationalEntity` | URN | e.g., `urn:li:organization:12345678` |
| `timeIntervals.timeGranularityType` | string | `DAY` or `MONTH` |
| `timeIntervals.timeRange.start` | long | Epoch milliseconds |
| `timeIntervals.timeRange.end` | long | Epoch milliseconds |
| `shares[]` | URN | Specific post URNs (optional) |

**Request:**
```http
GET /v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:12345678&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=1709251200000&timeIntervals.timeRange.end=1711929600000
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "elements": [
    {
      "totalShareStatistics": {
        "shareCount": 12,
        "uniqueImpressionsCount": 45000,
        "clickCount": 1200,
        "likeCount": 890,
        "commentCount": 156,
        "shareCount": 78,
        "engagementRate": 0.047,
        "impressionCount": 62000
      },
      "timeRange": {
        "start": 1709251200000,
        "end": 1711929600000
      }
    }
  ]
}
```

### GET /socialActions/:urn/likes

Get likes on a specific post.

```http
GET /v2/socialActions/urn:li:share:12345/likes
Authorization: Bearer <access_token>
```

### GET /socialActions/:urn/comments

Get comments on a specific post.

```http
GET /v2/socialActions/urn:li:share:12345/comments
Authorization: Bearer <access_token>
```

---

## Content Strategy

### Content Pillars for Scale Group

| Pillar | Share of Content | Topics |
|---|---|---|
| Thought Leadership | 30% | Industry trends, CEO insights, market analysis |
| Case Studies & Results | 25% | Client success stories, metrics, before/after |
| Team & Culture | 20% | New hires, team events, behind the scenes, ScaleAcademy |
| Job Openings | 15% | Open positions, employee testimonials, EVP |
| Product/Service Updates | 10% | New offerings, partnerships, company news |

### Optimal Posting Schedule

| Day | Time (CET) | Rationale |
|---|---|---|
| Tuesday | 8:00-9:30 AM | High B2B LinkedIn activity after Monday inbox clearing |
| Wednesday | 8:00-9:30 AM | Mid-week peak engagement |
| Thursday | 8:00-9:30 AM | Strong pre-weekend engagement |
| Tuesday | 12:00-1:00 PM | Lunch break browsing (secondary slot) |

**Frequency:** 3-4 posts per week on the company page. No more than 1 post per day. Avoid weekends and Mondays for company page posts (lower B2B engagement).

### Post Formatting Best Practices

- **Hook in first line:** First 2 lines are visible before "see more". Make them compelling.
- **Line breaks:** Use short paragraphs (1-2 sentences). Add blank lines between sections.
- **Emojis:** Use sparingly — 1-2 per post maximum for professional B2B audience.
- **Hashtags:** 3-5 hashtags at the end. Mix broad (#B2B, #SaaS) with niche (#FrenchTech, #ScaleGroup).
- **Character limit:** 3,000 characters max. Optimal length: 1,200-1,800 characters.
- **CTA:** End with a question or call-to-action to drive comments.
- **Carousels:** 5-10 slides. First slide = bold title/hook. Last slide = CTA. Use PDF format.

---

## Workflows

### 1. Editorial Calendar Management

**Trigger:** Every Monday at 9:00 AM CET (plan the week).

**Steps:**

1. Review the content pillar distribution for the current month:
   - Count posts published per pillar this month
   - Identify under-represented pillars
2. Check upcoming company events, product launches, hiring needs.
3. Draft 3-4 posts for the week:
   - Assign each to a pillar
   - Assign day and time slot
   - Draft copy (text + visual brief)
4. Submit drafts for CMO review.
5. After approval, prepare posts:
   - Finalize copy
   - Upload visuals / create carousels
   - Schedule in the publication queue

### 2. Post Publishing Workflow

**Trigger:** At scheduled publication time.

**Steps:**

1. If the post includes media:
   a. Register the upload via `POST /assets?action=registerUpload`
   b. Upload the binary to the returned URL
   c. Wait for asset processing (poll or wait 30 seconds)
2. Create the post via `POST /ugcPosts` with the appropriate content structure.
3. Verify the post was published by checking the response (status 201, `lifecycleState` = `PUBLISHED`).
4. Record the post URN for analytics tracking.
5. In the first 30 minutes after posting:
   - Respond to any early comments to boost engagement
   - Ask 2-3 team members to engage (like + thoughtful comment) to trigger algorithm distribution

### 3. Engagement Analytics Tracking

**Trigger:** Daily at 6:00 PM CET for same-day posts; weekly on Friday for full-week analysis.

**Steps:**

1. For each post published in the tracking window, call:
   - `GET /organizationalEntityShareStatistics` with the post URN
   - `GET /socialActions/:urn/likes` for like count
   - `GET /socialActions/:urn/comments` for comment count
2. Calculate per-post metrics:
   - Impressions
   - Engagement rate: (likes + comments + shares + clicks) / impressions
   - Click-through rate: clicks / impressions
3. Compute weekly aggregates:
   - Average engagement rate (benchmark: > 3% is good for B2B)
   - Top-performing post and its characteristics
   - Worst-performing post and diagnosis
4. Compare against benchmarks:
   - Company page average engagement rate target: 4%+
   - Impressions growth: +10% month-over-month
5. Generate weekly content performance report.

### 4. A/B Testing Framework

**Methodology:**

1. Identify the variable to test:
   - Hook style (question vs. statement vs. statistic)
   - Post format (text vs. carousel vs. image)
   - Posting time (morning vs. lunch)
   - CTA type (question vs. link vs. none)
2. Publish variant A on Tuesday, variant B on Thursday (same pillar, similar content).
3. Measure after 72 hours (LinkedIn post lifecycle is ~72h):
   - Primary metric: engagement rate
   - Secondary metric: impressions
4. Record results and apply winning approach to next posts.
5. Run each test for at least 4 weeks (8 posts) before drawing conclusions.

---

## Error Handling

| HTTP Status | Meaning | Action |
|---|---|---|
| 400 | Bad request (invalid URN, malformed content) | Validate post structure before sending |
| 401 | Token expired | Trigger OAuth refresh flow |
| 403 | Insufficient permissions / scope | Check app scopes; verify org admin access |
| 404 | Resource not found (deleted post, invalid org) | Verify URN format and existence |
| 409 | Conflict (duplicate post) | LinkedIn deduplicates identical content; modify text slightly |
| 422 | Content policy violation | Review post for prohibited content; adjust and retry |
| 429 | Rate limited | Back off; check daily posting quota |
| 500+ | Server error | Retry with exponential backoff up to 3 times |

---

## Security Considerations

- **Token storage.** Store OAuth tokens encrypted. Never expose client_secret in frontend code.
- **Posting approval.** All posts must be approved by CMO or designated content manager before API publication. Never auto-publish without human review.
- **Brand safety.** Implement a pre-publish checklist: no confidential financials, no competitor disparagement, compliance with LinkedIn's professional community policies.
- **Access control.** Limit write access to the LinkedIn API to the Content Manager role only. Analytics read access can be broader.
- **Audit trail.** Log every post created via API: timestamp, author, content hash, post URN. Retain for 2 years.
- **Personal vs. company.** When posting on behalf of team members' personal profiles, always obtain explicit written consent and approval of exact content.
