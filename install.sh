#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
REPO_URL="https://github.com/riadafridishibly/raycast-tmetric-extension.git"
INSTALL_DIR="${HOME}/.local/share/raycast-extensions/tmetric"
BRANCH="dev"
MIN_NODE_VERSION=18
# ──────────────────────────────────────────────────────────────────────────────

# ─── Colors ───────────────────────────────────────────────────────────────────
if [ -t 1 ] && command -v tput >/dev/null 2>&1; then
    BOLD=$(tput bold)
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    CYAN=$(tput setaf 6)
    RESET=$(tput sgr0)
else
    BOLD="" RED="" GREEN="" YELLOW="" CYAN="" RESET=""
fi
# ──────────────────────────────────────────────────────────────────────────────

info()    { printf '%s\n' "${BOLD}${CYAN}info${RESET}  $1"; }
ok()      { printf '%s\n' "${BOLD}${GREEN}  ok${RESET}  $1"; }
warn()    { printf '%s\n' "${BOLD}${YELLOW}warn${RESET}  $1"; }
err()     { printf '%s\n' "${BOLD}${RED} err${RESET}  $1" >&2; }
die()     { err "$1"; exit 1; }

usage() {
    cat <<EOF
${BOLD}TMetric Raycast Extension Installer${RESET}

Usage: $0 [OPTIONS]

Options:
    --uninstall    Remove the extension and all installed files
    --help         Show this help message

Install:
    curl -fsSL <raw-url>/install.sh | bash

Uninstall:
    curl -fsSL <raw-url>/install.sh | bash -s -- --uninstall
EOF
}

# ─── Uninstall ────────────────────────────────────────────────────────────────
do_uninstall() {
    info "Uninstalling TMetric extension..."

    if [ ! -d "$INSTALL_DIR" ]; then
        die "Nothing to uninstall — ${INSTALL_DIR} does not exist."
    fi

    rm -rf "$INSTALL_DIR"
    ok "Removed ${INSTALL_DIR}"

    # Clean up parent dir if empty
    PARENT_DIR=$(dirname "$INSTALL_DIR")
    if [ -d "$PARENT_DIR" ] && [ -z "$(ls -A "$PARENT_DIR")" ]; then
        rmdir "$PARENT_DIR"
        ok "Removed empty directory ${PARENT_DIR}"
    fi

    printf '\n'
    info "${YELLOW}Remember to also remove the extension from Raycast:${RESET}"
    info "  Raycast → Extensions → TMetric Timer → ✕ Remove"
    printf '\n'
    ok "Uninstall complete."
    exit 0
}

# ─── Preflight checks ────────────────────────────────────────────────────────
check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        die "'$1' is required but not installed. $2"
    fi
}

check_node_version() {
    local node_ver
    node_ver=$(node -v | sed 's/^v//' | cut -d. -f1)
    if [ "$node_ver" -lt "$MIN_NODE_VERSION" ]; then
        die "Node.js >= ${MIN_NODE_VERSION} is required (found v${node_ver}). Update at https://nodejs.org"
    fi
}

preflight() {
    check_command "git"  "Install it via: xcode-select --install"
    check_command "node" "Install it from https://nodejs.org"
    check_command "npm"  "npm should come with Node.js — reinstall Node from https://nodejs.org"
    check_node_version
}

# ─── Install / Rebuild ───────────────────────────────────────────────────────
do_install() {
    preflight

    if [ -d "$INSTALL_DIR/.git" ]; then
        info "Existing installation found — updating..."

        git -C "$INSTALL_DIR" fetch origin "$BRANCH" --quiet \
            || die "Failed to fetch updates. Check your network connection."

        LOCAL=$(git -C "$INSTALL_DIR" rev-parse HEAD)
        REMOTE=$(git -C "$INSTALL_DIR" rev-parse "origin/${BRANCH}")

        if [ "$LOCAL" = "$REMOTE" ]; then
            info "Already up to date (${LOCAL:0:7})."
        else
            git -C "$INSTALL_DIR" reset --hard "origin/${BRANCH}" --quiet \
                || die "Failed to update repository."
            ok "Updated to $(git -C "$INSTALL_DIR" rev-parse --short HEAD)"
        fi
    else
        if [ -e "$INSTALL_DIR" ]; then
            die "${INSTALL_DIR} exists but is not a git repo. Remove it manually or run with --uninstall first."
        fi

        info "Cloning repository..."
        mkdir -p "$(dirname "$INSTALL_DIR")"
        git clone --branch "$BRANCH" --single-branch --quiet "$REPO_URL" "$INSTALL_DIR" \
            || die "Failed to clone repository. Check the URL and your network connection."
        ok "Cloned to ${INSTALL_DIR}"
    fi

    cd "$INSTALL_DIR"

    info "Installing dependencies..."
    npm ci --silent 2>&1 \
        || die "npm ci failed. Try deleting ${INSTALL_DIR}/node_modules and re-running."
    ok "Dependencies installed."

    info "Building extension..."
    npx ray build -e dist 2>&1 \
        || die "Build failed. Check the output above for TypeScript or bundling errors."
    ok "Build succeeded."

    print_success
}

# ─── Success message ─────────────────────────────────────────────────────────
print_success() {
    printf '\n'
    printf '%s\n' "${BOLD}${GREEN}✓ TMetric extension is ready!${RESET}"
    printf '\n'
    printf '%s\n' "${BOLD}Import into Raycast:${RESET}"
    printf '%s\n' ""
    printf '%s\n' "  ${CYAN}1.${RESET} Open ${BOLD}Raycast${RESET}"
    printf '%s\n' "  ${CYAN}2.${RESET} Go to ${BOLD}Extensions${RESET}  (⌘ ,  → Extensions)"
    printf '%s\n' "  ${CYAN}3.${RESET} Click ${BOLD}+${RESET} at the top-left → ${BOLD}Add Script Directory${RESET}"
    printf '%s\n' "  ${CYAN}4.${RESET} Select this folder:"
    printf '%s\n' ""
    printf '%s\n' "     ${BOLD}${YELLOW}${INSTALL_DIR}${RESET}"
    printf '%s\n' ""
    printf '%s\n' "  ${CYAN}5.${RESET} The extension will appear as ${BOLD}TMetric Timer${RESET} in Raycast"
    printf '\n'
    printf '%s\n' "${BOLD}To update later:${RESET}  re-run this script"
    printf '%s\n' "${BOLD}To uninstall:${RESET}     re-run with ${CYAN}--uninstall${RESET}"
    printf '\n'
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
    case "${1:-}" in
        --uninstall) do_uninstall ;;
        --help|-h)   usage ;;
        "")          do_install ;;
        *)           die "Unknown option: $1. Use --help for usage." ;;
    esac
}

main "$@"
