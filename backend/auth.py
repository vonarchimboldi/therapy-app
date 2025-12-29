"""
Authentication middleware for Clerk JWT verification
"""
import os
import jwt
import requests
from functools import lru_cache
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db
import sqlite3

security = HTTPBearer()


@lru_cache(maxsize=1)
def get_clerk_jwks() -> Dict[str, Any]:
    """
    Fetch Clerk's JSON Web Key Set (JWKS) for token verification
    Cached to avoid repeated API calls
    """
    clerk_frontend_api = os.getenv('CLERK_FRONTEND_API')

    if not clerk_frontend_api:
        raise RuntimeError("CLERK_FRONTEND_API environment variable not set")

    jwks_url = f"https://{clerk_frontend_api}/.well-known/jwks.json"

    try:
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Clerk JWKS: {str(e)}"
        )


def get_signing_key(token: str) -> str:
    """
    Extract the signing key from JWKS for token verification
    """
    try:
        # Decode token header to get key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')

        if not kid:
            raise HTTPException(status_code=401, detail="Token missing key ID")

        # Get JWKS and find matching key
        jwks = get_clerk_jwks()

        for key in jwks.get('keys', []):
            if key.get('kid') == kid:
                # Convert JWK to PEM format for PyJWT
                from jwt.algorithms import RSAAlgorithm
                public_key = RSAAlgorithm.from_jwk(key)
                return public_key

        raise HTTPException(status_code=401, detail="Unable to find signing key")

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verify Clerk JWT token and return clerk_user_id

    Returns:
        clerk_user_id (str): The Clerk user ID from the token's 'sub' claim
    """
    token = credentials.credentials

    try:
        # Get signing key
        signing_key = get_signing_key(token)

        # Verify and decode token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=['RS256'],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
            }
        )

        # Extract clerk_user_id from 'sub' claim
        clerk_user_id = payload.get('sub')

        if not clerk_user_id:
            raise HTTPException(status_code=401, detail="Token missing subject claim")

        return clerk_user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


async def get_current_therapist(clerk_user_id: str = Depends(verify_token)) -> Dict[str, Any]:
    """
    Get or create therapist record from clerk_user_id

    This function auto-syncs therapist records:
    - If therapist exists, return their record
    - If therapist doesn't exist, create a new record

    Args:
        clerk_user_id: The Clerk user ID from the verified token

    Returns:
        Therapist database record as dictionary
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Try to find existing therapist
        cursor.execute(
            "SELECT * FROM therapists WHERE clerk_user_id = ?",
            (clerk_user_id,)
        )

        row = cursor.fetchone()

        if row:
            # Therapist exists, return their record
            return dict(row)

        # Therapist doesn't exist, create new record
        # In a real app, you'd fetch user details from Clerk API here
        # For now, we'll create a minimal record
        cursor.execute("""
            INSERT INTO therapists (clerk_user_id, email, first_name, last_name)
            VALUES (?, ?, ?, ?)
        """, (
            clerk_user_id,
            f"{clerk_user_id}@clerk.temp",  # Placeholder email
            "New",  # Placeholder first name
            "Therapist"  # Placeholder last name
        ))

        # Get the newly created record
        cursor.execute(
            "SELECT * FROM therapists WHERE id = ?",
            (cursor.lastrowid,)
        )

        new_therapist = cursor.fetchone()

        if not new_therapist:
            raise HTTPException(status_code=500, detail="Failed to create therapist record")

        return dict(new_therapist)


# Optional: For endpoints that should work without authentication (for testing)
async def get_current_therapist_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security, auto_error=False)
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication - returns None if no token provided
    Useful for endpoints that can work with or without authentication
    """
    if not credentials:
        return None

    try:
        clerk_user_id = await verify_token(credentials)
        return await get_current_therapist(clerk_user_id)
    except HTTPException:
        return None
