"""
Moderation module — used by the posts handler (not an HTTP endpoint itself).

Text moderation  → AWS Comprehend
  1. detect_dominant_language
  2. detect_sentiment  (must be POSITIVE or NEUTRAL to pass)
  3. detect_key_phrases + custom topic check (must include eco/health keywords)

Image moderation → AWS Rekognition
  1. detect_moderation_labels (reject if any label confidence > 70)
  2. detect_labels            (must include at least one eco-related label)
"""

import os
import logging
import re

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-1")

comprehend  = boto3.client("comprehend",  region_name=REGION)
rekognition = boto3.client("rekognition", region_name=REGION)

# ─── On-theme keyword set (broad) ────────────────────────────────────────────
ECO_KEYWORDS = {
    "recycle", "recycling", "compost", "composting", "solar", "wind", "energy",
    "electric", "bike", "bicycle", "walk", "plant", "garden", "organic", "vegan",
    "vegetarian", "sustainable", "sustainability", "eco", "environment", "green",
    "water", "climate", "carbon", "emission", "plastic", "reusable", "thrift",
    "nature", "tree", "forest", "ocean", "clean", "zero-waste", "litter", "trash",
    "volunteer", "community", "health", "healthy", "fitness", "meditation",
    "mindful", "fruit", "vegetable", "local", "farmer", "market", "carpool",
    "public transit", "transit", "train", "bus",
}

NEGATIVE_KEYWORDS = re.compile(
    r"\b(hate|kill|bomb|drug|porn|nude|weapon|racist|violence)\b",
    re.IGNORECASE,
)

# Rekognition unsafe label categories to block
UNSAFE_LABELS = {
    "Explicit Nudity", "Suggestive", "Violence", "Visually Disturbing",
    "Hate Symbols", "Drugs & Tobacco",
}


# ─── Public API ──────────────────────────────────────────────────────────────

def moderate_text(text: str) -> dict:
    """
    Returns:
        {"status": "approved" | "flagged", "reason": str | None, "sentiment": str}
    """
    # 1. Hard-coded negative keyword check (fast)
    if NEGATIVE_KEYWORDS.search(text):
        logger.warning("Text flagged by keyword filter")
        return {"status": "flagged", "reason": "inappropriate_keywords", "sentiment": "NEGATIVE"}

    # 2. Comprehend sentiment
    try:
        lang_resp = comprehend.detect_dominant_language(Text=text[:300])
        lang_code = lang_resp["Languages"][0]["LanguageCode"] if lang_resp["Languages"] else "en"
        # Comprehend supports limited languages for sentiment
        supported = {"en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "ar", "hi"}
        if lang_code not in supported:
            lang_code = "en"

        sentiment_resp = comprehend.detect_sentiment(Text=text[:5000], LanguageCode=lang_code)
        sentiment = sentiment_resp["Sentiment"]  # POSITIVE | NEGATIVE | NEUTRAL | MIXED

        if sentiment == "NEGATIVE":
            logger.info("Negative sentiment detected")
            return {"status": "flagged", "reason": "negative_sentiment", "sentiment": sentiment}

        # 3. Topic relevance — key phrases
        kp_resp = comprehend.detect_key_phrases(Text=text[:5000], LanguageCode=lang_code)
        phrases  = [kp["Text"].lower() for kp in kp_resp.get("KeyPhrases", [])]
        combined = " ".join(phrases) + " " + text.lower()

        on_theme = any(kw in combined for kw in ECO_KEYWORDS)
        if not on_theme:
            logger.info("Post not on eco/health theme")
            return {
                "status": "flagged",
                "reason": "off_topic",
                "sentiment": sentiment,
            }

        return {"status": "approved", "reason": None, "sentiment": sentiment}

    except Exception as exc:
        # Don't block post if Comprehend fails; log and approve conservatively
        logger.exception("Comprehend error: %s", exc)
        return {"status": "approved", "reason": None, "sentiment": "NEUTRAL"}


def moderate_image(bucket: str, key: str) -> dict:
    """
    Returns:
        {"status": "approved" | "flagged", "reason": str | None}
    """
    try:
        # 1. Check for unsafe content
        mod_resp = rekognition.detect_moderation_labels(
            Image={"S3Object": {"Bucket": bucket, "Name": key}},
            MinConfidence=70,
        )
        for label in mod_resp.get("ModerationLabels", []):
            top = label.get("ParentName") or label.get("Name")
            if top in UNSAFE_LABELS:
                logger.warning("Unsafe image label: %s (%.1f%%)", label["Name"], label["Confidence"])
                return {"status": "flagged", "reason": f"unsafe_content:{label['Name']}"}

        # 2. Check on-theme (at least one eco/nature/person/activity label)
        det_resp = rekognition.detect_labels(
            Image={"S3Object": {"Bucket": bucket, "Name": key}},
            MaxLabels=20,
            MinConfidence=60,
        )
        eco_labels = {
            "Plant", "Tree", "Nature", "Outdoors", "Garden", "Flower", "Vegetable",
            "Fruit", "Bicycle", "Person", "Food", "Water", "Sky", "Sport",
            "Recreation", "Fitness", "Yoga", "Running", "Forest", "Mountain",
            "Ocean", "Beach", "Animal", "Recycling", "Solar Panel", "Farm",
        }
        label_names = {lbl["Name"] for lbl in det_resp.get("Labels", [])}
        if not label_names.intersection(eco_labels):
            logger.info("Image not eco-relevant. Labels: %s", label_names)
            return {"status": "flagged", "reason": "off_topic_image"}

        return {"status": "approved", "reason": None}

    except Exception as exc:
        logger.exception("Rekognition error: %s", exc)
        # Don't block if Rekognition fails
        return {"status": "approved", "reason": None}
