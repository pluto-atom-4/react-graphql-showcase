#!/bin/bash
# .claude/hooks/pre-commit.sh
# Local verification hook referenced in .claude/settings.json
# Executes verification checks before commit to catch issues early

set -e

echo "🔍 Running pre-commit verification checks..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Linting
echo -e "${YELLOW}→ Linting...${NC}"
if ! pnpm lint --max-warnings=0 > /dev/null 2>&1; then
  echo -e "${RED}✗ Linting failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Linting passed${NC}"

# Check 2: Type checking
echo -e "${YELLOW}→ Type checking...${NC}"
if ! pnpm type-check > /dev/null 2>&1; then
  echo -e "${RED}✗ Type checking failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Type checking passed${NC}"

# Check 3: Unit tests
echo -e "${YELLOW}→ Running tests...${NC}"
if ! pnpm test --run > /dev/null 2>&1; then
  echo -e "${RED}✗ Tests failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Tests passed${NC}"

# Check 4: Verify services (optional, non-blocking)
echo -e "${YELLOW}→ Checking services...${NC}"
if docker ps | grep -q "postgres"; then
  echo -e "${GREEN}✓ PostgreSQL running${NC}"
else
  echo -e "${YELLOW}⚠ PostgreSQL not running (non-blocking)${NC}"
fi

echo -e "${GREEN}✅ All pre-commit checks passed${NC}"
echo ""
echo "Ready to commit!"
