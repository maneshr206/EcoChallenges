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
CORS(app, resources={r"/*": {"origins": "*"}})

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
        "joined":           False,
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
        "joined":           False,
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
        "joined":           False,
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
        "joined":           False,
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
        "joined":           False,
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
        "joined":           False,
    },
]

posts_db = {}       # challengeId → list of posts
joined_db = set()   # set of challengeIds the mock user has joined

# Mock user state
mock_user = {
    "userId":              "mock-user",
    "name":                "Manesh Ravikumar",
    "email":               "manesh@example.com",
    "totalPoints":         150,
    "challengesCompleted": 3,
    "streakDays":          7,
    "joinedDate":          "2025-01-01T00:00:00Z",
    "recentCompletions":   [
        {"challengeId": "c1", "title": "Walk or Bike to Work", "points": 50},
        {"challengeId": "c3", "title": "Plant Something",      "points": 30},
    ],
}

leaderboard_db = [
    {"userId": "u1", "userName": "EcoAmy",     "totalPoints": 420, "challengesCompleted": 8},
    {"userId": "u2", "userName": "GreenJorge", "totalPoints": 380, "challengesCompleted": 7},
    {"userId": "u3", "userName": "SustainLee", "totalPoints": 310, "challengesCompleted": 6},
    {"userId": "u4", "userName": "NatureNia",  "totalPoints": 275, "challengesCompleted": 5},
    {"userId": "mock-user", "userName": "Manesh Ravikumar", "totalPoints": 150, "challengesCompleted": 3},
]

# Gift vouchers catalogue
vouchers_db = [
    {"voucherId": "v1", "brand": "Amazon",       "discount": "₹200 off",  "pointsCost": 100, "emoji": "📦", "category": "shopping"},
    {"voucherId": "v2", "brand": "Swiggy",        "discount": "₹150 off",  "pointsCost": 75,  "emoji": "🍔", "category": "food"},
    {"voucherId": "v3", "brand": "Zomato",        "discount": "₹100 off",  "pointsCost": 50,  "emoji": "🍕", "category": "food"},
    {"voucherId": "v4", "brand": "Nykaa",         "discount": "15% off",   "pointsCost": 80,  "emoji": "💄", "category": "beauty"},
    {"voucherId": "v5", "brand": "Decathlon",     "discount": "₹300 off",  "pointsCost": 150, "emoji": "🏃", "category": "sports"},
    {"voucherId": "v6", "brand": "BookMyShow",    "discount": "₹100 off",  "pointsCost": 60,  "emoji": "🎬", "category": "entertainment"},
    {"voucherId": "v7", "brand": "Starbucks",     "discount": "1 free drink","pointsCost": 90, "emoji": "☕", "category": "food"},
    {"voucherId": "v8", "brand": "Myntra",        "discount": "20% off",   "pointsCost": 120, "emoji": "👗", "category": "shopping"},
    {"voucherId": "v9", "brand": "Uber",          "discount": "₹75 off",   "pointsCost": 40,  "emoji": "🚗", "category": "travel"},
    {"voucherId": "v10","brand": "Treebo Hotels", "discount": "₹500 off",  "pointsCost": 200, "emoji": "🏨", "category": "travel"},
]
redeemed_db = []   # list of redeemed vouchers for mock user


# ─── Auth mock endpoints ─────────────────────────────────────────────────────
@app.route("/auth/login", methods=["POST"])
def login():
    return jsonify({
        "token": "mock-jwt-token",
        "user":  {"userId": "mock-user", "name": "Manesh Ravikumar", "email": "manesh@example.com"}
    })

@app.route("/auth/me", methods=["GET"])
def me():
    return jsonify({"userId": "mock-user", "name": "Manesh Ravikumar", "email": "manesh@example.com"})


# ─── Challenges ──────────────────────────────────────────────────────────────
@app.route("/challenges", methods=["GET"])
def list_challenges():
    # Attach joined status to each challenge
    result = []
    for c in challenges_db:
        ch = dict(c)
        ch["joined"] = c["challengeId"] in joined_db
        result.append(ch)
    return jsonify({"challenges": result, "count": len(result)})


@app.route("/challenges/<cid>", methods=["GET"])
def get_challenge(cid):
    ch = next((c for c in challenges_db if c["challengeId"] == cid), None)
    if not ch:
        return jsonify({"message": "Not found"}), 404
    result = dict(ch)
    result["joined"] = cid in joined_db
    return jsonify(result)


@app.route("/challenges/<cid>/join", methods=["POST"])
def join_challenge(cid):
    ch = next((c for c in challenges_db if c["challengeId"] == cid), None)
    if not ch:
        return jsonify({"message": "Challenge not found"}), 404

    # ── Prevent duplicate joins ──────────────────────────────────────────────
    if cid in joined_db:
        return jsonify({"message": "You have already joined this challenge", "alreadyJoined": True}), 400

    # Mark as joined and increment count ONCE
    joined_db.add(cid)
    ch["participantCount"] += 1
    ch["joined"] = True

    return jsonify({
        "message":        "Joined successfully",
        "challengeId":    cid,
        "participantCount": ch["participantCount"]
    })


# ─── Posts ────────────────────────────────────────────────────────────────────
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
        "userName":         "Manesh Ravikumar",
        "content":          data.get("content", ""),
        "imageUrl":         data.get("imageUrl"),
        "likeCount":        0,
        "createdAt":        datetime.datetime.now().isoformat(),
        "moderationStatus": "approved",
        "sentiment":        "POSITIVE",
    }
    posts_db.setdefault(cid, []).insert(0, post)

    # Award points to mock user
    ch = next((c for c in challenges_db if c["challengeId"] == cid), None)
    if ch:
        pts = ch.get("points", 10)
        mock_user["totalPoints"] += pts
        mock_user["challengesCompleted"] += 1
        # Update leaderboard entry
        for entry in leaderboard_db:
            if entry["userId"] == "mock-user":
                entry["totalPoints"] = mock_user["totalPoints"]
                entry["challengesCompleted"] = mock_user["challengesCompleted"]
        leaderboard_db.sort(key=lambda u: u["totalPoints"], reverse=True)

    return jsonify(post), 201


@app.route("/posts/<pid>/like", methods=["POST"])
def like_post(pid):
    for cid, posts in posts_db.items():
        for p in posts:
            if p["postId"] == pid:
                p["likeCount"] += 1
                return jsonify({"message": "Liked", "likeCount": p["likeCount"]})
    return jsonify({"message": "Liked"})


# ─── Leaderboard ─────────────────────────────────────────────────────────────
@app.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    return jsonify({"leaderboard": leaderboard_db})


# ─── Users ────────────────────────────────────────────────────────────────────
@app.route("/users/<uid>", methods=["GET"])
def get_user(uid):
    u = dict(mock_user)
    u["recentCompletions"] = mock_user["recentCompletions"]
    return jsonify(u)

@app.route("/users/me", methods=["PUT"])
def update_user():
    data = request.json or {}
    for k in ["bio", "location"]:
        if k in data:
            mock_user[k] = data[k]
    return jsonify({"message": "Updated"})


# ─── Upload URL ───────────────────────────────────────────────────────────────
@app.route("/upload-url", methods=["POST"])
def upload_url():
    return jsonify({
        "uploadUrl": "https://httpbin.org/put",
        "fileUrl":   "https://placehold.co/400x300/4ade80/fff?text=Proof+Photo"
    })


# ─── Vouchers ─────────────────────────────────────────────────────────────────
@app.route("/vouchers", methods=["GET"])
def list_vouchers():
    return jsonify({"vouchers": vouchers_db, "userPoints": mock_user["totalPoints"]})


@app.route("/vouchers/<vid>/redeem", methods=["POST"])
def redeem_voucher(vid):
    voucher = next((v for v in vouchers_db if v["voucherId"] == vid), None)
    if not voucher:
        return jsonify({"message": "Voucher not found"}), 404

    if mock_user["totalPoints"] < voucher["pointsCost"]:
        return jsonify({"message": f"Not enough points. Need {voucher['pointsCost']}, have {mock_user['totalPoints']}"}), 400

    # Deduct points
    mock_user["totalPoints"] -= voucher["pointsCost"]

    # Update leaderboard
    for entry in leaderboard_db:
        if entry["userId"] == "mock-user":
            entry["totalPoints"] = mock_user["totalPoints"]

    # Generate mock voucher code
    code = f"ECO-{voucher['brand'][:3].upper()}-{str(uuid.uuid4())[:6].upper()}"
    redemption = {
        "redemptionId": str(uuid.uuid4()),
        "voucherId":    vid,
        "brand":        voucher["brand"],
        "discount":     voucher["discount"],
        "code":         code,
        "redeemedAt":   datetime.datetime.now().isoformat(),
        "pointsSpent":  voucher["pointsCost"],
        "remainingPoints": mock_user["totalPoints"],
    }
    redeemed_db.append(redemption)
    return jsonify(redemption), 201


@app.route("/vouchers/redeemed", methods=["GET"])
def list_redeemed():
    return jsonify({"redeemed": redeemed_db, "userPoints": mock_user["totalPoints"]})


if __name__ == "__main__":
    print("🌿 EcoChallenges Mock API running at http://localhost:3001")
    app.run(port=3001, debug=False)
