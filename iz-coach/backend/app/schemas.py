"""Pydantic schemas — request and response models."""

from __future__ import annotations
from pydantic import BaseModel, Field


# ── CV Analysis ──────────────────────────────────────────────────────────────
class CVAnalysisRequest(BaseModel):
    student_id: str
    cv_text: str
    target_country: str = "France"
    career_goals: list[str] = Field(default_factory=list)

class Skill(BaseModel):
    name: str
    level: str  # beginner / intermediate / advanced

class SkillGap(BaseModel):
    skill: str
    reason: str
    priority: str  # high / medium / low

class CVAnalysisResponse(BaseModel):
    student_id: str
    extracted_skills: list[Skill]
    skill_gaps: list[SkillGap]
    profile_summary: str
    recommended_roles: list[str]


# ── Roadmap ──────────────────────────────────────────────────────────────────
class RoadmapRequest(BaseModel):
    student_id: str
    extracted_skills: list[Skill] = Field(default_factory=list)
    skill_gaps: list[SkillGap] = Field(default_factory=list)
    career_goals: list[str] = Field(default_factory=list)
    available_courses: list[dict] = Field(default_factory=list)
    weeks: int = 12

class WeekPlan(BaseModel):
    week: int
    focus: str
    courses: list[str]
    project: str
    hours: int

class RoadmapResponse(BaseModel):
    student_id: str
    roadmap: list[WeekPlan]
    portfolio_projects: list[str]
    estimated_completion: str


# ── Chat ─────────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str

class ChatRequest(BaseModel):
    student_id: str
    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    context: dict = Field(default_factory=dict)  # CV analysis, roadmap, etc.

class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str] = Field(default_factory=list)
