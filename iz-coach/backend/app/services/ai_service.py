"""Groq AI service — shared AI call logic (free, no credit card needed)."""

import json
from openai import AsyncOpenAI
from app.config import settings

# Groq API is OpenAI-compatible — just change the base_url
client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


async def call_openai(system_prompt: str, user_content: str, *, temperature: float = 0.7) -> dict:
    """Call Groq and return parsed JSON response."""
    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or "{}"
    return json.loads(raw)


async def call_openai_chat(system_prompt: str, messages: list[dict], *, temperature: float = 0.7) -> str:
    """Call Groq with multi-turn chat history; returns plain text."""
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=full_messages,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""
