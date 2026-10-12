#!/usr/bin/env python3
"""
Lightweight mock API server for local frontend development.
Requires: pip install flask flask-cors

Run: python scripts/mock_api.py
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid, datetime

app = Flask(__name__)
CORS(app)

# ─── In-memory stores ────────────────────────────────────────────────────────
challenges_db = [
    {
        "challengeId":      "c1",
        "title":            "Walk or Bike to Work",
        "description":      "Skip the car for one week and commute by walking, biking, or public transit.",
        "category":         "eco-friendly",
        "points":           50,
        "difficulty":       "medium",
        "expiryDate":       (datetime.datetime.now() + datetime.timedelta(days=20)).isoformat(),
        "participantCount": 142,
        "createdAt":        datetime.datetime.now().isoformat(),
    },
    {
        "challengeId":      "c2",
        "title":            "7-Day Zero-Plastic Challenge",
        "description":      "Avoid single-use plastics for 7 days. Document your creative alternatives.",
        "category":         "eco-friendly",
        "points":           70,
        "difficulty":       "hard",
        "expiryDate":       (datetime.datetime.now() + datetime.timedelta(days=10)).isoformat(),
        "participantCount": 89,
        "createdAt":        datetime.datetime.now().isoformat(),
    },
    {
        "challengeId":      "c3",
        "title":            "Plant Something",
        "description":      "Plant a seed, seedling, or tree and show us your new green friend!",
        "category":         "community",
        "points":           30,
        "difficulty":       "easy",
        "expiryDate":       (datetime.datetime.now() + datetime.timedelta(days=60)).isoformat(),
        "participantCount": 312,
        "createdAt":        datetime.datetime.now().isoformat(),
    },
    {
        "challengeId":      "c4",
        "title":            "30-Minute Daily Meditation",
        "description":      "Practice mindfulness for 30 minutes every day for 5 days.",
        "category":         "healthy-living",
        "points":           40,
        "difficulty":       "medium",
        "expiryDate":       (datetime.datetime.now() + datetime.timedelta(days=14)).isoformat(),
        "participantCount": 205,
        "createdAt":        datetime.datetime.now().isoformat(),
    },
    {
        "challengeId":      "c5",
        "title":            "Meatless Monday",
        "description":      "Go meat-free every Monday for a month and share your plant-based meals.",
        "category":         "food",
        "points":           35,
        "difficulty":       "easy",
        "expiryDate":       (datetime.datetime.now() + datetime.timedelta(days=45)).isoformat(),
        "participantCount": 428,
        "createdAt":        datetime.datetime.now().isoformat(),
    },
    {
        "challengeId":      "c6",
        "title":            "Reduce Water Usage",
        "description":      "Cut household water usage with shorter showers and fixing leaks.",
        "category":         "water",
        "points":           55,
        "difficulty":       "medium",
        "expiryDate":       (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat(),
        "participantCount": 167,
        "createdAt":        datetime.datetime.now().isoformat(),
    },
]
posts_db = {}  # challengeId → list of posts
leaderboard_db = [
    {"userId": "u1", "userName": "EcoAmy",    "totalPoints": 420, "challengesCompleted": 8},
    {"userId": "u2", "userName": "GreenJorge", "totalPoints": 380, "challengesCompleted": 7},
    {"userId": "u3", "userName": "SustainLee", "totalPoints": 310, "challengesCompleted": 6},
    {"userId": "u4", "userName": "NatureNia",  "totalPoints": 275, "challengesCompleted": 5},
    {"userId": "u5", "userName": "EcoMax",     "totalPoints": 200, "challengesCompleted": 4},
]


@app.route("/challenges", methods=["GET"])
def list_challenges():
    return jsonify({"challenges": challenges_db, "count": len(challenges_db)})


@app.route("/challenges/<cid>", methods=["GET"])
def get_challenge(cid):
    ch = next((c for c in challenges_db if c["challengeId"] == cid), None)
    if not ch:
        return jsonify({"message": "Not found"}), 404
    return jsonify(ch)


@app.route("/challenges/<cid>/join", methods=["POST"])
def join_challenge(cid):
    ch = next((c for c in challenges_db if c["challengeId"] == cid), None)
    if ch:
        ch["participantCount"] += 1
        ch["joined"] = True
    return jsonify({"message": "Joined", "challengeId": cid})


@app.route("/challenges/<cid>/posts", methods=["GET"])
def list_posts(cid):
    items = posts_db.get(cid, [])
    return jsonify({"posts": items, "count": len(items)})


@app.route("/posts", methods=["POST"])
def create_post():
    data = request.json or {}
    cid  = data.get("challengeId", "c1")
    post = {
        "postId":           str(uuid.uuid4()),
        "challengeId":      cid,
        "userId":           "mock-user",
        "userName":         "You",
        "content":          data.get("content", ""),
        "imageUrl":         data.get("imageUrl"),
        "likeCount":        0,
        "createdAt":        datetime.datetime.now().isoformat(),
        "moderationStatus": "approved",
        "sentiment":        "POSITIVE",
    }
    posts_db.setdefault(cid, []).insert(0, post)
    return jsonify(post), 201


@app.route("/posts/<pid>/like", methods=["POST"])
def like_post(pid):
    return jsonify({"message": "Liked"})


@app.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    return jsonify({"leaderboard": leaderboard_db})


@app.route("/users/<uid>", methods=["GET"])
def get_user(uid):
    return jsonify({
        "userId":               uid,
        "name":                 "EcoUser",
        "totalPoints":          150,
        "challengesCompleted":  3,
        "streakDays":           7,
        "joinedDate":           "2025-01-01T00:00:00Z",
        "recentCompletions":    [
            {"challengeId": "c1", "title": "Walk or Bike to Work",   "points": 50},
            {"challengeId": "c3", "title": "Plant Something",        "points": 30},
        ],
    })


@app.route("/upload-url", methods=["POST"])
def upload_url():
    return jsonify({"uploadUrl": "https://httpbin.org/put", "fileUrl": "https://placehold.co/400x300/4ade80/fff?text=Proof"})


if __name__ == "__main__":
    print("🌿 Mock API running at http://localhost:3001")
    print("   Set VITE_API_URL=http://localhost:3001 in frontend/.env")
    app.run(port=3001, debug=True)
