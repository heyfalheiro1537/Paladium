from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from core.schemas.api import AnnotatorCreate, AnnotatorResponse
from core.utils.auth import hash_password
from dal.models import Annotator
from dal.setup import get_db

router = APIRouter()


@router.post("/", response_model=AnnotatorResponse)
def create_annotator(annotator: AnnotatorCreate, db: Session = Depends(get_db)):
    """Create a new annotator"""
    existing = db.query(Annotator).filter(Annotator.email == annotator.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    password = annotator.password
    new_annotator = Annotator(
        name=annotator.name,
        email=annotator.email,
        password_hash=hash_password(password[:72]),
    )
    db.add(new_annotator)
    db.commit()
    db.refresh(new_annotator)

    return AnnotatorResponse(
        id=new_annotator.id, name=new_annotator.name, email=new_annotator.email
    )


@router.get("/", response_model=List[AnnotatorResponse])
def get_all_annotators(db: Session = Depends(get_db)):
    """Get all annotators"""
    annotators = db.query(Annotator).all()
    return [AnnotatorResponse(id=a.id, name=a.name, email=a.email) for a in annotators]


@router.get("/{annotator_id}", response_model=AnnotatorResponse)
def get_annotator(annotator_id: int, db: Session = Depends(get_db)):
    """Get a specific annotator"""
    annotator = db.query(Annotator).filter(Annotator.id == annotator_id).first()
    if not annotator:
        raise HTTPException(status_code=404, detail="Annotator not found")

    return AnnotatorResponse(
        id=annotator.id, name=annotator.name, email=annotator.email
    )


@router.delete("/{annotator_id}")
def delete_annotator(annotator_id: int, db: Session = Depends(get_db)):
    """Delete an annotator"""
    annotator = db.query(Annotator).filter(Annotator.id == annotator_id).first()
    if not annotator:
        raise HTTPException(status_code=404, detail="Annotator not found")

    # Check if annotator has any annotations
    if annotator.annotations:
        raise HTTPException(
            status_code=400, detail="Cannot delete annotator with existing annotations"
        )

    db.delete(annotator)
    db.commit()

    return {"ok": True, "message": "Annotator deleted"}
