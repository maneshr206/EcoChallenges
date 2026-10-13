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

# users_db: stores each registered/logged-in user by userId
# New users start with 0 points and no completions
users_db = {}

def get_or_create_user(user_id, name, email):
    """Return existing user or create a fresh one with zero points."""
    if user_id not in users_db:
        # Generate an eco-themed username from the name
        first = name.split()[0] if name else "Eco"
        eco_handles = ["EcoWarrior", "GreenChamp", "NatureGuard", "EcoHero", "PlanetSaver",
                       "CleanAir", "GreenMind", "EcoRanger", "TreeGuard", "ZeroWaste"]
        import random, hashlib
        seed = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % len(eco_handles)
        eco_tag = eco_handles[seed]
        users_db[user_id] = {
            "userId":              user_id,
            "name":                name,
            "username":            f"{first}_{eco_tag}",   # e.g. Manesh_EcoWarrior
            "email":               email,
            "totalPoints":         0,
            "challengesCompleted": 0,
            "streakDays":          0,
            "joinedDate":          datetime.datetime.now().isoformat(),
            "recentCompletions":   [],
        }
    return users_db[user_id]

leaderboard_db = [
    {"userId": "u1", "userName": "EcoAmy_GreenChamp",   "totalPoints": 420, "challengesCompleted": 8},
    {"userId": "u2", "userName": "Jorge_NatureGuard",   "totalPoints": 380, "challengesCompleted": 7},
    {"userId": "u3", "userName": "Lee_PlanetSaver",     "totalPoints": 310, "challengesCompleted": 6},
    {"userId": "u4", "userName": "Nia_TreeGuard",       "totalPoints": 275, "challengesCompleted": 5},
    {"userId": "u5", "userName": "Alex_ZeroWaste",      "totalPoints": 190, "challengesCompleted": 4},
]

# Gift vouchers catalogue — Canadian brands
vouchers_db = [
    {"voucherId": "v1",  "brand": "Tim Hortons",      "discount": "$10 off",        "pointsCost": 50,  "emoji": "☕", "category": "food"},
    {"voucherId": "v2",  "brand": "Sport Chek",        "discount": "15% off",        "pointsCost": 80,  "emoji": "🏃", "category": "sports"},
    {"voucherId": "v3",  "brand": "Indigo",            "discount": "$15 off",        "pointsCost": 75,  "emoji": "📚", "category": "shopping"},
    {"voucherId": "v4",  "brand": "Loblaws",           "discount": "$20 off groceries","pointsCost": 100,"emoji": "🛒", "category": "shopping"},
    {"voucherId": "v5",  "brand": "Cineplex",          "discount": "1 free ticket",  "pointsCost": 120, "emoji": "🎬", "category": "entertainment"},
    {"voucherId": "v6",  "brand": "Canada Goose",      "discount": "$50 off",        "pointsCost": 200, "emoji": "🧥", "category": "shopping"},
    {"voucherId": "v7",  "brand": "Roots",             "discount": "20% off",        "pointsCost": 90,  "emoji": "🍁", "category": "shopping"},
    {"voucherId": "v8",  "brand": "Earls Kitchen",     "discount": "$25 off",        "pointsCost": 110, "emoji": "🍽️", "category": "food"},
    {"voucherId": "v9",  "brand": "MEC",               "discount": "$30 off",        "pointsCost": 150, "emoji": "🏕️", "category": "sports"},
    {"voucherId": "v10", "brand": "Aeroplan",          "discount": "500 bonus miles", "pointsCost": 175, "emoji": "✈️", "category": "travel"},
]
redeemed_db = []   # list of redeemed vouchers for mock user


# ─── Auth mock endpoints ─────────────────────────────────────────────────────
@app.route("/auth/login", methods=["POST"])
def login():
    data  = request.json or {}
    email = data.get("email", "user@example.com")
    name  = data.get("name") or email.split("@")[0].capitalize()
    uid   = "user-" + email.replace("@","_").replace(".","_")
    user  = get_or_create_user(uid, name, email)
    return jsonify({"token": "mock-jwt-token", "user": user})

@app.route("/auth/me", methods=["GET"])
def me():
    # Read current user from session header if provided, else default
    return jsonify({"userId": "mock-user", "name": "EcoChallenges User"})


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
    data    = request.json or {}
    cid     = data.get("challengeId", "c1")
    user_id = data.get("userId", list(users_db.keys())[0] if users_db else "unknown")
    user    = users_db.get(user_id, {})
    user_name = user.get("username") or user.get("name") or "EcoChallenger"

    post = {
        "postId":           str(uuid.uuid4()),
        "challengeId":      cid,
        "userId":           user_id,
        "userName":         user_name,
        "content":          data.get("content", ""),
        "imageUrl":         data.get("imageUrl"),
        "likeCount":        0,
        "createdAt":        datetime.datetime.now().isoformat(),
        "moderationStatus": "approved",
        "sentiment":        "POSITIVE",
    }
    posts_db.setdefault(cid, []).insert(0, post)

    # Award points to the correct user only
    ch = next((c for c in challenges_db if c["challengeId"] == cid), None)
    if ch and user_id in users_db:
        pts = ch.get("points", 10)
        u   = users_db[user_id]
        u["totalPoints"]         += pts
        u["challengesCompleted"] += 1
        u["recentCompletions"].insert(0, {
            "challengeId": cid,
            "title":       ch["title"],
            "points":      pts,
        })
        # Keep only last 5 completions
        u["recentCompletions"] = u["recentCompletions"][:5]
        # Update or insert in leaderboard
        entry = next((e for e in leaderboard_db if e["userId"] == user_id), None)
        if entry:
            entry["totalPoints"]         = u["totalPoints"]
            entry["challengesCompleted"] = u["challengesCompleted"]
        else:
            leaderboard_db.append({
                "userId":              user_id,
                "userName":            user_name,
                "totalPoints":         u["totalPoints"],
                "challengesCompleted": u["challengesCompleted"],
            })
        leaderboard_db.sort(key=lambda x: x["totalPoints"], reverse=True)

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
@app.route("/users/register", methods=["POST"])
def register_user():
    """Called by frontend on login/signup to ensure user record exists."""
    data    = request.json or {}
    user_id = data.get("userId")
    name    = data.get("name", "EcoChallenger")
    email   = data.get("email", "")
    if not user_id:
        return jsonify({"message": "userId required"}), 400
    user = get_or_create_user(user_id, name, email)
    return jsonify(user), 201


@app.route("/users/<uid>", methods=["GET"])
def get_user(uid):
    # Get real stored user or return a clean zero-points profile
    if uid in users_db:
        return jsonify(users_db[uid])
    # Fallback for unknown UIDs (e.g. leaderboard mock users)
    return jsonify({
        "userId":              uid,
        "name":                "EcoChallenger",
        "username":            "EcoChallenger",
        "email":               "",
        "totalPoints":         0,
        "challengesCompleted": 0,
        "streakDays":          0,
        "joinedDate":          datetime.datetime.now().isoformat(),
        "recentCompletions":   [],
    })

@app.route("/users/me", methods=["PUT"])
def update_user():
    data = request.json or {}
    # Find the current user (first in users_db for mock)
    if users_db:
        uid  = next(iter(users_db))
        user = users_db[uid]
        for k in ["bio", "location", "name"]:
            if k in data:
                user[k] = data[k]
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
    # Get points for the current user (first logged-in user)
    current_points = 0
    if users_db:
        uid = next(iter(users_db))
        current_points = users_db[uid].get("totalPoints", 0)
    return jsonify({"vouchers": vouchers_db, "userPoints": current_points})


@app.route("/vouchers/<vid>/redeem", methods=["POST"])
def redeem_voucher(vid):
    voucher = next((v for v in vouchers_db if v["voucherId"] == vid), None)
    if not voucher:
        return jsonify({"message": "Voucher not found"}), 404

    if not users_db:
        return jsonify({"message": "No user logged in"}), 401

    uid  = next(iter(users_db))
    user = users_db[uid]

    if user["totalPoints"] < voucher["pointsCost"]:
        return jsonify({"message": f"Not enough points. Need {voucher['pointsCost']}, you have {user['totalPoints']}"}), 400

    user["totalPoints"] -= voucher["pointsCost"]

    # Update leaderboard
    for entry in leaderboard_db:
        if entry["userId"] == uid:
            entry["totalPoints"] = user["totalPoints"]

    code = f"ECO-{voucher['brand'][:3].upper()}-{str(uuid.uuid4())[:6].upper()}"
    redemption = {
        "redemptionId":    str(uuid.uuid4()),
        "voucherId":       vid,
        "brand":           voucher["brand"],
        "discount":        voucher["discount"],
        "code":            code,
        "redeemedAt":      datetime.datetime.now().isoformat(),
        "pointsSpent":     voucher["pointsCost"],
        "remainingPoints": user["totalPoints"],
    }
    redeemed_db.append(redemption)
    return jsonify(redemption), 201


@app.route("/vouchers/redeemed", methods=["GET"])
def list_redeemed():
    current_points = 0
    if users_db:
        uid = next(iter(users_db))
        current_points = users_db[uid].get("totalPoints", 0)
    return jsonify({"redeemed": redeemed_db, "userPoints": current_points})


if __name__ == "__main__":
    print("🌿 EcoChallenges Mock API running at http://localhost:3001")
    app.run(port=3001, debug=False)
