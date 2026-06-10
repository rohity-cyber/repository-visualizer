"""
AI integration with local disk cache.
Supports Anthropic Claude via the /v1/messages endpoint.
"""
import os
import json
import hashlib
import asyncio
from pathlib import Path

import httpx

CACHE_FILE = Path(__file__).parent / ".ai_cache.json"


class AIService:
    def __init__(self):
        self._cache: dict = self._load_cache()

    # ------------------------------------------------------------------ cache
    def _load_cache(self) -> dict:
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, "r") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_cache(self):
        with open(CACHE_FILE, "w") as f:
            json.dump(self._cache, f, indent=2)

    def get_cached(self, file_hash: str) -> str | None:
        return self._cache.get(file_hash)

    def set_cache(self, file_hash: str, explanation: str):
        self._cache[file_hash] = explanation
        self._save_cache()

    # --------------------------------------------------------------- AI call
    async def explain_code(self, code: str, filename: str) -> str:
        """
        Calls the Anthropic Claude API to explain a code file.
        Falls back to a static message if no API key is configured.
        """
        api_key = os.getenv("ANTHROPIC_API_KEY", "")

        if not api_key:
            return (
                "No AI API key configured. "
                "Set the ANTHROPIC_API_KEY environment variable to enable AI explanations."
            )

        # Truncate very large files to stay within token limits
        snippet = code[:12_000] + ("\n\n[... file truncated ...]" if len(code) > 12_000 else "")

        prompt = (
            f"You are a senior software engineer reviewing a file called `{filename}`.\n"
            f"Explain what this file does in exactly 3 clear, plain-English sentences "
            f"suitable for a developer who has never seen this codebase.\n\n"
            f"File contents:\n```\n{snippet}\n```"
        )

        headers = {
            "x-api-key":         api_key,
            "anthropic-version": "2023-06-01",
            "content-type":      "application/json",
        }

        payload = {
            "model":      "claude-sonnet-4-20250514",
            "max_tokens": 300,
            "messages":   [{"role": "user", "content": prompt}],
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data["content"][0]["text"].strip()
        except httpx.HTTPStatusError as e:
            return f"AI API error ({e.response.status_code}): {e.response.text}"
        except Exception as e:
            return f"Could not reach AI service: {str(e)}"