import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware


from dal.setup import lifespan
from routers import annotations, annotators, auth, groups, images


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(lifespan=lifespan)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "This is the Paladium Case - Labeling System backend API by Heyder Falheiro de Almeida"
    }


app.include_router(images.router, prefix="/images", tags=["images"])
app.include_router(groups.router, prefix="/groups", tags=["groups"])
app.include_router(annotators.router, prefix="/annotators", tags=["annotators"])
app.include_router(annotations.router, prefix="/annotations", tags=["annotations"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
