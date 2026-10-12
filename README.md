# 🌿 EcoChallenges

> A social web platform where users take part in sustainability challenges around healthy living, eco-friendly habits, and community action.

Built by **Manesh Ravikumar**

---

## 🌍 What is EcoChallenges?

EcoChallenges turns everyday sustainable actions into a shared, rewarding community experience. Users join challenges, submit photo/text proof, earn points, and compete on a leaderboard — all moderated by AI to keep content safe and on-theme.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌱 **Challenge Feed** | Active challenges filtered by expiry date, showing point values and category |
| 📸 **Proof Submissions** | Upload photos + text as proof of completing a challenge |
| 🤖 **AI Moderation** | AWS Comprehend (NLP) classifies posts; Rekognition screens images |
| 🏆 **Leaderboard** | Points-based ranking of top eco warriors |
| 🔐 **Auth** | AWS Cognito user pools — sign up, confirm email, sign in, JWT |
| ☁️ **Serverless** | Fully on AWS Lambda + API Gateway + DynamoDB + S3 — scales automatically |
| 🔍 **Search & Filter** | Filter challenges by category, search by keyword |

---

## 🏗️ Architecture

```
Browser (React SPA)
       │
       ▼
AWS API Gateway (HTTP API)
       │
       ├── GET  /challenges          ──► Lambda: challenges/handler.py
       ├── GET  /challenges/{id}     ──► Lambda: challenges/handler.py
       ├── POST /challenges/{id}/join──► Lambda: challenges/handler.py
       ├── GET  /challenges/{id}/posts──►Lambda: posts/handler.py
       ├── POST /posts               ──► Lambda: posts/handler.py
       │         └── AWS Comprehend (text moderation)
       │         └── AWS Rekognition (image moderation)
       ├── POST /posts/{id}/like     ──► Lambda: posts/handler.py
       ├── POST /upload-url          ──► Lambda: upload_url.py → S3 presigned URL
       ├── GET  /users/{id}          ──► Lambda: users/handler.py
       ├── PUT  /users/me            ──► Lambda: users/handler.py
       └── GET  /leaderboard         ──► Lambda: leaderboard/handler.py
                                              │
                                         DynamoDB
                                    ┌─────────────────┐
                                    │ Challenges Table │
                                    │ Posts Table (GSI)│
                                    │ Users Table      │
                                    └─────────────────┘
Cognito User Pool ──► PostConfirmation trigger ──► users/handler.py
S3 Bucket ──► proof images (direct browser upload via presigned URL)
```

---

## 🤖 NLP Moderation Pipeline

Every post goes through a 2-stage moderation check before appearing in the feed:

### Text (AWS Comprehend)
1. **Keyword blocklist** — instant reject for clearly inappropriate content
2. **Sentiment analysis** — rejects NEGATIVE sentiment posts
3. **Key phrase extraction** — checks against 50+ eco/health keywords; off-topic posts are flagged

### Images (AWS Rekognition)
1. **`DetectModerationLabels`** — blocks nudity, violence, drugs (>70% confidence)
2. **`DetectLabels`** — requires at least one eco/nature/activity label; off-topic images are flagged

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Auth (client) | AWS Amplify + Cognito |
| Backend | Python 3.11, AWS Lambda |
| API | AWS API Gateway (HTTP API) |
| Database | AWS DynamoDB |
| Auth (server) | AWS Cognito User Pools |
| Storage | AWS S3 |
| AI / NLP | AWS Comprehend + Rekognition |
| IaC | AWS SAM (Serverless Application Model) |

---

## 📁 Project Structure

```
EcoChallenges/
├── frontend/                      # React SPA
│   ├── src/
│   │   ├── pages/                 # Home, Feed, ChallengeDetail, SubmitProof,
│   │   │                          # Leaderboard, Profile, Login, Register
│   │   ├── components/            # Navbar, ChallengeCard, PostCard, CategoryFilter
│   │   ├── context/               # AuthContext (Cognito)
│   │   └── api/                   # Axios client with JWT interceptor
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                       # Python Lambda handlers
│   ├── challenges/handler.py      # List, get, create, join challenges
│   ├── posts/handler.py           # Submit posts + full moderation pipeline
│   ├── posts/upload_url.py        # Presigned S3 URL generation
│   ├── moderation/handler.py      # Comprehend + Rekognition logic
│   ├── users/handler.py           # Profile + Cognito post-confirm trigger
│   ├── leaderboard/handler.py     # Top 50 users by points
│   └── requirements.txt
│
├── infrastructure/
│   └── template.yaml              # AWS SAM — all cloud resources
│
├── scripts/
│   ├── deploy.sh                  # One-command build + deploy + .env write
│   ├── seed_challenges.py         # Seed 10 sample challenges into DynamoDB
│   └── mock_api.py                # Local Flask API for frontend dev (no AWS needed)
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- AWS CLI configured (`aws configure`)
- AWS SAM CLI (`brew install aws-sam-cli`)

### Run Locally (no AWS needed)

**Terminal 1 — start the mock API:**
```bash
pip install flask flask-cors
python scripts/mock_api.py
# Running at http://localhost:3001
```

**Terminal 2 — start the React app:**
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:3000
```

The frontend comes pre-configured with `VITE_API_URL=http://localhost:3001` pointing at the mock API with 6 sample challenges.

---

### Deploy to AWS

```bash
# 1. Configure AWS credentials
aws configure

# 2. Install SAM CLI
brew install aws-sam-cli

# 3. One-command deploy
./scripts/deploy.sh prod
```

The deploy script will:
- `sam build` + `sam deploy` all Lambda functions and infrastructure
- Capture CloudFormation outputs (API URL, Cognito IDs, S3 bucket)
- Auto-write `frontend/.env` with the correct values
- Optionally seed 10 sample challenges
- Build the React app ready for hosting

---

### Environment Variables

After deploy, `frontend/.env` is written automatically. For manual setup copy `.env.example`:

```env
VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com
VITE_COGNITO_USER_POOL_ID=<pool-id>
VITE_COGNITO_CLIENT_ID=<client-id>
VITE_S3_BUCKET=<bucket-name>
VITE_REGION=us-east-1
```

---

## 👤 Author

**Manesh Ravikumar**
- GitHub: [@maneshr206](https://github.com/maneshr206)
- Email: maneshr206@gmail.com

---

## 📄 License

MIT — free to use, modify and distribute.
