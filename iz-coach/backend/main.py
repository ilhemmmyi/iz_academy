"""
IZ COACH — FastAPI AI Backend
Intelligent career-coaching chatbot for Iz Academy.

Endpoints:
  POST /analyze_cv      → Analyse CV, extract skills, detect gaps
  POST /generate_roadmap → Generate weekly learning roadmap
  POST /chat            → Conversational career coach
  GET  /health          → Health check
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import cv, roadmap, chat
from app.config import settings

app = FastAPI(
    title="IZ COACH API",
    version="1.0.0",
    description="AI career-coaching backend for Iz Academy",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, settings.N8N_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cv.router, prefix="/analyze_cv", tags=["CV Analysis"])
app.include_router(roadmap.router, prefix="/generate_roadmap", tags=["Roadmap"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "iz-coach"}
