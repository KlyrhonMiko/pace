#!/bin/bash

# PACE Development - Clear Upstash Redis Cache
# This script clears all cached data from Upstash Redis

echo "🗑️  PACE Cache Clear Tool (Upstash)"
echo ""

# Navigate to project root
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# Load environment variables from .env.local
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    set -a
    source "$PROJECT_ROOT/.env.local"
    set +a
else
    echo "❌ .env.local file not found at $PROJECT_ROOT"
    exit 1
fi

# Check if REDIS_URL is set
if [ -z "$REDIS_URL" ]; then
    echo "❌ REDIS_URL environment variable is not set."
    exit 1
fi

# Check if redis-cli is available
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  redis-cli is not installed. Installing redis package..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y redis-tools
    elif command -v brew &> /dev/null; then
        brew install redis
    else
        echo "❌ Could not install redis-cli. Please install it manually."
        exit 1
    fi
fi

echo "Are you sure you want to clear ALL cache from Upstash? This is irreversible. (y/N)"
read -r confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Cache clear cancelled."
    exit 0
fi

echo ""
echo "⏳ Clearing cache..."

# Get count before
count_before=$(redis-cli -u "$REDIS_URL" DBSIZE 2>/dev/null | grep -oE '[0-9]+')
echo "📊 Keys before clear: $count_before"

# Clear the database
redis-cli -u "$REDIS_URL" FLUSHDB > /dev/null 2>&1

echo ""
echo "✅ Cache cleared successfully from Upstash!"
echo ""
echo "📊 Keys after clear: 0"
echo ""
echo "💡 Next steps:"
echo "   - Restart the backend to reload cache on startup"
echo "   - Or let the cache auto-refresh (jobs refresh every 6 hours)"
echo ""
