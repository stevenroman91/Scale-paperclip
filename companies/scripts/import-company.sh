#!/usr/bin/env bash
# Import a single company package into Paperclip
# Usage: ./import-company.sh <company-slug>
# Example: ./import-company.sh scale-group-hq

set -euo pipefail

COMPANY_SLUG="${1:?Usage: $0 <company-slug>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPANIES_DIR="$(dirname "$SCRIPT_DIR")"
COMPANY_DIR="$COMPANIES_DIR/$COMPANY_SLUG"

# Paperclip API config
PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:4242}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY:?Set PAPERCLIP_API_KEY env var}"

if [ ! -d "$COMPANY_DIR" ]; then
  echo "Error: Company directory not found: $COMPANY_DIR"
  echo "Available companies:"
  ls -1 "$COMPANIES_DIR" | grep -v scripts | grep -v README
  exit 1
fi

echo "=== Importing $COMPANY_SLUG ==="
echo "Directory: $COMPANY_DIR"
echo "API: $PAPERCLIP_API_URL"
echo ""

# Step 1: Import the company package
echo "[1/5] Importing company package..."
IMPORT_RESULT=$(curl -sS -X POST "$PAPERCLIP_API_URL/api/companies/import" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"source\": \"$COMPANY_DIR\",
    \"mode\": \"new_company\"
  }" 2>&1) || {
    # Fallback: try the company-scoped import route
    echo "  Trying alternative import route..."

    # First create the company
    echo "[1/5] Creating company..."
    COMPANY_NAME=$(grep "^name:" "$COMPANY_DIR/COMPANY.md" | head -1 | sed 's/^name: *//')
    COMPANY_DESC=$(grep "^description:" "$COMPANY_DIR/COMPANY.md" | head -1 | sed 's/^description: *//')

    COMPANY_RESULT=$(curl -sS -X POST "$PAPERCLIP_API_URL/api/companies" \
      -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"$COMPANY_NAME\",
        \"description\": \"$COMPANY_DESC\",
        \"slug\": \"$COMPANY_SLUG\"
      }")

    COMPANY_ID=$(echo "$COMPANY_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

    if [ -z "$COMPANY_ID" ]; then
      echo "  Error creating company. Response:"
      echo "  $COMPANY_RESULT"
      exit 1
    fi

    echo "  Company created: $COMPANY_ID"
    IMPORT_RESULT="$COMPANY_RESULT"
}

COMPANY_ID=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id', d.get('companyId','')))" 2>/dev/null || echo "")

if [ -z "$COMPANY_ID" ]; then
  echo "  Warning: Could not extract company ID. Full response:"
  echo "  $IMPORT_RESULT"
  echo "  Trying to find company by slug..."

  COMPANY_ID=$(curl -sS "$PAPERCLIP_API_URL/api/companies" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" | \
    python3 -c "import sys,json
companies = json.load(sys.stdin)
for c in (companies if isinstance(companies, list) else companies.get('data',[])):
    if c.get('slug') == '$COMPANY_SLUG' or '$COMPANY_SLUG' in c.get('name','').lower().replace(' ','-'):
        print(c['id']); break" 2>/dev/null || echo "")
fi

if [ -z "$COMPANY_ID" ]; then
  echo "  Error: Could not determine company ID. Please create the company manually."
  exit 1
fi

echo "  Company ID: $COMPANY_ID"

# Step 2: Import skills
echo ""
echo "[2/5] Importing skills..."
SKILLS_DIR="$COMPANY_DIR/skills"
if [ -d "$SKILLS_DIR" ]; then
  for skill_dir in "$SKILLS_DIR"/*/; do
    skill_slug=$(basename "$skill_dir")
    if [ -f "$skill_dir/SKILL.md" ]; then
      echo "  Importing skill: $skill_slug"
      curl -sS -X POST "$PAPERCLIP_API_URL/api/companies/$COMPANY_ID/skills/import" \
        -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"source\": \"$skill_dir\"}" > /dev/null 2>&1 || echo "    Warning: skill import may have failed"
    fi
  done
else
  echo "  No skills directory found"
fi

# Step 3: Create agents
echo ""
echo "[3/5] Creating agents..."
AGENTS_DIR="$COMPANY_DIR/agents"
declare -A AGENT_IDS

if [ -d "$AGENTS_DIR" ]; then
  # First pass: create agents without reportsTo (to get IDs)
  for agent_dir in "$AGENTS_DIR"/*/; do
    agent_slug=$(basename "$agent_dir")
    if [ -f "$agent_dir/AGENTS.md" ]; then
      # Parse YAML frontmatter
      agent_name=$(sed -n '/^---$/,/^---$/{ /^name:/{ s/^name: *//; p; } }' "$agent_dir/AGENTS.md" | head -1)
      agent_title=$(sed -n '/^---$/,/^---$/{ /^title:/{ s/^title: *//; p; } }' "$agent_dir/AGENTS.md" | head -1)
      agent_role=$(sed -n '/^---$/,/^---$/{ /^role:/{ s/^role: *//; p; } }' "$agent_dir/AGENTS.md" | head -1)
      agent_reports=$(sed -n '/^---$/,/^---$/{ /^reportsTo:/{ s/^reportsTo: *//; p; } }' "$agent_dir/AGENTS.md" | head -1)

      # Default role
      if [ -z "$agent_role" ]; then
        agent_role="general"
      fi

      # Extract skills list
      agent_skills=$(sed -n '/^---$/,/^---$/{ /^  - /{ s/^  - *//; p; } }' "$agent_dir/AGENTS.md" | \
        python3 -c "import sys; skills=[l.strip() for l in sys.stdin]; print(','.join(skills))" 2>/dev/null || echo "paperclip")

      echo "  Creating agent: $agent_name ($agent_role)"

      # Build reportsTo
      reports_to_json="null"
      if [ -n "$agent_reports" ] && [ "$agent_reports" != "null" ]; then
        reports_to_id="${AGENT_IDS[$agent_reports]:-}"
        if [ -n "$reports_to_id" ]; then
          reports_to_json="\"$reports_to_id\""
        fi
      fi

      AGENT_RESULT=$(curl -sS -X POST "$PAPERCLIP_API_URL/api/companies/$COMPANY_ID/agents" \
        -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
          \"name\": \"$agent_name\",
          \"title\": \"$agent_title\",
          \"role\": \"$agent_role\",
          \"reportsTo\": $reports_to_json,
          \"adapterType\": \"claude_local\",
          \"adapterConfig\": {
            \"cwd\": \"$(pwd)\"
          }
        }" 2>&1)

      agent_id=$(echo "$AGENT_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

      if [ -n "$agent_id" ]; then
        AGENT_IDS[$agent_slug]="$agent_id"
        echo "    ID: $agent_id"
      else
        echo "    Warning: could not extract agent ID"
      fi
    fi
  done

  # Second pass: update reportsTo for agents that reference others
  echo ""
  echo "  Updating reporting structure..."
  for agent_dir in "$AGENTS_DIR"/*/; do
    agent_slug=$(basename "$agent_dir")
    if [ -f "$agent_dir/AGENTS.md" ]; then
      agent_reports=$(sed -n '/^---$/,/^---$/{ /^reportsTo:/{ s/^reportsTo: *//; p; } }' "$agent_dir/AGENTS.md" | head -1)

      if [ -n "$agent_reports" ] && [ "$agent_reports" != "null" ]; then
        agent_id="${AGENT_IDS[$agent_slug]:-}"
        reports_to_id="${AGENT_IDS[$agent_reports]:-}"

        if [ -n "$agent_id" ] && [ -n "$reports_to_id" ]; then
          curl -sS -X PATCH "$PAPERCLIP_API_URL/api/agents/$agent_id" \
            -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"reportsTo\": \"$reports_to_id\"}" > /dev/null 2>&1
          echo "    $agent_slug → reports to $agent_reports"
        fi
      fi
    fi
  done
else
  echo "  No agents directory found"
fi

# Step 4: Assign skills to agents
echo ""
echo "[4/5] Assigning skills to agents..."
for agent_dir in "$AGENTS_DIR"/*/; do
  agent_slug=$(basename "$agent_dir")
  agent_id="${AGENT_IDS[$agent_slug]:-}"

  if [ -n "$agent_id" ] && [ -f "$agent_dir/AGENTS.md" ]; then
    # Extract skills from frontmatter
    skills_json=$(sed -n '/^skills:$/,/^[a-z]/{/^  - /{ s/^  - *//; p; }}' "$agent_dir/AGENTS.md" | \
      python3 -c "import sys,json; skills=[l.strip() for l in sys.stdin if l.strip()]; print(json.dumps(skills))" 2>/dev/null || echo "[]")

    if [ "$skills_json" != "[]" ]; then
      echo "  $agent_slug: $skills_json"
      curl -sS -X POST "$PAPERCLIP_API_URL/api/agents/$agent_id/skills/sync" \
        -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"desiredSkills\": $skills_json}" > /dev/null 2>&1 || echo "    Warning: skill sync may have failed"
    fi
  fi
done

# Step 5: Summary
echo ""
echo "[5/5] Import complete!"
echo "  Company: $COMPANY_SLUG ($COMPANY_ID)"
echo "  Agents created: ${#AGENT_IDS[@]}"
echo "  Skills imported: $(find "$SKILLS_DIR" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo "Next steps:"
echo "  1. Configure secrets: ./configure-secrets.sh $COMPANY_SLUG"
echo "  2. Activate routines: ./activate-routines.sh $COMPANY_SLUG"
echo "  3. Create initial tasks: ./bootstrap-tasks.sh $COMPANY_SLUG"
