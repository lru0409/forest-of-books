#!/bin/bash
set -e

echo "==> Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "==> Removing .next build cache..."
find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "==> Removing pnpm store cache for oxide..."
pnpm store prune 2>/dev/null || true

echo "==> Installing dependencies..."
pnpm install

echo "==> Done. Run 'pnpm dev' to start."
