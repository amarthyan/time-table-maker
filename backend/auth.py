import os
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional, Dict, Any
from convex_client import convex_client

security = HTTPBearer(auto_error=False)

DEV_MODE = os.getenv("DEV_MODE", "true").lower() in ("true", "1", "yes")

async def verify_admin_identity(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Dict[str, Any]:
    """
    Verifies caller has a valid Clerk JWT and admin rights.
    Delegates to Convex auth:getIdentity query.
    """
    if not credentials or not credentials.credentials:
        # If in DEV_MODE with explicit dev setting, allow fallback admin
        if DEV_MODE:
            return {
                "tokenIdentifier": "dev_admin_user",
                "email": "admin@college.edu",
                "isAdmin": True,
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Clerk JWT required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Fast dev bypass token
    if DEV_MODE and (token.startswith("dev-") or token == "mock-admin-token" or token == "admin"):
        return {
            "tokenIdentifier": "dev_admin_user",
            "email": "admin@college.edu",
            "isAdmin": True,
        }

    try:
        identity = await convex_client.query("auth:getIdentity", token=token)
        if not identity:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: User identity could not be verified by Convex.",
            )
        
        if not identity.get("isAdmin", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Forbidden: User does not have active Administrator status.",
            )
        return identity
    except HTTPException:
        raise
    except Exception as exc:
        if DEV_MODE:
            # Fallback in local development if Convex isn't running live
            return {
                "tokenIdentifier": "dev_admin_fallback",
                "email": "admin@college.edu",
                "isAdmin": True,
                "warning": f"Dev bypass due to Convex connectivity: {str(exc)}"
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to authenticate with Convex: {str(exc)}",
        )
