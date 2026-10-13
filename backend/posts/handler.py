"""
Lambda handler for /posts endpoints.

Routes:
  GET  /challenges/{id}/posts  – list approved posts for a challenge
  POST /posts                  – submit a new post (runs moderation)
  POST /posts/{id}/like        – like a post
"""

import json
import os
import uuid
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse

import boto3
from boto3.dynamodb.conditions import Key

# Import moderation module (packaged alongside posts in the Lambda layer)
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from moderation.handler import moderate_text, moderate_image

logger = logging.getLogger()
logger.setLevel(logging.INFO)

POSTS_TABLE      = os.environ.get("POSTS_TABLE",      "EcoChallenges_Posts")
CHALLENGES_TABLE = os.environ.get("CHALLENGES_TABLE", "EcoChallenges_Challenges")
USERS_TABLE      = os.environ.get("USERS_TABLE",      "EcoChallenges_Users")
PROOF_BUCKET     = os.environ.get("PROOF_BUCKET",     "ecochallenges-proofs")

dynamodb   = boto3.resource("dynamodb")
posts_tbl  = dynamodb.Table(POSTS_TABLE)
chall_tbl  = dynamodb.Table(CHALLENGES_TABLE)
users_tbl  = dynamodb.Table(USERS_TABLE)


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
    claims = (
        event.get("requestContext", {})
             .get("authorizer", {})
             .get("jwt", {})
             .get("claims", {})
    )
    return claims.get("sub")


def get_user_name(event: dict) -> str:
    claims = (
        event.get("requestContext", {})
             .get("authorizer", {})
             .get("jwt", {})
             .get("claims", {})
    )
    return claims.get("name") or claims.get("email", "EcoUser").split("@")[0]


def s3_key_from_url(url: str) -> str | None:
    """Extract the S3 object key from a full S3 URL."""
    try:
        parsed = urlparse(url)
        return parsed.path.lstrip("/")
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    method       = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path_params  = event.get("pathParameters") or {}
    challenge_id = path_params.get("id")
    post_id      = path_params.get("postId")
    raw_path     = event.get("rawPath", "")
    body_raw     = event.get("body") or "{}"
    body         = json.loads(body_raw)
    user_id      = get_user_id(event)
    user_name    = get_user_name(event)

    # POST /posts/{postId}/like
    if post_id and "like" in raw_path and method == "POST":
        return like_post(post_id, user_id)

    # GET /challenges/{id}/posts
    if challenge_id and method == "GET":
        return list_posts(challenge_id)

    # POST /posts
    if method == "POST" and not challenge_id:
        return create_post(body, user_id, user_name)

    return response(404, {"message": "Not found"})


def list_posts(challenge_id: str) -> dict:
    try:
        res   = posts_tbl.query(
            IndexName="ChallengeIndex",
            KeyConditionExpression=Key("challengeId").eq(challenge_id),
        )
        items = res.get("Items", [])
        # Only return approved posts
        approved = [p for p in items if p.get("moderationStatus") == "approved"]
        approved.sort(key=lambda p: p.get("createdAt", ""), reverse=True)
        return response(200, {"posts": approved, "count": len(approved)})
    except Exception as exc:
        logger.exception("list_posts error")
        return response(500, {"message": str(exc)})


def create_post(body: dict, user_id: str | None, user_name: str) -> dict:
    if not user_id:
        return response(401, {"message": "Unauthorized"})

    challenge_id = body.get("challengeId")
    content      = (body.get("content") or "").strip()
    image_url    = body.get("imageUrl")

    if not challenge_id:
        return response(400, {"message": "Missing challengeId"})
    if not content:
        return response(400, {"message": "Missing content"})

    # ── 1. Text moderation ──────────────────────────────────────────────────
    text_result = moderate_text(content)
    moderation_status = text_result["status"]
    sentiment         = text_result.get("sentiment", "NEUTRAL")
    moderation_reason = text_result.get("reason")

    # ── 2. Image moderation (if provided) ──────────────────────────────────
    if image_url and moderation_status == "approved":
        key = s3_key_from_url(image_url)
        if key:
            img_result = moderate_image(PROOF_BUCKET, key)
            if img_result["status"] == "flagged":
                moderation_status = "flagged"
                moderation_reason = img_result.get("reason")

    # ── 3. Persist post ────────────────────────────────────────────────────
    now    = datetime.now(timezone.utc).isoformat()
    post   = {
        "postId":           str(uuid.uuid4()),
        "challengeId":      challenge_id,
        "userId":           user_id,
        "userName":         user_name,
        "content":          content,
        "imageUrl":         image_url,
        "likeCount":        0,
        "createdAt":        now,
        "moderationStatus": moderation_status,
        "moderationReason": moderation_reason,
        "sentiment":        sentiment,
    }

    try:
        posts_tbl.put_item(Item=post)

        # ── 4. If approved, award points to user ─────────────────────────
        if moderation_status == "approved":
            _award_points(challenge_id, user_id)

        logger.info("Post %s created with status=%s", post["postId"], moderation_status)
        return response(201, post)
    except Exception as exc:
        logger.exception("create_post error")
        return response(500, {"message": str(exc)})


def like_post(post_id: str, user_id: str | None) -> dict:
    if not user_id:
        return response(401, {"message": "Unauthorized"})
    try:
        posts_tbl.update_item(
            Key={"postId": post_id},
            UpdateExpression="ADD likeCount :one",
            ExpressionAttributeValues={":one": 1},
        )
        return response(200, {"message": "Liked"})
    except Exception as exc:
        logger.exception("like_post error")
        return response(500, {"message": str(exc)})


def _award_points(challenge_id: str, user_id: str):
    """
    Award points for completing a challenge — only once per user per challenge.
    Uses a DynamoDB condition to prevent double-awarding.
    """
    try:
        res  = chall_tbl.get_item(Key={"challengeId": challenge_id})
        item = res.get("Item", {})
        pts  = int(item.get("points", 10))

        # Record the completion as a set element — idempotent add
        users_tbl.update_item(
            Key={"userId": user_id},
            UpdateExpression=(
                "ADD totalPoints :p, challengesCompleted :one, "
                "completedChallenges :cid"
            ),
            # Only award if the user hasn't already completed this challenge
            ConditionExpression=(
                "attribute_not_exists(completedChallenges) OR "
                "NOT contains(completedChallenges, :cid_check)"
            ),
            ExpressionAttributeValues={
                ":p":         pts,
                ":one":       1,
                ":cid":       {challenge_id},
                ":cid_check": challenge_id,
            },
        )
        logger.info("Awarded %d points to user %s for challenge %s", pts, user_id, challenge_id)
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        logger.info(
            "User %s already completed challenge %s — no duplicate points awarded",
            user_id, challenge_id,
        )
    except Exception as exc:
        logger.exception("_award_points error: %s", exc)
