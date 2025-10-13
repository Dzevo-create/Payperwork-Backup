#!/bin/bash

# Documentation Organization Script
# This script reorganizes all MD files into a clean structure

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Documentation Organization Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Define the project root
PROJECT_ROOT="/Users/dzevahiraliti/Creative Cloud Files Personal Account dz_aliti@hotmail.com 3099E26358F9F9DC0A495DB1@AdobeID/Neuer Ordner/Dzevahir Aliti Privat/KI Solutions/Cursor/Payperwork"

cd "$PROJECT_ROOT"

# Create docs directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p docs/archive
mkdir -p docs/architecture
mkdir -p docs/guides
mkdir -p docs/development

echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Move files to appropriate locations
echo -e "${YELLOW}Organizing documentation files...${NC}"

# KEEP IN ROOT: README.md (already there)
echo -e "${BLUE}Keeping in root:${NC}"
echo "  - README.md"

# MOVE TO /docs/architecture/
echo ""
echo -e "${BLUE}Moving to /docs/architecture/:${NC}"
mv -v "ARCHITECTURE_STATUS.md" "docs/architecture/" 2>/dev/null || echo "  Already moved or not found: ARCHITECTURE_STATUS.md"
mv -v "SEPARATION_COMPLETE.md" "docs/architecture/" 2>/dev/null || echo "  Already moved or not found: SEPARATION_COMPLETE.md"

# Check if Super Chat docs exist in /docs/ and move to architecture
if [ -f "docs/SUPER_CHAT_ARCHITECTURE.md" ]; then
  mv -v "docs/SUPER_CHAT_ARCHITECTURE.md" "docs/architecture/" 2>/dev/null || echo "  Already in architecture"
fi
if [ -f "docs/SEPARATION_DIAGRAM.md" ]; then
  mv -v "docs/SEPARATION_DIAGRAM.md" "docs/architecture/" 2>/dev/null || echo "  Already in architecture"
fi

# MOVE TO /docs/guides/
echo ""
echo -e "${BLUE}Moving to /docs/guides/:${NC}"
mv -v "QUICK_TEST_GUIDE.md" "docs/guides/" 2>/dev/null || echo "  Already moved or not found: QUICK_TEST_GUIDE.md"
mv -v "SECURITY_SETUP.md" "docs/guides/" 2>/dev/null || echo "  Already moved or not found: SECURITY_SETUP.md"
mv -v "C1_EXPERIMENTAL_SETUP.md" "docs/guides/" 2>/dev/null || echo "  Already moved or not found: C1_EXPERIMENTAL_SETUP.md"

# Check if Super Chat setup guide exists in /docs/
if [ -f "docs/SUPER_CHAT_QUICK_SETUP.md" ]; then
  mv -v "docs/SUPER_CHAT_QUICK_SETUP.md" "docs/guides/" 2>/dev/null || echo "  Already in guides"
fi

# MOVE TO /docs/development/
echo ""
echo -e "${BLUE}Moving to /docs/development/:${NC}"
mv -v "REMAINING_TASKS.md" "docs/development/" 2>/dev/null || echo "  Already moved or not found: REMAINING_TASKS.md"
mv -v "IMPROVEMENT_POTENTIAL.md" "docs/development/" 2>/dev/null || echo "  Already moved or not found: IMPROVEMENT_POTENTIAL.md"

# MOVE TO /docs/archive/ (Status docs that are now obsolete)
echo ""
echo -e "${BLUE}Moving to /docs/archive/ (obsolete status docs):${NC}"
mv -v "FINAL_STATUS.md" "docs/archive/" 2>/dev/null || echo "  Already moved or not found: FINAL_STATUS.md"
mv -v "FINAL_TESTING_STATUS.md" "docs/archive/" 2>/dev/null || echo "  Already moved or not found: FINAL_TESTING_STATUS.md"
mv -v "TESTING_SUMMARY.md" "docs/archive/" 2>/dev/null || echo "  Already moved or not found: TESTING_SUMMARY.md"
mv -v "PRODUCTION_READY.md" "docs/archive/" 2>/dev/null || echo "  Already moved or not found: PRODUCTION_READY.md"

# Check if old implementation docs exist in /docs/
if [ -f "docs/super-chat-implementation-summary.md" ]; then
  mv -v "docs/super-chat-implementation-summary.md" "docs/archive/" 2>/dev/null || echo "  Already in archive"
fi
if [ -f "docs/super-chat-quick-reference.md" ]; then
  mv -v "docs/super-chat-quick-reference.md" "docs/archive/" 2>/dev/null || echo "  Already in archive"
fi
if [ -f "docs/super-chat-test-plan.md" ]; then
  mv -v "docs/super-chat-test-plan.md" "docs/archive/" 2>/dev/null || echo "  Already in archive"
fi

echo ""
echo -e "${GREEN}✓ Files organized${NC}"
echo ""

# Create a new INDEX.md in docs folder
echo -e "${YELLOW}Creating documentation index...${NC}"
cat > "docs/INDEX.md" << 'EOF'
# Documentation Index

## Overview
This directory contains all project documentation organized by category.

## Directory Structure

### `/docs/architecture/`
System architecture and design documents:
- **ARCHITECTURE_STATUS.md** - Current system architecture, database design, migration status
- **SEPARATION_COMPLETE.md** - Standard Chat vs Super Chat separation architecture
- **SUPER_CHAT_ARCHITECTURE.md** - Detailed C1 integration architecture
- **SEPARATION_DIAGRAM.md** - Visual architecture diagrams

### `/docs/guides/`
User and setup guides:
- **QUICK_TEST_GUIDE.md** - 5-minute verification guide for testing the app
- **SECURITY_SETUP.md** - Security configuration and API key rotation guide
- **C1_EXPERIMENTAL_SETUP.md** - Super Chat (C1) setup and configuration
- **SUPER_CHAT_QUICK_SETUP.md** - Quick start guide for enabling C1

### `/docs/development/`
Development notes and tasks:
- **REMAINING_TASKS.md** - Pending tasks and improvements
- **IMPROVEMENT_POTENTIAL.md** - Future enhancement ideas and optimization suggestions

### `/docs/archive/`
Historical status documents (reference only):
- **FINAL_STATUS.md** - Final production-ready status from initial development
- **FINAL_TESTING_STATUS.md** - Comprehensive testing verification results
- **TESTING_SUMMARY.md** - Testing summary and recommendations
- **PRODUCTION_READY.md** - Production readiness checklist and status
- **super-chat-implementation-summary.md** - Old C1 implementation notes
- **super-chat-quick-reference.md** - Old C1 quick reference
- **super-chat-test-plan.md** - Old C1 test plan

## Quick Links

### For New Developers
1. Start with: [README.md](../README.md) (project root)
2. Understand architecture: [ARCHITECTURE_STATUS.md](architecture/ARCHITECTURE_STATUS.md)
3. Test the app: [QUICK_TEST_GUIDE.md](guides/QUICK_TEST_GUIDE.md)

### For Deployment
1. Security setup: [SECURITY_SETUP.md](guides/SECURITY_SETUP.md)
2. Test before deploy: [QUICK_TEST_GUIDE.md](guides/QUICK_TEST_GUIDE.md)
3. Check remaining tasks: [REMAINING_TASKS.md](development/REMAINING_TASKS.md)

### For C1 (Super Chat) Setup
1. Setup guide: [C1_EXPERIMENTAL_SETUP.md](guides/C1_EXPERIMENTAL_SETUP.md)
2. Architecture: [SUPER_CHAT_ARCHITECTURE.md](architecture/SUPER_CHAT_ARCHITECTURE.md)
3. Quick setup: [SUPER_CHAT_QUICK_SETUP.md](guides/SUPER_CHAT_QUICK_SETUP.md)

## Document Status

### Active (Current Reference)
- All files in `/architecture/`, `/guides/`, `/development/`

### Archived (Historical Reference)
- All files in `/archive/` - kept for reference but superseded by current docs

## Contributing
When adding new documentation:
- Place in appropriate category folder
- Update this INDEX.md
- Use clear, descriptive filenames
- Include date and purpose in document header
EOF

echo -e "${GREEN}✓ Documentation index created${NC}"
echo ""

# Create a summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Organization Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Root directory (clean):${NC}"
echo "  ✓ README.md"
echo ""
echo -e "${GREEN}Documentation structure:${NC}"
echo "  📁 docs/"
echo "    ├── INDEX.md (main documentation index)"
echo "    ├── 📁 architecture/ (system design docs)"
echo "    ├── 📁 guides/ (user and setup guides)"
echo "    ├── 📁 development/ (dev notes and tasks)"
echo "    └── 📁 archive/ (historical status docs)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review docs/INDEX.md for the new structure"
echo "  2. Update any internal links in documentation"
echo "  3. Commit the changes: git add . && git commit -m '📚 Organize documentation structure'"
echo ""
echo -e "${GREEN}✓ All documentation organized!${NC}"
