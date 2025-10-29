import base64
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func


from datetime import datetime
from core.schemas.api import AITagSuggestion, AnnotationCreate, ImageResponse
from dal.models.groups import Groups
from openai import OpenAI

from dal.models import Annotator, Annotation, Image, Tags
from dal.setup import get_db


router = APIRouter()


# Annotation Endpoints
@router.post("/{annotator_id}", tags=["annotations"])
def create_annotation(
    annotator_id: int, annotation_data: AnnotationCreate, db: Session = Depends(get_db)
):
    """Create or update an annotation for an image"""
    # Verify annotator exists
    annotator = db.query(Annotator).filter(Annotator.id == annotator_id).first()
    if not annotator:
        raise HTTPException(status_code=404, detail="Annotator not found")

    # Verify image exists
    image = db.query(Image).filter(Image.id == annotation_data.image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Check if annotation already exists for this annotator and image
    existing_annotation = (
        db.query(Annotation)
        .filter(
            Annotation.annotator_id == annotator_id,
            Annotation.image_id == annotation_data.image_id,
        )
        .first()
    )

    # Get or create tags
    tag_objects = []
    for tag_name in annotation_data.tag_names:
        tag = db.query(Tags).filter(Tags.name == tag_name.strip().lower()).first()
        if not tag:
            tag = Tags(name=tag_name.strip().lower())
            db.add(tag)
        tag_objects.append(tag)

    if existing_annotation:
        # Update existing annotation
        existing_annotation.tags = tag_objects
        existing_annotation.updated_at = datetime.now()
        db.commit()
        return {
            "ok": True,
            "message": "Annotation updated",
            "annotation_id": existing_annotation.id,
        }
    else:
        # Create new annotation
        new_annotation = Annotation(
            image_id=annotation_data.image_id,
            annotator_id=annotator_id,
        )
        new_annotation.tags = tag_objects
        db.add(new_annotation)
        db.commit()
        db.refresh(new_annotation)

        return {
            "ok": True,
            "message": "Annotation created",
            "annotation_id": new_annotation.id,
        }


@router.get("/", tags=["annotations"])
def get_all_annotations(db: Session = Depends(get_db)):
    """Get all annotations with their associated data"""
    annotations = db.query(Annotation).all()

    result = []
    for annotation in annotations:
        result.append(
            {
                "annotation_id": annotation.id,
                "image_id": annotation.image_id,
                "annotator_id": annotation.annotator_id,
                "annotator_name": annotation.annotator.name
                if annotation.annotator
                else None,
                "image_path": annotation.image.url if annotation.image else None,
                "tags": [tag.name for tag in annotation.tags],
                "created_at": annotation.created_at.isoformat()
                if annotation.created_at
                else None,
                "updated_at": annotation.updated_at.isoformat()
                if annotation.updated_at
                else None,
            }
        )

    return {"ok": True, "total": len(result), "annotations": result}


@router.get(
    "/images/{annotator_id}", response_model=list[ImageResponse], tags=["annotations"]
)
def get_images_for_annotator(annotator_id: int, db: Session = Depends(get_db)):
    """Get all images with their classification status for a specific annotator"""
    # Verify annotator exists
    annotator = db.query(Annotator).filter(Annotator.id == annotator_id).first()
    if not annotator:
        raise HTTPException(status_code=404, detail="Annotator not found")

    # Get all images
    images = (
        db.query(Image)
        .filter(Image.groups.any(Groups.annotators.any(Annotator.id == annotator.id)))
        .all()
    )

    result = []
    for image in images:
        # Check if this annotator has classified this image
        annotation = (
            db.query(Annotation)
            .filter(
                Annotation.image_id == image.id, Annotation.annotator_id == annotator_id
            )
            .first()
        )

        is_classified = annotation is not None
        classified_at = annotation.created_at if annotation else None

        # Get tags from the annotation if it exists
        tags = [tag.name for tag in annotation.tags] if annotation else []

        result.append(
            ImageResponse(
                id=image.id,
                name=image.name,
                url=image.url,
                tags=tags,
                is_classified=is_classified,
                classified_at=classified_at,
                date_added=image.date_added,
            )
        )

    return result


@router.get("/stats/{annotator_id}", tags=["annotations"])
def get_annotator_stats(annotator_id: int, db: Session = Depends(get_db)):
    """Get statistics for an annotator"""
    annotator = db.query(Annotator).filter(Annotator.id == annotator_id).first()
    if not annotator:
        raise HTTPException(status_code=404, detail="Annotator not found")

    total_images = (
        db.query(Image).filter(
            Image.groups.any(Groups.annotators.any(Annotator.id == annotator.id))
        )
    ).count()
    classified_images = (
        db.query(Annotation).filter(Annotation.annotator_id == annotator_id).count()
    )

    return {
        "annotator_id": annotator_id,
        "total_images": total_images,
        "classified_images": classified_images,
        "remaining_images": total_images - classified_images,
        "progress_percentage": round((classified_images / total_images * 100), 2)
        if total_images > 0
        else 0,
    }


@router.get("/ai-suggest/{image_id}", response_model=AITagSuggestion, tags=["ai"])
def get_ai_suggestions(image_id: int, db: Session = Depends(get_db)):
    """Get AI-generated tag suggestions for an image"""
    client = OpenAI()

    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    if not getattr(image, "url", None):
        raise HTTPException(status_code=400, detail="Image has no URL")

    popular_tags = (
        db.query(Tags.name, func.count(Tags.id).label("count"))
        .join(Annotation.tags)
        .group_by(Tags.name)
        .order_by(func.count(Tags.id).desc())
        .limit(10)
        .all()
    )
    popular = ", ".join([row[0] for row in popular_tags]) if popular_tags else "none"

    prompt = (
        "You are an image tagging assistant. "
        "Suggest exactly 5 short, relevant, lowercase tags (no '#', no spaces—use hyphens), "
        f"favoring common tags when relevant. Common tags in this dataset: {popular}.\n"
        "Return them as a comma-separated list only."
    )

    image_path = f".{image.url}"
    with open(image_path, "rb") as f:
        image_bytes = f.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                    },
                ],
            }
        ],
        max_tokens=150,
    )

    text = resp.choices[0].message.content or ""

    raw = text.replace("\n", ",").replace("•", ",").replace(";", ",").lower()
    tags = [t.strip().strip("#").replace(" ", "-") for t in raw.split(",")]
    tags = [t for t in tags if t]  # non-empty
    tags = list(dict.fromkeys(tags))  # de-dupe, keep order
    tags = tags[:5] if len(tags) >= 5 else tags

    if len(tags) < 5:
        # simple fallback: fill with top popular tags not already selected
        pop_only = [p for p in [row[0] for row in popular_tags] if p not in tags]
        tags += pop_only[: max(0, 5 - len(tags))]

    return AITagSuggestion(suggestions=tags)
