#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# 🔄 AGENTS SKILLS SYNC
# ──────────────────────────────────────────────────────────────────────────────
# Validates skills and syncs metadata to AGENTS.md and active profiles.
# ──────────────────────────────────────────────────────────────────────────────

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_DIR="$REPO_ROOT/.agents"
SKILLS_DIR="$AGENT_DIR/skills"
AGENTS_MD="$REPO_ROOT/AGENTS.md"

# 🎨 Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# 🎭 Icons
ICON_SYNC="🔄"
ICON_SUCCESS="✅"
ICON_SKILL="🛠️"
ICON_ERROR="❌"

# Flags
SYNC_ALL=false
SYNC_OPENCODE=false
SYNC_CLAUDE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all) SYNC_ALL=true; shift ;;
    --opencode) SYNC_OPENCODE=true; shift ;;
    --claude) SYNC_CLAUDE=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Auto-detect
if [ "$SYNC_ALL" = false ] && [ "$SYNC_OPENCODE" = false ] && [ "$SYNC_CLAUDE" = false ]; then
    [ -d "$REPO_ROOT/.opencode" ] && SYNC_OPENCODE=true
    [ -d "$REPO_ROOT/.claude" ] && SYNC_CLAUDE=true
fi

echo -e "${MAGENTA}${BOLD}${ICON_SYNC} Syncing Skills...${NC}"

# Extract field helper
extract_field() {
    local file="$1"
    local field="$2"
    head -n 20 "$file" | grep "^$field:" | head -n 1 | cut -d ':' -f 2- | sed 's/^[[:space:]]*//; s/^[">][[:space:]]*//'
}

# Validation
validate_skill() {
    local skill_md="$1"
    local dir_name=$(basename "$(dirname "$skill_md")")
    local name=$(extract_field "$skill_md" "name")
    local desc=$(extract_field "$skill_md" "description")

    if [ "$name" != "$dir_name" ]; then
        echo -e " ${RED}${ICON_ERROR} Name mismatch: '$name' != '$dir_name'${NC}"
        return 1
    fi
    if [[ ! "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
        echo -e " ${RED}${ICON_ERROR} Invalid format: '$name' (use lowercase-hyphens)${NC}"
        return 1
    fi
    return 0
}

TEMP_TABLE=$(mktemp)
echo "| Skill | Description | URL |" > "$TEMP_TABLE"
echo "|-------|-------------|-----|" >> "$TEMP_TABLE"

for skill_md in $(find "$SKILLS_DIR" -name "SKILL.md" | sort); do
    if ! validate_skill "$skill_md"; then continue; fi
    
    skill_name=$(extract_field "$skill_md" "name")
    skill_desc=$(extract_field "$skill_md" "description" | head -n 1)
    skill_rel_path=".agents/skills/$(basename "$(dirname "$skill_md")")/SKILL.md"
    
    echo "| \`$skill_name\` | $skill_desc | [$skill_rel_path]($skill_rel_path) |" >> "$TEMP_TABLE"
    echo -e " ${DIM}Indexing:${NC} ${CYAN}$skill_name${NC}"
done

# Update AGENTS.md
echo -e " ${BLUE}Updating AGENTS.md...${NC}"
NEW_AGENTS=$(mktemp)
IN_TABLE=0
while IFS= read -r line; do
    if [[ "$line" == "## Available Skills" ]]; then
        echo "$line" >> "$NEW_AGENTS"
        echo "" >> "$NEW_AGENTS"
        cat "$TEMP_TABLE" >> "$NEW_AGENTS"
        IN_TABLE=1
        continue
    fi
    if [ $IN_TABLE -eq 1 ]; then
        if [[ "$line" =~ ^\| ]] || [[ "$line" == "" ]]; then continue; else IN_TABLE=0; fi
    fi
    echo "$line" >> "$NEW_AGENTS"
done < "$AGENTS_MD"
mv "$NEW_AGENTS" "$AGENTS_MD"

# Sync OpenCode
if [ "$SYNC_OPENCODE" = true ]; then
    echo -e " ${BLUE}Syncing .opencode/...${NC}"
    # Redo symlinks
    for skill in "$SKILLS_DIR"/*/; do
        [ -d "$skill" ] && ln -sf "../../.agents/skills/$(basename "$skill")" "$REPO_ROOT/.opencode/skills/$(basename "$skill")"
    done
fi

rm "$TEMP_TABLE"
echo -e "\n${GREEN}${BOLD}${ICON_SUCCESS} Sync complete!${NC}\n"
