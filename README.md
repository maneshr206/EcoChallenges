# 🌿 EcoChallenges

A social web platform where users take part in sustainability challenges around healthy living, eco-friendly habits, and community action.

## Features

- 🌱 **Challenge Feed** — Active challenges filtered by expiry, showing point values
- 📸 **Proof Submissions** — Upload photos/text as proof of completing a challenge
- 🤖 **NLP Moderation** — AWS Comprehend classifies posts; Rekognition screens images
- 🏆 **Leaderboard** — Points-based ranking system
- 🔐 **Auth** — AWS Cognito user pools (sign up / sign in / JWT)
- ☁️ **Serverless** — Fully on AWS Lambda + API Gateway + DynamoDB + S3

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Python 3.11, AWS Lambda |
| API | AWS API Gateway (HTTP API) |
| Database | AWS DynamoDB |
| Auth | AWS Cognito |
| Storage | AWS S3 |
| AI/NLP | AWS Comprehend + Rekognition |
| IaC | AWS SAM |

## Project Structure

```
├── frontend/          React SPA
├── backend/           Lambda function handlers
│   ├── challenges/    CRUD for challenges
│   ├── posts/         Submit & retrieve posts
│   ├── users/         Profile & points
│   ├── moderation/    Comprehend + Rekognition layer
│   └── leaderboard/   Rankings
├── infrastructure/    AWS SAM template.yaml
└── scripts/           Deploy helpers
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- AWS CLI configured (`aws configure`)
- AWS SAM CLI (`brew install aws-sam-cli`)

### Local Frontend Dev

```bash
cd frontend
npm install
npm run dev
```

### Deploy Backend (AWS SAM)

```bash
cd infrastructure
sam build
sam deploy --guided
```

### Environment Variables

Copy `.env.example` to `.env` in `frontend/` and fill in the values output by SAM deploy.

```
VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com
VITE_COGNITO_USER_POOL_ID=<pool-id>
VITE_COGNITO_CLIENT_ID=<client-id>
VITE_S3_BUCKET=<bucket-name>
VITE_REGION=us-east-1
```
