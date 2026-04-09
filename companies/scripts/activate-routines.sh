#!/usr/bin/env bash
# Activate all routines (recurring tasks) for Scale Group companies
# Usage: ./activate-routines.sh [company-slug]

set -euo pipefail

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:4242}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY:?Set PAPERCLIP_API_KEY env var}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPANIES_DIR="$(dirname "$SCRIPT_DIR")"

create_routine() {
  local company_id="$1"
  local task_dir="$2"
  local agent_slug="$3"

  local task_file="$task_dir/TASK.md"
  if [ ! -f "$task_file" ]; then
    return
  fi

  local task_name=$(sed -n '/^---$/,/^---$/{ /^name:/{ s/^name: *//; p; } }' "$task_file" | head -1)
  local task_slug=$(basename "$task_dir")

  # Extract schedule from frontmatter
  local timezone=$(sed -n '/timezone:/{ s/.*timezone: *//; p; }' "$task_file" | head -1)
  local hour=$(sed -n '/hour:/{ s/.*hour: *//; p; }' "$task_file" | head -1)
  local minute=$(sed -n '/minute:/{ s/.*minute: *//; p; }' "$task_file" | head -1)
  local frequency=$(sed -n '/frequency:/{ s/.*frequency: *//; p; }' "$task_file" | head -1)

  timezone="${timezone:-Europe/Paris}"
  hour="${hour:-9}"
  minute="${minute:-0}"
  frequency="${frequency:-daily}"

  # Build cron expression
  local cron=""
  case "$frequency" in
    daily)    cron="$minute $hour * * *" ;;
    weekly)
      local weekday=$(sed -n '/- monday/{ s/.*//; p; }' "$task_file" | head -1)
      if [ -n "$weekday" ]; then
        case "$(sed -n '/weekdays:/,/time:/{/- /{ s/.*- *//; p; }}' "$task_file" | head -1)" in
          monday)    cron="$minute $hour * * 1" ;;
          tuesday)   cron="$minute $hour * * 2" ;;
          wednesday) cron="$minute $hour * * 3" ;;
          thursday)  cron="$minute $hour * * 4" ;;
          friday)    cron="$minute $hour * * 5" ;;
          *)         cron="$minute $hour * * 1" ;;
        esac
      else
        cron="$minute $hour * * 1"
      fi
      ;;
    monthly)  cron="$minute $hour 1 * *" ;;
    quarterly) cron="$minute $hour 15 1,4,7,10 *" ;;
    *)        cron="$minute $hour * * *" ;;
  esac

  # Extract task body (after second ---)
  local description=$(sed -n '/^---$/,/^---$/!p' "$task_file" | head -5 | tr '\n' ' ')

  echo "  Creating routine: $task_name"
  echo "    Schedule: $cron ($timezone)"
  echo "    Agent: $agent_slug"

  # Find agent ID
  local agent_id=$(curl -sS "$PAPERCLIP_API_URL/api/companies/$company_id/agents" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
agents = data if isinstance(data, list) else data.get('data', [])
for a in agents:
    name = a.get('name','').lower().replace(' ','-')
    if name == '$agent_slug' or a.get('slug','') == '$agent_slug':
        print(a['id']); break
" 2>/dev/null || echo "")

  if [ -z "$agent_id" ]; then
    echo "    Warning: Agent '$agent_slug' not found, skipping"
    return
  fi

  # Create routine
  ROUTINE_RESULT=$(curl -sS -X POST "$PAPERCLIP_API_URL/api/companies/$company_id/routines" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$task_name\",
      \"description\": \"$description\",
      \"agentId\": \"$agent_id\",
      \"status\": \"active\"
    }" 2>&1)

  local routine_id=$(echo "$ROUTINE_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

  if [ -n "$routine_id" ]; then
    # Add schedule trigger
    curl -sS -X POST "$PAPERCLIP_API_URL/api/routines/$routine_id/triggers" \
      -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"type\": \"schedule\",
        \"config\": {
          \"cron\": \"$cron\",
          \"timezone\": \"$timezone\"
        }
      }" > /dev/null 2>&1
    echo "    ✓ Routine created: $routine_id"
  else
    echo "    ✗ Failed to create routine"
  fi
}

# Main
echo "╔══════════════════════════════════════════╗"
echo "║   Scale Group — Activate Routines        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

TARGET="${1:-all}"

if [ "$TARGET" = "all" ]; then
  SLUGS=("scale-group-hq" "scalefast" "scalecall" "scaleacademy" "scalehq")
else
  SLUGS=("$TARGET")
fi

for slug in "${SLUGS[@]}"; do
  company_dir="$COMPANIES_DIR/$slug"
  tasks_dir="$company_dir/tasks"

  if [ ! -d "$tasks_dir" ]; then
    echo "No tasks/ directory for $slug, skipping"
    continue
  fi

  # Get company ID
  company_id=$(curl -sS "$PAPERCLIP_API_URL/api/companies" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
companies = data if isinstance(data, list) else data.get('data', [])
for c in companies:
    if c.get('slug') == '$slug' or '$slug' in c.get('name','').lower().replace(' ','-'):
        print(c['id']); break
" 2>/dev/null || echo "")

  if [ -z "$company_id" ]; then
    echo "Warning: Company '$slug' not found. Import it first."
    continue
  fi

  echo "═══ $slug ═══"

  for task_dir in "$tasks_dir"/*/; do
    if [ -f "$task_dir/TASK.md" ]; then
      agent=$(sed -n '/^assignee:/{ s/^assignee: *//; p; }' "$task_dir/TASK.md" | head -1)
      create_routine "$company_id" "$task_dir" "${agent:-ceo}"
    fi
  done
  echo ""
done

echo "Done! All routines activated."
echo "Check status: curl $PAPERCLIP_API_URL/api/companies/<id>/routines"
