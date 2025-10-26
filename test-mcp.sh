#!/bin/bash
# Test script for Lean Log MCP Server
# Usage: ./test-mcp.sh [your-api-key]
# Get your API key from: https://lean-log.tarequm.com/settings/api-keys

if [ -z "$1" ]; then
  echo "❌ Error: API key required"
  echo "Usage: ./test-mcp.sh YOUR_API_KEY"
  echo "Get your API key from: https://lean-log.tarequm.com/settings/api-keys"
  exit 1
fi

API_KEY="$1"
BASE_URL="https://lean-log.tarequm.com/api/mcp/messages"

echo "🧪 Testing Lean Log MCP Server"
echo "================================"
echo ""

# Test 1: Get latest weight
echo "1️⃣  Testing weight.getLatest..."
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"method": "weight.getLatest"}' | jq .
echo ""

# Test 2: List recent weights
echo "2️⃣  Testing weight.listRecent..."
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"method": "weight.listRecent", "params": {"limit": 3}}' | jq .
echo ""

# Test 3: List meals
echo "3️⃣  Testing meals.list..."
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"method": "meals.list", "params": {"includeArchived": false}}' | jq .
echo ""

# Test 4: Get or create day log
echo "4️⃣  Testing entries.getOrCreateDayLog..."
TODAY=$(date +%Y-%m-%d)
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"method\": \"entries.getOrCreateDayLog\", \"params\": {\"date\": \"$TODAY\"}}" | jq .
echo ""

# Test 5: Get day summaries
echo "5️⃣  Testing history.daySummaries..."
START_DATE=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '7 days ago' +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"method\": \"history.daySummaries\", \"params\": {\"startDate\": \"$START_DATE\", \"endDate\": \"$END_DATE\"}}" | jq .
echo ""

# Test 6: Test invalid method (should fail gracefully)
echo "6️⃣  Testing invalid method (should return error)..."
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"method": "invalid.method"}' | jq .
echo ""

# Test 7: Test missing auth (should fail)
echo "7️⃣  Testing missing auth (should return 401)..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"method": "weight.getLatest"}' | jq .
echo ""

echo "✅ All tests completed!"
