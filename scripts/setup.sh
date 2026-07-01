#!/usr/bin/env bash
# Install the structural quality gate into the CURRENT git repository.
#
# Run this once inside each work repo where you want the un-evadable backstop:
#   git config core.hooksPath <this-config>/githooks
#
# The plugins (branch-protection, interactive-guard) and the opencode.jsonc
# formatter/permission settings are global and need no per-repo install; only
# the git hooks are per-repo, because git hooks live in a repo.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
hooks_dir="$here/githooks"

chmod +x "$hooks_dir"/pre-commit "$hooks_dir"/pre-push

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository. cd into a work repo and re-run." >&2
  exit 1
fi

git config core.hooksPath "$hooks_dir"
echo "Installed hooks: core.hooksPath -> $hooks_dir"
echo "  pre-commit: branch guard + ruff + type check"
echo "  pre-push:   branch guard + pytest"
