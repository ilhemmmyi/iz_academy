"""POST /chat — Conversational career coach."""

import json
from fastapi import APIRouter, HTTPException
from app.schemas import ChatRequest, ChatResponse
from app.services.ai_service import call_openai_chat
from app.prompts import SYSTEM_PROMPT_CHAT

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Build context snippet injected before the conversation
    context_parts = []
    if req.context.get("profile_summary"):
        context_parts.append(f"Profil : {req.context['profile_summary']}")
    if req.context.get("extracted_skills"):
        context_parts.append(f"Compétences : {json.dumps(req.context['extracted_skills'], ensure_ascii=False)}")
    if req.context.get("skill_gaps"):
        context_parts.append(f"Lacunes : {json.dumps(req.context['skill_gaps'], ensure_ascii=False)}")
    if req.context.get("roadmap"):
        context_parts.append(f"Roadmap en cours : {json.dumps(req.context['roadmap'], ensure_ascii=False)}")

    context_text = "\n".join(context_parts)

    messages = [{"role": m.role, "content": m.content} for m in req.history]
    if context_text:
        messages.insert(0, {"role": "system", "content": f"Contexte étudiant :\n{context_text}"})
    messages.append({"role": "user", "content": req.message})

    try:
        reply = await call_openai_chat(SYSTEM_PROMPT_CHAT, messages)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")

    # Extract suggestions (last lines starting with "- " or "• ")
    lines = reply.strip().split("\n")
    suggestions = [
        line.lstrip("- •▸➜→✅📌 ").strip()
        for line in lines[-5:]
        if line.strip().startswith(("-", "•", "▸", "➜", "→", "✅", "📌"))
    ]

    return ChatResponse(reply=reply, suggestions=suggestions[:3])
