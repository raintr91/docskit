#!/usr/bin/env bash
# docskit installer (Linux / WSL) — git clone + npm/pnpm build (needs Node ≥ 22).
#
#   curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
#
# Upgrade: re-run the same command.
# Uninstall: bash install.sh --uninstall
#
# Env:
#   DOCSKIT_REPO          default: raintr91/hubdocs
#   DOCSKIT_INSTALL_DIR   default: ~/.docskit
#   DOCSKIT_BIN_DIR       default: ~/.local/bin
#   DOCSKIT_REF           git ref (default: main)
set -euo pipefail

REPO="${DOCSKIT_REPO:-raintr91/hubdocs}"
INSTALL_DIR="${DOCSKIT_INSTALL_DIR:-$HOME/.docskit}"
BIN_DIR="${DOCSKIT_BIN_DIR:-$HOME/.local/bin}"
REF="${DOCSKIT_REF:-main}"

if [ "${1:-}" = "--uninstall" ]; then
  rm -f "$BIN_DIR/docskit" "$BIN_DIR/docskit-mcp"
  rm -rf "$INSTALL_DIR"
  echo "docskit uninstalled ($INSTALL_DIR)."
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "docskit: Node.js ≥ 22 required (node not found)." >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "docskit: git required." >&2
  exit 1
fi

echo "Installing docskit from github.com/$REPO @$REF → $INSTALL_DIR"

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
  echo "docskit: pnpm or npm required." >&2
  exit 1
fi

mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/bin/docskit.mjs" "$BIN_DIR/docskit"
ln -sf "$INSTALL_DIR/bin/docskit-mcp.mjs" "$BIN_DIR/docskit-mcp"
chmod +x "$INSTALL_DIR/bin/"*.mjs

echo "Linked $BIN_DIR/docskit"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    echo ""
    echo "$BIN_DIR is not on PATH. Attempting to add to shell config..."
    ADDED=0
    for rc in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile"; do
      if [ -f "$rc" ]; then
        if ! grep -q "$BIN_DIR" "$rc"; then
          echo "" >> "$rc"
          echo "# Added by docskit installer" >> "$rc"
          echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$rc"
          echo "  -> Added to $rc"
          ADDED=1
        fi
      fi
    done
    
    if [ "$ADDED" -eq 1 ]; then
      echo "  Please restart your terminal or run 'source ~/.zshrc' (or your respective shell config) to apply."
    else
      echo "  Could not automatically add to shell config. Please add manually:"
      echo "  export PATH=\"$BIN_DIR:\$PATH\""
    fi
    ;;
esac

echo ""
echo "Done. Next:"
echo "  docskit version"
echo "  cd /path/to/your/docs-hub && docskit init --location=local --yes"
echo "Docs: docs/INIT.md"
