"""
Lambda handler for /users endpoints.

Routes:
  GET /users/{id}  – get a user profile
  PUT /users/me    – update own profile
  POST /users/sync – called by Cognito post-confirmation trigger to create profile
"""

import json
import os
import logging
from datetime import datetime, timezone

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

USERS_TABLE = os.environ.get("USERS_TABLE", "EcoChallenges_Users")
dynamodb    = boto3.resource("dynamodb")
users_tbl   = dynamodb.Table(USERS_TABLE)


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


def handler(event: dict, context) -> dict:
    method      = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path_params = event.get("pathParameters") or {}
    user_id     = path_params.get("id")
    raw_path    = event.get("rawPath", "")
    caller_id   = get_user_id(event)
    body_raw    = event.get("body") or "{}"
    body        = json.loads(body_raw)

    # Cognito post-confirmation trigger (not an HTTP API event)
    if event.get("triggerSource") == "PostConfirmation_ConfirmSignUp":
        return cognito_post_confirm(event)

    if raw_path.endswith("/me") and method == "PUT":
        return update_profile(caller_id, body)

    if user_id and method == "GET":
        return get_profile(user_id)

    return response(404, {"message": "Not found"})


def get_profile(user_id: str) -> dict:
    try:
        res  = users_tbl.get_item(Key={"userId": user_id})
        item = res.get("Item")
        if not item:
            return response(404, {"message": "User not found"})
        # Don't expose sensitive fields
        item.pop("email", None)
        return response(200, item)
    except Exception as exc:
        logger.exception("get_profile error")
        return response(500, {"message": str(exc)})


def update_profile(caller_id: str | None, body: dict) -> dict:
    if not caller_id:
        return response(401, {"message": "Unauthorized"})
    allowed = {"bio", "avatarUrl", "location"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        return response(400, {"message": "No valid fields to update"})
    try:
        expr   = "SET " + ", ".join(f"#{k} = :{k}" for k in updates)
        names  = {f"#{k}": k for k in updates}
        values = {f":{k}": v for k, v in updates.items()}
        users_tbl.update_item(
            Key={"userId": caller_id},
            UpdateExpression=expr,
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
        )
        return response(200, {"message": "Profile updated"})
    except Exception as exc:
        logger.exception("update_profile error")
        return response(500, {"message": str(exc)})


def cognito_post_confirm(event: dict) -> dict:
    """
    Cognito PostConfirmation trigger — create a user record in DynamoDB
    when someone confirms their email.
    """
    attrs   = event.get("request", {}).get("userAttributes", {})
    user_id = attrs.get("sub")
    email   = attrs.get("email", "")
    name    = attrs.get("name", email.split("@")[0])
    now     = datetime.now(timezone.utc).isoformat()

    item = {
        "userId":               user_id,
        "email":                email,
        "name":                 name,
        "totalPoints":          0,
        "challengesCompleted":  0,
        "streakDays":           0,
        "joinedDate":           now,
        "recentCompletions":    [],
    }

    try:
        users_tbl.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(userId)",  # idempotent
        )
        logger.info("Created user profile for %s", user_id)
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        logger.info("User profile already exists for %s", user_id)
    except Exception as exc:
        logger.exception("cognito_post_confirm error: %s", exc)

    return event  # Cognito triggers must return the event
