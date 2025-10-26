from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from core.schemas.api import AddMemberRequest, AnnotatorInGroup, GroupWithMembers
from dal.models import Groups, Annotator
from dal.setup import get_db

router = APIRouter()


@router.post("/")
def create_group(name: str, db: Session = Depends(get_db)):
    """Create a new group"""
    existing = db.query(Groups).filter(Groups.name == name).first()
    if existing:
        raise HTTPException(400, "Group already exists")

    group = Groups(name=name)
    db.add(group)
    db.commit()
    db.refresh(group)
    return {"id": group.id, "name": group.name}


@router.get("/", response_model=List[GroupWithMembers])
def get_all_groups(db: Session = Depends(get_db)):
    """Get all groups with their members"""
    groups = db.query(Groups).all()
    return [
        GroupWithMembers(
            id=group.id,
            name=group.name,
            members=[
                AnnotatorInGroup(id=a.id, name=a.name, email=a.email)
                for a in group.annotators
            ],
        )
        for group in groups
    ]


@router.get("/{group_id}", response_model=GroupWithMembers)
def get_group(group_id: int, db: Session = Depends(get_db)):
    """Get a specific group with its members and images"""
    group = db.query(Groups).filter(Groups.id == group_id).first()
    if not group:
        raise HTTPException(404, "Group not found")

    return GroupWithMembers(
        id=group.id,
        name=group.name,
        members=[
            AnnotatorInGroup(id=a.id, name=a.name, email=a.email)
            for a in group.annotators
        ],
    )


@router.post("/{group_id}/members", response_model=GroupWithMembers)
def add_member_to_group(
    group_id: int, request: AddMemberRequest, db: Session = Depends(get_db)
):
    """Add an annotator to a group"""
    # Check if group exists
    group = db.query(Groups).filter(Groups.id == group_id).first()
    if not group:
        raise HTTPException(404, "Group not found")

    # Check if annotator exists
    annotator = db.query(Annotator).filter(Annotator.id == request.annotator_id).first()
    if not annotator:
        raise HTTPException(404, "Annotator not found")

    # Check if annotator is already in this group
    if annotator in group.annotators:
        raise HTTPException(400, "Annotator is already in this group")

    # Check if annotator is in another group
    other_group = db.query(Groups).filter(Groups.annotators.contains(annotator)).first()
    if other_group:
        raise HTTPException(400, f"Annotator is already in group '{other_group.name}'")

    # Add annotator to group
    group.annotators.append(annotator)
    db.commit()
    db.refresh(group)

    return GroupWithMembers(
        id=group.id,
        name=group.name,
        members=[
            AnnotatorInGroup(id=a.id, name=a.name, email=a.email)
            for a in group.annotators
        ],
    )


@router.delete("/{group_id}/members/{annotator_id}", response_model=GroupWithMembers)
def remove_member_from_group(
    group_id: int, annotator_id: int, db: Session = Depends(get_db)
):
    """Remove an annotator from a group"""
    # Check if group exists
    group = db.query(Groups).filter(Groups.id == group_id).first()
    if not group:
        raise HTTPException(404, "Group not found")

    # Check if annotator exists
    annotator = db.query(Annotator).filter(Annotator.id == annotator_id).first()
    if not annotator:
        raise HTTPException(404, "Annotator not found")

    # Check if annotator is in this group
    if annotator not in group.annotators:
        raise HTTPException(400, "Annotator is not in this group")

    # Remove annotator from group
    group.annotators.remove(annotator)
    db.commit()
    db.refresh(group)

    return GroupWithMembers(
        id=group.id,
        name=group.name,
        members=[
            AnnotatorInGroup(id=a.id, name=a.name, email=a.email)
            for a in group.annotators
        ],
    )


@router.delete("/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    """Delete a group"""
    group = db.query(Groups).filter(Groups.id == group_id).first()
    if not group:
        raise HTTPException(404, "Group not found")

    db.delete(group)
    db.commit()
    return {"ok": True, "message": "Group deleted"}
