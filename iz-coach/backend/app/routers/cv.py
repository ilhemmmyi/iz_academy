"""POST /analyze_cv — Extract skills, detect gaps, summarize profile."""

import io
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.schemas import CVAnalysisRequest, CVAnalysisResponse, Skill, SkillGap
from app.services.ai_service import call_openai
from app.prompts import SYSTEM_PROMPT_CV_ANALYSIS

router = APIRouter()


def extract_text_from_pdf(data: bytes) -> str:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(data))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_text_from_docx(data: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text(filename: str, data: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(data)
    if lower.endswith((".docx", ".doc")):
        return extract_text_from_docx(data)
    # Fallback: treat as plain text
    return data.decode("utf-8", errors="ignore")


async def _analyze(student_id: str, cv_text: str, target_country: str, career_goals: list[str]) -> CVAnalysisResponse:
    user_content = (
        f"CV de l'étudiant :\n{cv_text}\n\n"
        f"Objectifs de carrière : {', '.join(career_goals) or 'Non précisé'}\n"
        f"Pays cible : {target_country}"
    )
    try:
        result = await call_openai(SYSTEM_PROMPT_CV_ANALYSIS, user_content, temperature=0.3)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")

    return CVAnalysisResponse(
        student_id=student_id,
        extracted_skills=[Skill(**s) for s in result.get("extracted_skills", [])],
        skill_gaps=[SkillGap(**g) for g in result.get("skill_gaps", [])],
        profile_summary=result.get("profile_summary", ""),
        recommended_roles=result.get("recommended_roles", []),
    )


@router.post("", response_model=CVAnalysisResponse)
async def analyze_cv(req: CVAnalysisRequest):
    return await _analyze(req.student_id, req.cv_text, req.target_country, req.career_goals)


@router.post("/upload", response_model=CVAnalysisResponse)
async def analyze_cv_upload(
    file: UploadFile = File(...),
    student_id: str = Form(...),
    target_country: str = Form("France"),
    career_goals: str = Form(""),
):
    """Accept a real file upload (PDF, DOCX, TXT) and analyse it."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    cv_text = extract_text(file.filename or "cv.txt", data)
    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    goals = [g.strip() for g in career_goals.split(",") if g.strip()] if career_goals else []
    return await _analyze(student_id, cv_text, target_country, goals)
