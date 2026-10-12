"""
Lambda handler for POST /upload-url

Generates a presigned S3 PUT URL so the browser can upload a proof image
directly to S3 without routing through Lambda.
"""

import json
import os
import uuid
import logging

import boto3

logger     = logging.getLogger()
logger.setLevel(logging.INFO)

PROOF_BUCKET = os.environ.get("PROOF_BUCKET", "ecochallenges-proofs")
REGION       = os.environ.get("AWS_REGION",   "us-east-1")

s3 = boto3.client("s3", region_name=REGION)


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
    body_raw    = event.get("body") or "{}"
    body        = json.loads(body_raw)
    filename    = body.get("filename", "upload.jpg")
    content_type = body.get("contentType", "image/jpeg")

    # Sanitise filename
    ext  = os.path.splitext(filename)[-1].lower() or ".jpg"
    key  = f"proofs/{uuid.uuid4()}{ext}"

    try:
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket":      PROOF_BUCKET,
                "Key":         key,
                "ContentType": content_type,
            },
            ExpiresIn=300,  # 5 minutes
        )
        file_url = f"https://{PROOF_BUCKET}.s3.{REGION}.amazonaws.com/{key}"
        return response(200, {"uploadUrl": upload_url, "fileUrl": file_url, "key": key})
    except Exception as exc:
        logger.exception("upload_url error")
        return response(500, {"message": str(exc)})
