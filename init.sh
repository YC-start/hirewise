#!/usr/bin/env bash
#
# HireWise — Development Environment Initialization Script
# Idempotent: safe to run multiple times.
#
set -euo pipefail

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────
PROJECT_NAME="hirewise"
GITHUB_USER="YC-start"
REPO_NAME="hirewise"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "  HireWise — Init Script"
echo "  Project dir: $PROJECT_DIR"
echo "============================================"
echo ""

# ──────────────────────────────────────────────
# 1. Pre-flight checks
# ──────────────────────────────────────────────
echo "[1/7] Pre-flight checks..."

command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is not installed. Install Node.js 18+ and retry."; exit 1; }
command -v npm >/dev/null 2>&1  || { echo "ERROR: npm is not installed."; exit 1; }
command -v git >/dev/null 2>&1  || { echo "ERROR: git is not installed."; exit 1; }
command -v gh >/dev/null 2>&1   || { echo "ERROR: GitHub CLI (gh) is not installed. Install from https://cli.github.com"; exit 1; }

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required. Current: $(node -v)"
  exit 1
fi

echo "  Node $(node -v) | npm $(npm -v) | git $(git --version | cut -d' ' -f3)"
echo "  All pre-flight checks passed."
echo ""

# ──────────────────────────────────────────────
# 2. Scaffold Next.js project (if not already done)
# ──────────────────────────────────────────────
echo "[2/7] Scaffolding Next.js project..."

if [ -f "$PROJECT_DIR/package.json" ] && grep -q "next" "$PROJECT_DIR/package.json" 2>/dev/null; then
  echo "  Next.js project already exists. Skipping scaffold."
else
  # Create Next.js app in a temp dir, then move contents into project dir
  TEMP_DIR=$(mktemp -d)
  printf '\n\n\n\n\n' | npx --yes create-next-app@latest "$TEMP_DIR/$PROJECT_NAME" \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*" \
    --no-turbopack \
    --no-react-compiler

  # Move scaffolded files into project dir (preserve existing files like PRODUCT_SPEC.md)
  shopt -s dotglob
  cp -rn "$TEMP_DIR/$PROJECT_NAME/"* "$PROJECT_DIR/" 2>/dev/null || true
  # For files that should be overwritten (package.json, tsconfig, etc.)
  cp -r "$TEMP_DIR/$PROJECT_NAME/package.json" "$PROJECT_DIR/"
  cp -r "$TEMP_DIR/$PROJECT_NAME/tsconfig.json" "$PROJECT_DIR/"
  cp -r "$TEMP_DIR/$PROJECT_NAME/next.config"* "$PROJECT_DIR/" 2>/dev/null || true
  cp -r "$TEMP_DIR/$PROJECT_NAME/tailwind.config"* "$PROJECT_DIR/" 2>/dev/null || true
  cp -r "$TEMP_DIR/$PROJECT_NAME/postcss.config"* "$PROJECT_DIR/" 2>/dev/null || true
  # Copy src dir
  if [ -d "$TEMP_DIR/$PROJECT_NAME/src" ]; then
    cp -r "$TEMP_DIR/$PROJECT_NAME/src" "$PROJECT_DIR/"
  fi
  # Copy public dir
  if [ -d "$TEMP_DIR/$PROJECT_NAME/public" ]; then
    cp -r "$TEMP_DIR/$PROJECT_NAME/public" "$PROJECT_DIR/"
  fi
  shopt -u dotglob
  rm -rf "$TEMP_DIR"
  echo "  Next.js project scaffolded."
fi
echo ""

# ──────────────────────────────────────────────
# 3. Install additional dependencies
# ──────────────────────────────────────────────
echo "[3/7] Installing dependencies..."

cd "$PROJECT_DIR"

# Install project dependencies
npm install

# Core UI & state management
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs \
  @radix-ui/react-tooltip @radix-ui/react-scroll-area @radix-ui/react-separator \
  @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-popover

npm install zustand @tanstack/react-query

# AI integration
npm install ai @ai-sdk/openai

# Utility
npm install clsx tailwind-merge class-variance-authority
npm install @phosphor-icons/react
npm install @tanstack/react-virtual

# Cross-platform (Capacitor for iOS/Android)
npm install @capacitor/core @capacitor/cli
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
npm install @capacitor/push-notifications @capacitor/share @capacitor/camera

# Dev dependencies
npm install -D prettier eslint-config-prettier

echo "  Dependencies installed."
echo ""

# ──────────────────────────────────────────────
# 4. Initialize git repository
# ──────────────────────────────────────────────
echo "[4/7] Initializing git repository..."

cd "$PROJECT_DIR"

if [ -d ".git" ]; then
  echo "  Git repository already initialized. Skipping."
else
  git init
  echo "  Git repository initialized."
fi

# Ensure .gitignore exists and has sensible defaults
if [ ! -f ".gitignore" ]; then
  cat > .gitignore <<'GITIGNORE'
# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
GITIGNORE
  echo "  .gitignore created."
fi

# Initial commit if repo has no commits
if ! git rev-parse HEAD >/dev/null 2>&1; then
  git add -A
  git commit -m "chore: initial project scaffold — Next.js + TypeScript + Tailwind"
  echo "  Initial commit created."
else
  echo "  Repository already has commits. Skipping initial commit."
fi
echo ""

# ──────────────────────────────────────────────
# 5. Create GitHub remote repository
# ──────────────────────────────────────────────
echo "[5/7] Setting up GitHub remote repository..."

# Check if gh is authenticated
if ! gh auth status >/dev/null 2>&1; then
  echo "  WARNING: GitHub CLI is not authenticated. Run 'gh auth login' first."
  echo "  Skipping remote repository creation."
else
  # Check if remote already exists
  if git remote get-url origin >/dev/null 2>&1; then
    echo "  Remote 'origin' already configured: $(git remote get-url origin)"
  else
    # Create repo on GitHub (or skip if it already exists)
    if gh repo view "$GITHUB_USER/$REPO_NAME" >/dev/null 2>&1; then
      echo "  GitHub repo $GITHUB_USER/$REPO_NAME already exists."
      git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    else
      gh repo create "$REPO_NAME" --public --source="$PROJECT_DIR" --remote=origin --description="HireWise — AI-Native Recruiting Agent Platform"
      echo "  GitHub repo created: https://github.com/$GITHUB_USER/$REPO_NAME"
    fi
  fi

  # Push to remote
  CURRENT_BRANCH=$(git branch --show-current)
  if git push -u origin "$CURRENT_BRANCH" 2>/dev/null; then
    echo "  Pushed to origin/$CURRENT_BRANCH."
  else
    echo "  WARNING: Push failed. You may need to pull/merge first or check auth."
  fi
fi
echo ""

# ──────────────────────────────────────────────
# 6. Install Vercel CLI & link project
# ──────────────────────────────────────────────
echo "[6/7] Setting up Vercel..."

# Install Vercel CLI globally if not present
if ! command -v vercel >/dev/null 2>&1; then
  npm install -g vercel
  echo "  Vercel CLI installed."
else
  echo "  Vercel CLI already installed: $(vercel --version 2>/dev/null || echo 'unknown version')"
fi

# Link to Vercel project (interactive — will prompt if not already linked)
if [ -d "$PROJECT_DIR/.vercel" ]; then
  echo "  Vercel project already linked."
else
  echo "  Linking to Vercel... (this may require interactive login)"
  echo "  Run 'vercel link' manually if this step is skipped."
  vercel link --yes 2>/dev/null || echo "  WARNING: Vercel link requires interactive setup. Run 'vercel link' manually."
fi

# Deploy to Vercel
echo "  Deploying to Vercel..."
if vercel --prod --yes 2>/dev/null; then
  echo "  Production deployment triggered."
else
  echo "  WARNING: Vercel deployment requires authentication. Run 'vercel --prod' manually."
fi
echo ""

# ──────────────────────────────────────────────
# 7. Initialize Capacitor (iOS/Android)
# ──────────────────────────────────────────────
echo "[7/8] Initializing Capacitor for mobile platforms..."

if [ -f "$PROJECT_DIR/capacitor.config.ts" ]; then
  echo "  Capacitor already initialized. Skipping."
else
  npx cap init "$PROJECT_NAME" "com.hirewise.app" --web-dir=out 2>/dev/null || echo "  Capacitor init completed."
  echo "  Capacitor config created."
  echo "  NOTE: Run 'npx cap add ios' and 'npx cap add android' when ready to build native shells."
  echo "  NOTE: For mobile builds, run 'next build && next export' first to generate the 'out' directory."
fi
echo ""

# ──────────────────────────────────────────────
# 8. Summary
# ──────────────────────────────────────────────
echo "[8/8] Setup complete!"
echo ""
echo "============================================"
echo "  HireWise development environment is ready."
echo "============================================"
echo ""
echo "  Project directory:  $PROJECT_DIR"
echo "  GitHub repo:        https://github.com/$GITHUB_USER/$REPO_NAME"
echo "  Tech stack:         Next.js + TypeScript + Tailwind CSS"
echo "  Cross-platform:     Capacitor (iOS/Android)"
echo "  UI primitives:      Radix UI (headless)"
echo "  State management:   Zustand + TanStack Query"
echo "  AI SDK:             Vercel AI SDK"
echo "  Icons:              Phosphor Icons"
echo ""
echo "  Quick start:"
echo "    cd $PROJECT_DIR"
echo "    npm run dev          # Start dev server at http://localhost:3000"
echo "    vercel               # Deploy preview"
echo "    vercel --prod        # Deploy production"
echo ""
echo "  Mobile (when ready):"
echo "    npx cap add ios      # Add iOS platform"
echo "    npx cap add android  # Add Android platform"
echo "    npx cap sync         # Sync web build to native"
echo "    npx cap open ios     # Open in Xcode"
echo "    npx cap open android # Open in Android Studio"
echo ""
echo "  Every 'git push' to main will auto-deploy via Vercel."
echo "============================================"
