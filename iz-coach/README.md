# IZ COACH — Architecture & Guide

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌──────────────────┐       ┌──────────┐
│   Frontend   │──────▶│  n8n Webhook  │──────▶│  FastAPI (8000)  │──────▶│  OpenAI  │
│  React/Vite  │  POST │  :5678       │  HTTP  │  /analyze_cv     │  API  │  GPT-4o  │
│  :5173       │◀──────│  Orchestrator │◀──────│  /generate_roadmap│◀──────│          │
│              │  JSON │              │  JSON  │  /chat           │  JSON │          │
└─────────────┘       └──────┬───────┘       └────────┬─────────┘       └──────────┘
                             │                        │
                             │   (optional save)      │
                             ▼                        ▼
                      ┌──────────────┐         ┌──────────────┐
                      │  Supabase DB │         │  Supabase DB │
                      │  PostgreSQL  │         │  (same)      │
                      └──────────────┘         └──────────────┘
```

## Répartition des rôles

| Composant       | Rôle                                                                 |
|-----------------|----------------------------------------------------------------------|
| **Frontend**    | UI chatbot, upload CV, affichage résultats, envoi au webhook n8n     |
| **n8n**         | Orchestration : routing, appels séquentiels à FastAPI, formatage     |
| **FastAPI**     | Logique métier IA : analyse CV, roadmap, chat via OpenAI             |
| **OpenAI**      | Moteur NLP : extraction compétences, génération texte, conversation  |
| **Supabase**    | Stockage persistant : profils, analyses CV, roadmaps, historique     |

## Flux de données

### 1. Analyse CV
```
Frontend → n8n webhook (action: "analyze_cv") → FastAPI /analyze_cv → OpenAI → résultat → n8n → Frontend
```

### 2. Génération Roadmap
```
Frontend → n8n webhook (action: "generate_roadmap") → FastAPI /generate_roadmap → OpenAI → résultat → n8n → Frontend
```

### 3. Chat
```
Frontend → n8n webhook (action: "chat") → FastAPI /chat → OpenAI → réponse → n8n → Frontend
```

## Exemples de Payloads JSON

### POST n8n webhook — Analyse CV
```json
{
  "action": "analyze_cv",
  "student_id": "clx123abc",
  "cv_text": "Jean Dupont\nDéveloppeur web junior\n\nCompétences:\n- HTML/CSS\n- JavaScript\n- React (débutant)\n- Git\n\nExpérience:\n- Stage 6 mois chez StartupXYZ\n\nFormation:\n- BTS SIO 2024",
  "target_country": "France",
  "career_goals": ["Développeur Full-Stack", "Freelance"]
}
```

### Réponse — Analyse CV
```json
{
  "success": true,
  "action": "analyze_cv",
  "data": {
    "student_id": "clx123abc",
    "extracted_skills": [
      { "name": "HTML/CSS", "level": "intermediate" },
      { "name": "JavaScript", "level": "intermediate" },
      { "name": "React", "level": "beginner" },
      { "name": "Git", "level": "beginner" }
    ],
    "skill_gaps": [
      { "skill": "Node.js/Express", "reason": "Indispensable pour le Full-Stack en France", "priority": "high" },
      { "skill": "TypeScript", "reason": "Standard dans les entreprises françaises", "priority": "high" },
      { "skill": "PostgreSQL", "reason": "Base de données relationnelle la plus demandée", "priority": "medium" },
      { "skill": "Docker", "reason": "Requis pour le déploiement en freelance", "priority": "medium" }
    ],
    "profile_summary": "Développeur web junior avec des bases solides en frontend. Stage de 6 mois confirmant une première expérience terrain. Profil prometteur nécessitant un renforcement backend et DevOps pour atteindre le niveau Full-Stack.",
    "recommended_roles": ["Développeur Frontend Junior", "Intégrateur Web", "Développeur Full-Stack Junior (après formation)"]
  }
}
```

### POST n8n webhook — Génération Roadmap
```json
{
  "action": "generate_roadmap",
  "student_id": "clx123abc",
  "extracted_skills": [
    { "name": "JavaScript", "level": "intermediate" },
    { "name": "React", "level": "beginner" }
  ],
  "skill_gaps": [
    { "skill": "Node.js", "reason": "Requis Full-Stack", "priority": "high" },
    { "skill": "TypeScript", "reason": "Standard entreprise", "priority": "high" }
  ],
  "career_goals": ["Développeur Full-Stack"],
  "available_courses": [
    { "title": "JavaScript Avancé", "level": "intermédiaire" },
    { "title": "Node.js de A à Z", "level": "débutant" },
    { "title": "React Masterclass", "level": "intermédiaire" }
  ],
  "weeks": 12
}
```

### POST n8n webhook — Chat
```json
{
  "action": "chat",
  "student_id": "clx123abc",
  "message": "Quels projets je peux faire pour impressionner en entretien ?",
  "history": [
    { "role": "user", "content": "Salut, je veux devenir dev fullstack" },
    { "role": "assistant", "content": "Super objectif ! D'après ton profil..." }
  ],
  "context": {
    "profile_summary": "Développeur web junior, bases solides en frontend",
    "extracted_skills": [{ "name": "React", "level": "beginner" }],
    "skill_gaps": [{ "skill": "Node.js", "reason": "Requis", "priority": "high" }]
  }
}
```

## n8n Workflow — Détail des nœuds

| # | Nœud                     | Type               | Rôle                                                    |
|---|--------------------------|--------------------|---------------------------------------------------------|
| 1 | Webhook — Student Request| webhook            | Point d'entrée POST, reçoit le payload du frontend       |
| 2 | Switch — Route by Action | switch             | Route vers le bon endpoint selon `action`                |
| 3 | HTTP — Analyze CV        | httpRequest        | Appelle `POST http://iz-coach-api:8000/analyze_cv`       |
| 4 | HTTP — Generate Roadmap  | httpRequest        | Appelle `POST http://iz-coach-api:8000/generate_roadmap` |
| 5 | HTTP — Chat              | httpRequest        | Appelle `POST http://iz-coach-api:8000/chat`             |
| 6 | Format — *Response       | code (JavaScript)  | Enveloppe la réponse dans `{ success, action, data }`    |
| 7 | Respond — *              | respondToWebhook   | Renvoie le JSON formaté au frontend                      |

## Démarrage rapide

```bash
# 1. Démarrer les services
docker compose up -d

# 2. Importer le workflow dans n8n
#    → Ouvrir http://localhost:5678
#    → Workflows > Import > iz-coach/n8n/workflow-iz-coach.json
#    → Activer le workflow

# 3. Configurer la clé OpenAI
#    → Copier iz-coach/backend/.env.example → .env
#    → Renseigner OPENAI_API_KEY

# 4. Lancer le frontend
cd frontend && npm run dev
```

## Structure des fichiers

```
iz-coach/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── main.py                    ← FastAPI app entry
│   └── app/
│       ├── config.py              ← Settings (env vars)
│       ├── schemas.py             ← Pydantic request/response models
│       ├── prompts.py             ← System prompts pour OpenAI
│       ├── routers/
│       │   ├── cv.py              ← POST /analyze_cv
│       │   ├── roadmap.py         ← POST /generate_roadmap
│       │   └── chat.py            ← POST /chat
│       └── services/
│           └── ai_service.py      ← OpenAI API wrapper
└── n8n/
    └── workflow-iz-coach.json     ← Importable n8n workflow

frontend/src/
├── api/
│   └── coach.api.ts               ← API client for n8n webhook
└── app/components/
    └── IzCoach.tsx                 ← Chatbot UI component
```
