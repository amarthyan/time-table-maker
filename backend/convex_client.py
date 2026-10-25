import os
import httpx
from typing import Any, Dict, List, Optional

CONVEX_URL = os.getenv("CONVEX_URL", os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210"))

class ConvexClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or CONVEX_URL).rstrip("/")

    async def query(self, function_path: str, args: Dict[str, Any] = None, token: Optional[str] = None) -> Any:
        url = f"{self.base_url}/api/query"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        payload = {
            "path": function_path,
            "args": args or {}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return data.get("value")
            raise RuntimeError(f"Convex query failed ({res.status_code}): {res.text}")

    async def mutation(self, function_path: str, args: Dict[str, Any] = None, token: Optional[str] = None) -> Any:
        url = f"{self.base_url}/api/mutation"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        payload = {
            "path": function_path,
            "args": args or {}
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return data.get("value")
            raise RuntimeError(f"Convex mutation failed ({res.status_code}): {res.text}")

convex_client = ConvexClient()
