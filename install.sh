#!/usr/bin/env bash
# hubdocs installer (Linux / WSL) — git clone + npm/pnpm build (needs Node ≥ 22).
#
#   curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
#
# Upgrade: re-run the same command.
# Uninstall: bash install.sh --uninstall
#
# Env:
#   HUBDOCS_REPO          default: raintr91/hubdocs
#   HUBDOCS_INSTALL_DIR   default: ~/.hubdocs
#   HUBDOCS_BIN_DIR       default: ~/.local/bin
#   HUBDOCS_ROOT          base-docs path (auto: ~/workspace/base-docs if present)
#   HUBDOCS_REF           git ref (default: main)
set -euo pipefail

REPO="${HUBDOCS_REPO:-raintr91/hubdocs}"
INSTALL_DIR="${HUBDOCS_INSTALL_DIR:-$HOME/.hubdocs}"
BIN_DIR="${HUBDOCS_BIN_DIR:-$HOME/.local/bin}"
REF="${HUBDOCS_REF:-main}"

if [ "${1:-}" = "--uninstall" ]; then
  rm -f "$BIN_DIR/hubdocs" "$BIN_DIR/hubdocs-mcp"
  rm -rf "$INSTALL_DIR"
  echo "hubdocs uninstalled ($INSTALL_DIR)."
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "hubdocs: Node.js ≥ 22 required (node not found)." >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "hubdocs: git required." >&2
  exit 1
fi

echo "Installing hubdocs from github.com/$REPO @$REF → $INSTALL_DIR"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

git clone --depth 1 --branch "$REF" "https://github.com/$REPO.git" "$tmpdir/src"

rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "$tmpdir/src" "$INSTALL_DIR"

cd "$INSTALL_DIR"
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
  pnpm build
elif command -v npm >/dev/null 2>&1; then
  npm install
  npm run build
else
  echo "hubdocs: pnpm or npm required." >&2
  exit 1
fi

# Optional: remember HUBDOCS_ROOT if already set (do not assume a fixed workspace layout)
if [ -n "${HUBDOCS_ROOT:-}" ]; then
  printf '%s\n' "$HUBDOCS_ROOT" > "$INSTALL_DIR/docs-root.path"
  echo "Wrote docs-root.path → $HUBDOCS_ROOT"
fi

mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/bin/hubdocs.mjs" "$BIN_DIR/hubdocs"
ln -sf "$INSTALL_DIR/bin/hubdocs-mcp.mjs" "$BIN_DIR/hubdocs-mcp"
chmod +x "$INSTALL_DIR/bin/"*.mjs

echo "Linked $BIN_DIR/hubdocs"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    echo ""
    echo "$BIN_DIR is not on PATH. Add:"
    echo "  export PATH=\"$BIN_DIR:\$PATH\""
    ;;
esac

echo ""
echo "Done. Next (no cd required):"
echo "  hubdocs version"
echo "  hubdocs init                                 # agents (↑↓ · Space · Enter)"
echo "  cd /path/to/your/docs-hub && hubdocs init --yes"
echo "Docs: docs/INIT.md"
