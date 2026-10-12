"""
Lambda handler for GET /leaderboard

Scans the Users table, sorts by totalPoints descending, returns top 50.
In production you'd use a GSI on totalPoints for efficiency.
"""

import json
import os
import logging

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


def handler(event: dict, context) -> dict:
    try:
        result = users_tbl.scan(
            ProjectionExpression="userId, #n, totalPoints, challengesCompleted, streakDays",
            ExpressionAttributeNames={"#n": "name"},
        )
        items = result.get("Items", [])

        while "LastEvaluatedKey" in result:
            result = users_tbl.scan(
                ExclusiveStartKey=result["LastEvaluatedKey"],
                ProjectionExpression="userId, #n, totalPoints, challengesCompleted, streakDays",
                ExpressionAttributeNames={"#n": "name"},
            )
            items.extend(result.get("Items", []))

        # Sort by points
        items.sort(key=lambda u: int(u.get("totalPoints", 0)), reverse=True)
        top50 = items[:50]

        # Rename 'name' → 'userName' for frontend consistency
        for u in top50:
            u["userName"] = u.pop("name", "EcoUser")

        return response(200, {"leaderboard": top50, "count": len(top50)})
    except Exception as exc:
        logger.exception("leaderboard error")
        return response(500, {"message": str(exc)})
