#!/bin/bash

# Git Security Verification Script
# This script checks that sensitive files are properly ignored by git

echo "🔒 Git Security Verification for Bio-X-Agents Chronos"
echo "=================================================="

# Change to the chronos directory
cd "$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git repository detected${NC}"
echo ""

# Function to check if a pattern is ignored
check_ignored() {
    local file="$1"
    local description="$2"
    
    if git check-ignore "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description is properly ignored${NC}"
        return 0
    else
        echo -e "${RED}❌ $description is NOT ignored - SECURITY RISK!${NC}"
        return 1
    fi
}

# Function to check if a pattern would be tracked
check_not_tracked() {
    local file="$1"
    local description="$2"
    
    if git ls-files --error-unmatch "$file" > /dev/null 2>&1; then
        echo -e "${RED}❌ $description is tracked in git - SECURITY RISK!${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $description is not tracked${NC}"
        return 0
    fi
}

echo "Checking environment files..."
check_ignored ".env" "Root .env file"
check_ignored "backend/.env" "Backend .env file"
check_ignored "frontend/.env.local" "Frontend .env.local file"
check_ignored "backend/.env.production" "Backend production env"
check_ignored "frontend/.env.production.local" "Frontend production env"

echo ""
echo "Checking sensitive configuration files..."
check_ignored "config/secrets.json" "Secrets configuration"
check_ignored "backend/secrets/" "Backend secrets directory"
check_ignored "frontend/secrets/" "Frontend secrets directory"

echo ""
echo "Checking API keys and certificates..."
check_ignored "api.key" "API key file"
check_ignored "private.pem" "Private certificate"
check_ignored "backend/config.key" "Backend key file"

echo ""
echo "Checking database files..."
check_ignored "app.db" "SQLite database"
check_ignored "data.sqlite3" "SQLite3 database"
check_ignored "backend/redis-data/" "Redis data directory"
check_ignored "backend/neo4j-data/" "Neo4j data directory"

echo ""
echo "Checking Docker files..."
check_ignored "backend/docker-compose.override.yml" "Docker override file"
check_ignored "backend/volumes/" "Docker volumes directory"

echo ""
echo "Checking IDE and OS files..."
check_ignored ".vscode/" "VS Code settings"
check_ignored ".idea/" "IntelliJ settings"
check_ignored ".DS_Store" "macOS DS_Store file"

echo ""
echo "Checking for currently tracked sensitive files..."
tracked_issues=0

# Check for any .env files that might be tracked
if git ls-files | grep -E "\.env" | grep -v "\.env\.example" > /dev/null; then
    echo -e "${RED}❌ Found tracked .env files:${NC}"
    git ls-files | grep -E "\.env" | grep -v "\.env\.example"
    tracked_issues=$((tracked_issues + 1))
fi

# Check for any key files that might be tracked
if git ls-files | grep -E "\.(key|pem|p12|pfx)$" > /dev/null; then
    echo -e "${RED}❌ Found tracked certificate/key files:${NC}"
    git ls-files | grep -E "\.(key|pem|p12|pfx)$"
    tracked_issues=$((tracked_issues + 1))
fi

# Check for any database files that might be tracked
if git ls-files | grep -E "\.(db|sqlite|sqlite3)$" > /dev/null; then
    echo -e "${RED}❌ Found tracked database files:${NC}"
    git ls-files | grep -E "\.(db|sqlite|sqlite3)$"
    tracked_issues=$((tracked_issues + 1))
fi

echo ""
if [ $tracked_issues -eq 0 ]; then
    echo -e "${GREEN}🎉 All sensitive files are properly protected!${NC}"
    echo ""
    echo "Security recommendations:"
    echo "• Always use .env.example files as templates"
    echo "• Never commit actual API keys or passwords"
    echo "• Regularly rotate credentials"
    echo "• Use different credentials for different environments"
    echo "• Review .gitignore files before committing new file types"
else
    echo -e "${RED}⚠️  Found $tracked_issues security issues that need attention!${NC}"
    echo ""
    echo "To fix tracked sensitive files:"
    echo "git rm --cached <filename>  # Remove from git but keep local file"
    echo "git commit -m 'Remove sensitive file from tracking'"
fi

echo ""
echo "=================================================="
echo "Verification complete."
