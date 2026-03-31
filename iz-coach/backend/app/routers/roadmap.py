"""POST /generate_roadmap — Build a personalized weekly learning plan."""

import json
from fastapi import APIRouter, HTTPException
from app.schemas import RoadmapRequest, RoadmapResponse, WeekPlan
from app.services.ai_service import call_openai
from app.prompts import SYSTEM_PROMPT_ROADMAP

router = APIRouter()


@router.post("", response_model=RoadmapResponse)
async def generate_roadmap(req: RoadmapRequest):
    user_content = (
        f"Compétences actuelles : {json.dumps([s.model_dump() for s in req.extracted_skills], ensure_ascii=False)}\n"
        f"Lacunes identifiées : {json.dumps([g.model_dump() for g in req.skill_gaps], ensure_ascii=False)}\n"
        f"Objectifs : {', '.join(req.career_goals) or 'Non précisé'}\n"
        f"Cours disponibles sur Iz Academy : {json.dumps(req.available_courses, ensure_ascii=False)}\n"
        f"Durée souhaitée : {req.weeks} semaines"
    )
    try:
        result = await call_openai(SYSTEM_PROMPT_ROADMAP, user_content, temperature=0.5)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")

    return RoadmapResponse(
        student_id=req.student_id,
        roadmap=[WeekPlan(**w) for w in result.get("roadmap", [])],
        portfolio_projects=result.get("portfolio_projects", []),
        estimated_completion=result.get("estimated_completion", f"{req.weeks} semaines"),
    )
