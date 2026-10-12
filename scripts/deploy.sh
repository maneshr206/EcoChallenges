#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# EcoChallenges deploy script
# Usage: ./scripts/deploy.sh [dev|staging|prod]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

STAGE="${1:-prod}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
STACK_NAME="ecochallenges-${STAGE}"

echo "🌿 Deploying EcoChallenges (stage=$STAGE, region=$REGION)"

# ── 1. Build SAM ──────────────────────────────────────────────────────────────
echo "📦 Building SAM application…"
cd "$(dirname "$0")/../infrastructure"
sam build --use-container

# ── 2. Deploy SAM ─────────────────────────────────────────────────────────────
echo "🚀 Deploying stack: $STACK_NAME"
sam deploy \
  --stack-name "$STACK_NAME" \
  --region     "$REGION"     \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides Stage="$STAGE" \
  --resolve-s3 \
  --no-confirm-changeset

# ── 3. Capture outputs ────────────────────────────────────────────────────────
echo "📋 Fetching stack outputs…"
outputs=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region     "$REGION"     \
  --query "Stacks[0].Outputs" \
  --output json)

API_URL=$(echo "$outputs" | python3 -c "import json,sys; o=json.load(sys.stdin); print(next(x['OutputValue'] for x in o if x['OutputKey']=='ApiUrl'))")
POOL_ID=$(echo "$outputs" | python3 -c "import json,sys; o=json.load(sys.stdin); print(next(x['OutputValue'] for x in o if x['OutputKey']=='UserPoolId'))")
CLIENT_ID=$(echo "$outputs" | python3 -c "import json,sys; o=json.load(sys.stdin); print(next(x['OutputValue'] for x in o if x['OutputKey']=='UserPoolClientId'))")
BUCKET=$(echo "$outputs"   | python3 -c "import json,sys; o=json.load(sys.stdin); print(next(x['OutputValue'] for x in o if x['OutputKey']=='ProofBucketName'))")

# ── 4. Write .env for frontend ────────────────────────────────────────────────
ENV_FILE="$(dirname "$0")/../frontend/.env"
cat > "$ENV_FILE" <<EOF
VITE_API_URL=${API_URL}
VITE_COGNITO_USER_POOL_ID=${POOL_ID}
VITE_COGNITO_CLIENT_ID=${CLIENT_ID}
VITE_S3_BUCKET=${BUCKET}
VITE_REGION=${REGION}
EOF
echo "✅ Wrote frontend/.env"

# ── 5. Seed challenges (first deploy only) ────────────────────────────────────
read -p "Seed sample challenges? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 Seeding challenges…"
  cd "$(dirname "$0")/.."
  python3 scripts/seed_challenges.py --region "$REGION"
fi

# ── 6. Build & (optionally) deploy frontend ──────────────────────────────────
echo ""
echo "🎨 Building React frontend…"
cd "$(dirname "$0")/../frontend"
npm ci --silent
npm run build

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Deploy complete!"
echo "   API URL   : $API_URL"
echo "   Cognito   : $POOL_ID / $CLIENT_ID"
echo "   S3 Bucket : $BUCKET"
echo ""
echo "   Serve frontend locally:"
echo "   cd frontend && npm run preview"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
