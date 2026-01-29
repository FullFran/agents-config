#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# 🤖 AGENTS CONFIG SETUP
# Source of truth: .agents/ + AGENTS.md
# ──────────────────────────────────────────────────────────────────────────────
# This script configures local agent profiles using symlinks to ensure 
# a single source of truth across all AI assistants.
# ──────────────────────────────────────────────────────────────────────────────

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_DIR="$REPO_ROOT/.agents"
SKILLS_DIR="$AGENT_DIR/skills"

# 🎨 Colors & Formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# 🎭 Icons
ICON_SUCCESS="✨"
ICON_WORKING="⚙️ "
ICON_AGENT="🤖"
ICON_FILE="📄"
ICON_LINK="🔗"
ICON_ERROR="❌"

# ──────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ──────────────────────────────────────────────────────────────────────────────

print_banner() {
    clear
    echo -e "${MAGENTA}${BOLD}┌──────────────────────────────────────────────────────────┐${NC}"
    echo -e "${MAGENTA}${BOLD}│                                                          │${NC}"
    echo -e "${MAGENTA}${BOLD}│   ${NC}${BOLD}AGENTS CONFIG SETUP${NC}${MAGENTA}${BOLD}                                    │${NC}"
    echo -e "${MAGENTA}${BOLD}│   ${NC}${DIM}The canon way to sync your AI brain${NC}${MAGENTA}${BOLD}                    │${NC}"
    echo -e "${MAGENTA}${BOLD}│                                                          │${NC}"
    echo -e "${MAGENTA}${BOLD}└──────────────────────────────────────────────────────────┘${NC}"
    echo -e " ${DIM}Root:${NC} ${CYAN}$REPO_ROOT${NC}"
    echo -e " ${DIM}Source:${NC} ${GREEN}.agents/${NC} ${DIM}+${NC} ${GREEN}AGENTS.md${NC}"
    echo ""
}

print_status() {
    local color=$1
    local icon=$2
    local msg=$3
    echo -e " ${color}${icon}${NC} ${msg}"
}

# ──────────────────────────────────────────────────────────────────────────────
# Agent Setups
# ──────────────────────────────────────────────────────────────────────────────

setup_opencode() {
    print_status "$BLUE" "$ICON_WORKING" "Configuring ${BOLD}OpenCode TUI${NC}..."
    
    # Create directories
    mkdir -p "$REPO_ROOT/.opencode/skills" "$REPO_ROOT/.opencode/agents" "$REPO_ROOT/.opencode/commands"
    
    # Link Skills
    for skill in "$SKILLS_DIR"/*/; do
        if [ -d "$skill" ]; then
            skill_name=$(basename "$skill")
            ln -sf "../../.agents/skills/$skill_name" "$REPO_ROOT/.opencode/skills/$skill_name"
        fi
    done

    # Link Personas
    for agent in "$AGENT_DIR/agents"/*.md; do
        if [ -f "$agent" ]; then
            agent_name=$(basename "$agent")
            ln -sf "../../.agents/agents/$agent_name" "$REPO_ROOT/.opencode/agents/$agent_name"
        fi
    done

    # Link Commands
    for wf in "$AGENT_DIR/workflows"/*.md; do
        if [ -f "$wf" ]; then
            wf_name=$(basename "$wf")
            ln -sf "../../.agents/workflows/$wf_name" "$REPO_ROOT/.opencode/commands/$wf_name"
        fi
    done
    
    # opencode.json
    if [ ! -f "$REPO_ROOT/opencode.json" ]; then
        cat > "$REPO_ROOT/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "AGENTS.md",
    ".agents/rules/*.md"
  ],
  "permission": {
    "skill": { "*": "allow" },
    "bash": {
      "*": "allow",
      "git commit *": "ask",
      "git push *": "ask",
      "git rebase *": "ask",
      "git reset --hard *": "ask"
    },
    "read": {
      "*": "allow",
      "*.env": "deny",
      "**/secrets/**": "deny"
    }
  }
}
EOF
    fi
    print_status "$GREEN" "$ICON_SUCCESS" "OpenCode ready (.opencode/)"
}

setup_claude() {
    print_status "$BLUE" "$ICON_WORKING" "Configuring ${BOLD}Claude Code${NC}..."
    mkdir -p "$REPO_ROOT/.claude"
    ln -sf "../.agents/skills" "$REPO_ROOT/.claude/skills"
    ln -sf "AGENTS.md" "$REPO_ROOT/CLAUDE.md"
    print_status "$GREEN" "$ICON_SUCCESS" "Claude ready (CLAUDE.md)"
}

setup_copilot() {
    print_status "$BLUE" "$ICON_WORKING" "Configuring ${BOLD}GitHub Copilot${NC}..."
    mkdir -p "$REPO_ROOT/.github"
    ln -sf "../AGENTS.md" "$REPO_ROOT/.github/copilot-instructions.md"
    print_status "$GREEN" "$ICON_SUCCESS" "Copilot ready (.github/copilot-instructions.md)"
}

setup_cursor() {
    print_status "$BLUE" "$ICON_WORKING" "Configuring ${BOLD}Cursor IDE${NC}..."
    ln -sf "AGENTS.md" "$REPO_ROOT/.cursorrules"
    print_status "$GREEN" "$ICON_SUCCESS" "Cursor ready (.cursorrules)"
}

setup_antigravity() {
    print_status "$BLUE" "$ICON_WORKING" "Configuring ${BOLD}Antigravity IDE${NC}..."
    ln -sf "AGENTS.md" "$REPO_ROOT/GEMINI.md"
    # Antigravity uses .agents/ natively, no extra symlinks needed for personas in rules
    # as per new 'canon' structure. Mention them with @name.
    print_status "$GREEN" "$ICON_SUCCESS" "Antigravity ready (GEMINI.md)"
}

setup_all() {
    setup_opencode
    setup_claude
    setup_copilot
    setup_cursor
    setup_antigravity
}

# ──────────────────────────────────────────────────────────────────────────────
# Main Logic
# ──────────────────────────────────────────────────────────────────────────────

# Check Source of Truth
if [ ! -f "$REPO_ROOT/AGENTS.md" ]; then
    print_status "$RED" "$ICON_ERROR" "AGENTS.md not found! This is the source of truth."
    exit 1
fi

# Argument Handling
if [ $# -gt 0 ]; then
    case "$1" in
        --all|-a) setup_all ;;
        --opencode) setup_opencode ;;
        --claude) setup_claude ;;
        --copilot) setup_copilot ;;
        --cursor) setup_cursor ;;
        --antigravity|--gemini) setup_antigravity ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options: --all, --opencode, --claude, --copilot, --cursor, --antigravity"
            exit 0
            ;;
        *)
            print_status "$RED" "$ICON_ERROR" "Unknown option: $1"
            exit 1
            ;;
    esac
    echo -e "\n${GREEN}${BOLD}${ICON_SUCCESS} Done!${NC}"
    exit 0
fi

# Interactive Mode (Modern Feel)
print_banner

echo -e "${BOLD}Choose your agents:${NC}"
echo -e " ${CYAN}1)${NC} OpenCode TUI       ${DIM}(.opencode/)${NC}"
echo -e " ${CYAN}2)${NC} Claude Code       ${DIM}(CLAUDE.md)${NC}"
echo -e " ${CYAN}3)${NC} GitHub Copilot     ${DIM}(.github/)${NC}"
echo -e " ${CYAN}4)${NC} Cursor IDE         ${DIM}(.cursorrules)${NC}"
echo -e " ${CYAN}5)${NC} Antigravity        ${DIM}(GEMINI.md)${NC}"
echo -e " ${CYAN}a)${NC} ${BOLD}Configure All${NC}"
echo -e " ${CYAN}q)${NC} Quit"
echo ""

read -p "$(echo -e ${MAGENTA}${BOLD}❯ ${NC})" choice

case "$choice" in
    1) setup_opencode ;;
    2) setup_claude ;;
    3) setup_copilot ;;
    4) setup_cursor ;;
    5) setup_antigravity ;;
    a|A) setup_all ;;
    q|Q) exit 0 ;;
    *) print_status "$RED" "$ICON_ERROR" "Invalid choice"; exit 1 ;;
esac

echo -e "\n${GREEN}${BOLD}${ICON_SUCCESS} Setup complete!${NC} ${DIM}Restart your agent to see changes.${NC}\n"
