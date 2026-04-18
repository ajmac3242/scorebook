#!/usr/bin/env bash
# jules-test.sh — Targeted test runner for Jules.
# Detects which files were changed (via git diff against the base branch or
# working-tree changes) and runs ONLY the tests that cover those files.
# CI continues to run the full suite; this script is for Jules' internal
# verification step only.
#
# Usage (add to your Jules task):
#   cd backend  && bash ../scripts/jules-test.sh backend
#   cd frontend && bash ../scripts/jules-test.sh frontend
# Or simply:  bash scripts/jules-test.sh   (auto-detects both)

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
SCOPE="${1:-all}"  # backend | frontend | all

# ---------------------------------------------------------------------------
# Determine which source files changed
# ---------------------------------------------------------------------------
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  # Inside a git repo with commits — diff against merge-base with main/master
  BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD origin/master 2>/dev/null || echo "HEAD~1")
  CHANGED=$(git diff --name-only "$BASE" HEAD)
else
  # Fallback: all tracked files (fresh clone, no prior commits)
  CHANGED=$(git ls-files)
fi

echo "==> Changed files:"
echo "$CHANGED"
echo ""

# ---------------------------------------------------------------------------
# Backend: Jest with --testPathPattern derived from changed source modules
# ---------------------------------------------------------------------------
run_backend_tests() {
  echo "==> Running backend targeted tests..."
  cd "$ROOT_DIR/backend"

  # Collect base names of changed .ts source files (not test files themselves)
  PATTERNS=$(echo "$CHANGED" \
    | grep '^backend/src/' \
    | grep -v '__tests__' \
    | grep '\.ts$' \
    | sed 's|backend/src/||' \
    | sed 's|\.ts$||' \
    || true)

  if [ -z "$PATTERNS" ]; then
    echo "  No backend source changes detected — skipping backend tests."
    return 0
  fi

  # Build a Jest --testPathPattern that matches any of the changed module names
  JEST_PATTERN=$(echo "$PATTERNS" | tr '\n' '|' | sed 's/|$//')
  echo "  Running Jest pattern: $JEST_PATTERN"
  pnpm jest --testPathPattern="$JEST_PATTERN"
}

# ---------------------------------------------------------------------------
# Frontend: Vitest with a file filter derived from changed source modules
# ---------------------------------------------------------------------------
run_frontend_tests() {
  echo "==> Running frontend targeted tests..."
  cd "$ROOT_DIR/frontend"

  # Collect changed frontend source files (not test files themselves)
  CHANGED_FILES=$(echo "$CHANGED" \
    | grep '^frontend/src/' \
    | grep -v '\.(test|spec)\.' \
    | grep -E '\.(tsx?|jsx?)$' \
    || true)

  if [ -z "$CHANGED_FILES" ]; then
    echo "  No frontend source changes detected — skipping frontend tests."
    return 0
  fi

  # Build vitest --reporter=verbose with explicit related-test filter
  VITEST_PATTERN=$(echo "$CHANGED_FILES" \
    | sed 's|frontend/src/||' \
    | sed 's|\.[tj]sx\?$||' \
    | tr '\n' '|' \
    | sed 's/|$//')

  echo "  Running Vitest pattern: $VITEST_PATTERN"
  pnpm vitest run --reporter=verbose "$VITEST_PATTERN"
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
case "$SCOPE" in
  backend)
    run_backend_tests
    ;;
  frontend)
    run_frontend_tests
    ;;
  all|*)
    # Only run the section if that workspace has changed files
    if echo "$CHANGED" | grep -q '^backend/'; then
      run_backend_tests
    fi
    if echo "$CHANGED" | grep -q '^frontend/'; then
      run_frontend_tests
    fi
    ;;
esac

echo ""
echo "==> Jules targeted tests complete. CI will run the full suite on the PR."
