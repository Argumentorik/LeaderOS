"""S3 client for the Railway `media` bucket (private, S3-compatible).

One bucket, two areas:
  public/<name>   served to anyone via GET /api/media/<name> (routes/media.py)
  everything else private; read and written by the backend only
                  (routes/uploads.py: profile pictures, guide clips, posters,
                  course uploads — same keys the Emergent store used)

Config (railway.ts, references to the bucket): MEDIA_S3_ENDPOINT,
MEDIA_S3_BUCKET, MEDIA_S3_ACCESS_KEY_ID, MEDIA_S3_SECRET_ACCESS_KEY.
Railway's storage signs with region "auto" (MEDIA_S3_REGION is informational).
"""
import os
from functools import lru_cache


def bucket_name() -> str | None:
    return os.environ.get("MEDIA_S3_BUCKET") or None


def is_configured() -> bool:
    return bool(os.environ.get("MEDIA_S3_ENDPOINT") and bucket_name())


@lru_cache(maxsize=1)
def client():
    """boto3 S3 client, or None when the bucket isn't configured."""
    if not is_configured():
        return None
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=os.environ["MEDIA_S3_ENDPOINT"],
        aws_access_key_id=os.environ.get("MEDIA_S3_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("MEDIA_S3_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"}, signature_version="s3v4",
                      retries={"max_attempts": 3, "mode": "standard"}),
    )
