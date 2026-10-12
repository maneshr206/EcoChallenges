"""
Lambda handler for /challenges endpoints.

Routes handled:
  GET  /challenges           – list active challenges (filtered by expiryDate)
  GET  /challenges/{id}      – get single challenge
  POST /challenges           – create a challenge (admin or seeding)
  POST /challenges/{id}/join – join a challenge
"""

import json
import os
import uuid
import logging
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key, Attr

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CHALLENGES_TABLE = os.environ.get("CHALLENGES_TABLE", "EcoChallenges_Challenges")
USERS_TABLE      = os.environ.get("USERS_TABLE",      "EcoChallenges_Users")

dynamodb   = boto3.resource("dynamodb")
challenges = dynamodb.Table(CHALLENGES_TABLE)
users      = dynamodb.Table(USERS_TABLE)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Authorization,Content-Type",
        },
        "body": json.dumps(body, default=str),
    }


def get_user_id(event: dict) -> str | None:
    """Extract userId from the Cognito authorizer claims."""
    claims = (
        event.get("requestContext", {})
             .get("authorizer", {})
             .get("jwt", {})
             .get("claims", {})
    )
    return claims.get("sub")


def is_active(challenge: dict) -> bool:
    """Return True if the challenge has not expired."""
    expiry = challenge.get("expiryDate")
    if not expiry:
        return True
    return datetime.fromisoformat(expiry) > datetime.now(timezone.utc)


# ─── Handler ─────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    method      = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path_params = event.get("pathParameters") or {}
    challenge_id = path_params.get("id")
    body_raw    = event.get("body") or "{}"
    body        = json.loads(body_raw)
    qsp         = event.get("queryStringParameters") or {}
    user_id     = get_user_id(event)

    logger.info("Request: %s %s  user=%s", method, event.get("rawPath"), user_id)

    # POST /challenges/{id}/join
    if challenge_id and method == "POST" and "join" in (event.get("rawPath") or ""):
        return join_challenge(challenge_id, user_id)

    # GET /challenges/{id}
    if challenge_id and method == "GET":
        return get_challenge(challenge_id)

    # POST /challenges
    if not challenge_id and method == "POST":
        return create_challenge(body, user_id)

    # GET /challenges
    return list_challenges(qsp)


def list_challenges(qsp: dict) -> dict:
    """
    Scan all challenges and filter out expired ones.
    Optionally filter by ?category=eco-friendly
    """
    try:
        result = challenges.scan()
        items  = result.get("Items", [])

        # Continue paginating
        while "LastEvaluatedKey" in result:
            result = challenges.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
            items.extend(result.get("Items", []))

        # Filter active
        active = [c for c in items if is_active(c)]

        # Optional category filter
        category = qsp.get("category")
        if category:
            active = [c for c in active if c.get("category") == category]

        # Sort by createdAt descending
        active.sort(key=lambda c: c.get("createdAt", ""), reverse=True)

        return response(200, {"challenges": active, "count": len(active)})
    except Exception as exc:
        logger.exception("list_challenges error")
        return response(500, {"message": str(exc)})


def get_challenge(challenge_id: str) -> dict:
    try:
        res = challenges.get_item(Key={"challengeId": challenge_id})
        item = res.get("Item")
        if not item:
            return response(404, {"message": "Challenge not found"})
        return response(200, item)
    except Exception as exc:
        logger.exception("get_challenge error")
        return response(500, {"message": str(exc)})


def create_challenge(body: dict, user_id: str | None) -> dict:
    required = ["title", "description", "category", "points"]
    for field in required:
        if field not in body:
            return response(400, {"message": f"Missing field: {field}"})

    now = datetime.now(timezone.utc).isoformat()
    item = {
        "challengeId":      str(uuid.uuid4()),
        "title":            body["title"][:200],
        "description":      body["description"][:1000],
        "category":         body["category"],
        "points":           int(body["points"]),
        "difficulty":       body.get("difficulty", "medium"),
        "expiryDate":       body.get("expiryDate"),
        "createdAt":        now,
        "createdBy":        user_id,
        "participantCount": 0,
    }

    try:
        challenges.put_item(Item=item)
        return response(201, item)
    except Exception as exc:
        logger.exception("create_challenge error")
        return response(500, {"message": str(exc)})


def join_challenge(challenge_id: str, user_id: str | None) -> dict:
    if not user_id:
        return response(401, {"message": "Unauthorized"})
    try:
        # Increment participantCount
        challenges.update_item(
            Key={"challengeId": challenge_id},
            UpdateExpression="ADD participantCount :one",
            ExpressionAttributeValues={":one": 1},
        )
        # Record the join on the user profile
        users.update_item(
            Key={"userId": user_id},
            UpdateExpression="ADD joinedChallenges :cid",
            ExpressionAttributeValues={":cid": {challenge_id}},
        )
        return response(200, {"message": "Joined successfully", "challengeId": challenge_id})
    except Exception as exc:
        logger.exception("join_challenge error")
        return response(500, {"message": str(exc)})
