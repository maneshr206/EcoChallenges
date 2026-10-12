#!/usr/bin/env python3
"""
Seed DynamoDB with sample EcoChallenges.
Usage:
    python scripts/seed_challenges.py [--table EcoChallenges_Challenges] [--region us-east-1]
"""

import argparse
import uuid
import json
from datetime import datetime, timezone, timedelta

import boto3

CHALLENGES = [
    {
        "title": "Walk or Bike to Work",
        "description": "Skip the car for one full week and commute by walking, biking, or public transit. Log your trip each day and share a photo!",
        "category": "eco-friendly",
        "points": 50,
        "difficulty": "medium",
        "daysUntilExpiry": 30,
    },
    {
        "title": "7-Day Zero-Plastic Challenge",
        "description": "Avoid single-use plastics for 7 days. No plastic bags, straws, bottles, or packaging. Document your creative alternatives.",
        "category": "eco-friendly",
        "points": 70,
        "difficulty": "hard",
        "daysUntilExpiry": 21,
    },
    {
        "title": "Plant Something",
        "description": "Plant a seed, seedling, or tree in your garden, a pot, or a community space. Show us your new green friend!",
        "category": "community",
        "points": 30,
        "difficulty": "easy",
        "daysUntilExpiry": 60,
    },
    {
        "title": "30-Minute Daily Meditation",
        "description": "Practice mindfulness for 30 minutes every day for 5 days. Share your favourite spot and how it made you feel.",
        "category": "healthy-living",
        "points": 40,
        "difficulty": "medium",
        "daysUntilExpiry": 14,
    },
    {
        "title": "Meatless Monday",
        "description": "Go meat-free every Monday for a month. Post your favourite plant-based meals and inspire the community.",
        "category": "food",
        "points": 35,
        "difficulty": "easy",
        "daysUntilExpiry": 45,
    },
    {
        "title": "Cold Shower Week",
        "description": "Take cold showers for 7 consecutive days to save energy and boost circulation. Log each morning shower.",
        "category": "energy",
        "points": 45,
        "difficulty": "hard",
        "daysUntilExpiry": 14,
    },
    {
        "title": "5-Minute Daily Litter Pick",
        "description": "Spend 5 minutes picking up litter in your neighbourhood every day for a week. Photo evidence required.",
        "category": "community",
        "points": 40,
        "difficulty": "easy",
        "daysUntilExpiry": 28,
    },
    {
        "title": "Reduce Water Usage",
        "description": "Cut your household water usage by taking shorter showers, turning off taps, and fixing leaks. Track before and after.",
        "category": "water",
        "points": 55,
        "difficulty": "medium",
        "daysUntilExpiry": 30,
    },
    {
        "title": "DIY Compost Bin",
        "description": "Set up a composting system at home using kitchen scraps. Show us your setup and first batch!",
        "category": "eco-friendly",
        "points": 60,
        "difficulty": "medium",
        "daysUntilExpiry": 90,
    },
    {
        "title": "Thrift Shop Challenge",
        "description": "Buy your next clothing item or household good second-hand. Post your thrift find and how much you saved!",
        "category": "eco-friendly",
        "points": 25,
        "difficulty": "easy",
        "daysUntilExpiry": 60,
    },
]


def seed(table_name: str, region: str):
    dynamodb = boto3.resource("dynamodb", region_name=region)
    table    = dynamodb.Table(table_name)
    now      = datetime.now(timezone.utc)

    with table.batch_writer() as batch:
        for ch in CHALLENGES:
            expiry = (now + timedelta(days=ch.pop("daysUntilExpiry"))).isoformat()
            item   = {
                "challengeId":      str(uuid.uuid4()),
                "createdAt":        now.isoformat(),
                "expiryDate":       expiry,
                "participantCount": 0,
                **ch,
            }
            batch.put_item(Item=item)
            print(f"  ✓ {item['title']}")

    print(f"\nSeeded {len(CHALLENGES)} challenges into {table_name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--table",  default="EcoChallenges_Challenges")
    parser.add_argument("--region", default="us-east-1")
    args = parser.parse_args()
    seed(args.table, args.region)
