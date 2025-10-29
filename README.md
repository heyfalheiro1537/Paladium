# Paladium — AI-Powered Image Labeling System

> A minimal end-to-end platform where admins upload/group images and labelers tag them with help from AI suggestions. Built for speed, clarity, and a clean developer experience.

## ✨ Features

- **Admin**
  - Upload images and organize them into **Groups**
  - Assign and Create **Labelers** to groups
  - **QA step** to review/resolve divergences and **override** labels
- **Labeler**
  - See only images from assigned groups
  - Dashboard based on his progress
  - Add/Edit/Remove **tags** via a chip-based UI
  - **Suggest tags (AI)**: one-click 1–3 tag recommendations
- **API**
  - CRUD for images, groups, users, and tags
  - Bulk **export** (JSON/CSV) of annotations
- **Auth**
  - Token-based authentication  flow between the frontend (Next.js) and the backend (FastAPI or similar)
  - JWT to separate roles
- **DevX**
  - Local & Docker workflows
  - Type-safe frontend, typed backend DTOs
  - Room for tests and CI later


## 🧭 AI Assistance

This project leveraged AI at key stages to speed up iteration and improve quality.

### 📝 Planning & UX Journey
- Used **OpenAI/ChatGPT** to explore user personas, map the **end-to-end journey**, and align on success criteria.  
- Iterated “back-and-forth” on **flows, wireframes, and copy** to refine the user experience.  
- Captured assumptions and open questions as checklists to guide implementation.
- Results: Helped gain insights on Product Design

### 💻 Coding & Integration
- Generated **page templates** and base components with **Claude**, adapted to the project’s style system.  
- Collaboratively debugged **backend integration** (authentication, environment variables, CORS issues) with Cursor.  
- Used AI for code refactoring, improving **error handling**, and maintaining **type safety**.
- Results: Speed up development

### 🐳 Dockerization & DevOps
- Followed **AI-guided step-by-step Dockerization by OpenAI and Claude** (along with documentation), including build layers, service linking. 
- Standardized **`.env` management** (e.g., `OPENAI_API_KEY`, `NEXT_PUBLIC_API_URL`) across environments.  
- Result: Added AI-driven troubleshooting and validation tips for `docker compose up --build` and runtime logs.


## 🗂 Repo Layout

```
.
├─ backend/          # FastAPI (Python) service: auth, images, tags, groups, QA
├─ paladium-core/    # Next.js (TypeScript) frontend: Admin + Labeler UIs
└─ docker-compose.yml
```

## 🧰 Tech Stack

- **Frontend:** Next.js + TypeScript (spa/ssr), Tailwind
- **Backend:** FastAPI (Python), SQLAlchemy; SQLite 
- **AI:** OpenAI
- **Containerization:** Docker & docker-compose

## 🚀 Quickstart

### With Docker
# 1. Clone the repository
```bash
git clone https://github.com/heyfalheiro1537/Paladium
cd Paladium
```
# 2. Copy environment example

```bash
cp backend/.env.example backend/.env
```

# 3. Open the env files and set your variables

```backend/.env
OPENAI_API_KEY= <your-api-key>
```

# 4. Build the image 
```bash
docker compose up --build
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000


## 🧩 Data Model

- User, Group, Image, Tag, Annotator, Annotation

## 🔌 API Sketch

CRUD endpoints for images, groups, tags, QA, AI suggest.

## 🧠 AI Suggestion Flow

- Frontend calls backend `/ai/suggest-tags`.
- Backend uses real or mocked AI APIs.
- Returns 1–3 tags.

## ✅ QA Workflow

Admins review diverging tags, approve or override.

## 📦 Export

`GET /export/json` returns labeled dataset.

## 🐳 Deployment

Multi-stage Docker build


