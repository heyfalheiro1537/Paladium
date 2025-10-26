import base64
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pathlib import Path
import uuid
from dal.models.annotator import Annotation
import filetype
from sqlalchemy import func


from dal.models import Image, Tags, Groups
from dal.setup import get_db

router = APIRouter()

UPLOAD_DIR = Path("uploads")


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload an image file"""

    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files are allowed")

    content = await file.read()

    if filetype.guess(content) is None:
        raise HTTPException(400, "Invalid image")

    ext = Path(file.filename).suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / filename).write_bytes(content)

    new_image = Image(name=file.filename, url=f"/uploads/{filename}")
    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return JSONResponse(
        {"ok": True, "id": new_image.id, "name": new_image.name, "url": new_image.url}
    )


@router.get("/")
def get_all_images(db: Session = Depends(get_db)):
    """Get all images with their tags, groups, and annotation statistics"""
    images = db.query(Image).all()
    result = []

    # Get popular tags once for reuse
    popular_tags = (
        db.query(Tags.name, func.count(Tags.id).label("count"))
        .join(Annotation.tags)
        .group_by(Tags.name)
        .order_by(func.count(Tags.id).desc())
        .limit(10)
        .all()
    )
    popular = ", ".join([row[0] for row in popular_tags]) if popular_tags else "none"

    for img in images:
        # Get all annotations for this image
        annotations = db.query(Annotation).filter(Annotation.image_id == img.id).all()
        total_annotators = len(annotations)

        # Calculate tag statistics from annotations
        tag_stats = {}
        for ann in annotations:
            for tag in ann.tags:
                if tag.name not in tag_stats:
                    tag_stats[tag.name] = {"id": tag.id, "count": 0}
                tag_stats[tag.name]["count"] += 1

        # Build tags with percentage and count
        tags_with_stats = []
        for tag_name, tag_data in tag_stats.items():
            count = tag_data["count"]
            percentage = (
                round((count / total_annotators * 100)) if total_annotators > 0 else 0
            )
            tags_with_stats.append(
                {
                    "id": tag_data["id"],
                    "name": tag_name,
                    "count": count,
                    "percentage": percentage,
                }
            )

        # Sort tags by count (most popular first)
        tags_with_stats.sort(key=lambda x: x["count"], reverse=True)

        # Use AI to determine if there's a conflict
        has_conflict = False
        if tags_with_stats and total_annotators > 1:
            has_conflict = check_tag_conflict_with_ai(
                img, tags_with_stats, total_annotators, popular
            )

        result.append(
            {
                "id": img.id,
                "name": img.name,
                "url": img.url,
                "tags": tags_with_stats,
                "groups": [
                    {"id": group.id, "name": group.name} for group in img.groups
                ],
                "total_annotators": total_annotators,
                "has_conflict": has_conflict,
                "date_added": img.date_added.isoformat()
                if hasattr(img, "date_added")
                else None,
            }
        )

    return result


def check_tag_conflict_with_ai(
    image: Image, tags_with_stats: list, total_annotators: int, popular_tags: str
) -> bool:
    """Use AI to determine if there's a tagging conflict for this image"""

    if not getattr(image, "url", None):
        return False

    # Format tag information for the prompt
    tag_summary = []
    for tag in tags_with_stats:
        tag_summary.append(
            f"- '{tag['name']}': {tag['count']}/{total_annotators} annotators ({tag['percentage']}%)"
        )
    tag_info = "\n".join(tag_summary)

    prompt = (
        "You are analyzing image annotation consistency. "
        f"This image was tagged by {total_annotators} annotators.\n\n"
        f"Tags assigned:\n{tag_info}\n\n"
        f"Common tags in dataset: {popular_tags}\n\n"
        "Based on the image content and tag distribution, is there a significant conflict "
        "in how annotators interpreted this image? Consider:\n"
        "- Are the tags semantically similar or contradictory?\n"
        "- Does the image have ambiguous content that could cause disagreement?\n"
        "- Is low agreement justified by image complexity?\n\n"
        "Answer with ONLY 'YES' if there's a conflict or 'NO' if annotations are reasonably consistent."
    )

    client = None
    try:
        client = OpenAI()

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
            max_tokens=10,
        )

        answer = resp.choices[0].message.content.strip().upper()
        return "YES" in answer

    except Exception as e:
        # Fallback to percentage-based check if AI fails
        print(f"AI conflict check failed for image {image.id}: {e}")
        return any(tag["percentage"] < 80 for tag in tags_with_stats)
    finally:
        if client:
            client.close()


@router.delete("/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image"""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(404, "Image not found")

    # Delete physical file
    file_path = UPLOAD_DIR / Path(image.url).name
    if file_path.exists():
        file_path.unlink()

    db.delete(image)
    db.commit()
    return {"ok": True, "message": "Image deleted"}


@router.delete("/{image_id}/tags/{tag_name}")
def remove_tag_from_all_annotations(
    image_id: int, tag_name: str, db: Session = Depends(get_db)
):
    """Remove a specific tag from ALL annotations of an image (admin/curator action)"""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(404, "Image not found")

    # Get the tag
    tag = db.query(Tags).filter(Tags.name == tag_name.lower()).first()
    if not tag:
        raise HTTPException(404, "Tag not found")

    # Get all annotations for this image
    annotations = db.query(Annotation).filter(Annotation.image_id == image_id).all()

    removed_count = 0
    for annotation in annotations:
        if tag in annotation.tags:
            annotation.tags.remove(tag)
            removed_count += 1

    db.commit()

    return {
        "ok": True,
        "message": f"Tag '{tag_name}' removed from {removed_count} annotation(s)",
        "removed_count": removed_count,
    }


class RenameTagRequest(BaseModel):
    new_tag_name: str


@router.patch("/{image_id}/tags/{tag_name}")
def rename_tag_in_all_annotations(
    image_id: int, tag_name: str, body: RenameTagRequest, db: Session = Depends(get_db)
):
    """Rename a specific tag in ALL annotations of an image (admin/curator action)"""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(404, "Image not found")

    # Get the old tag
    old_tag = db.query(Tags).filter(Tags.name == tag_name.lower()).first()
    if not old_tag:
        raise HTTPException(404, "Tag not found")

    new_tag_name_lower = body.new_tag_name.lower().strip()

    if not new_tag_name_lower:
        raise HTTPException(400, "New tag name cannot be empty")

    if new_tag_name_lower == tag_name.lower():
        raise HTTPException(400, "New tag name is the same as the old one")

    # Check if new tag already exists
    existing_tag = db.query(Tags).filter(Tags.name == new_tag_name_lower).first()

    if existing_tag:
        # If the new tag already exists, we'll merge them
        # Replace old tag with existing new tag in all annotations
        new_tag = existing_tag
        merge_mode = True
    else:
        # Create new tag
        new_tag = Tags(name=new_tag_name_lower)
        db.add(new_tag)
        db.flush()  # Get the new tag ID
        merge_mode = False

    # Get all annotations for this image
    annotations = db.query(Annotation).filter(Annotation.image_id == image_id).all()

    updated_count = 0
    for annotation in annotations:
        if old_tag in annotation.tags:
            annotation.tags.remove(old_tag)
            # Only add new tag if it's not already there (handles merge case)
            if new_tag not in annotation.tags:
                annotation.tags.append(new_tag)
            updated_count += 1

    # If no annotations use the old tag anymore, we can optionally delete it
    # (Check if it's used in other images first)
    remaining_usage = (
        db.query(Annotation).join(Annotation.tags).filter(Tags.id == old_tag.id).count()
    )

    if remaining_usage == 0:
        db.delete(old_tag)

    db.commit()

    return {
        "ok": True,
        "message": f"Tag '{tag_name}' renamed to '{body.new_tag_name}' in {updated_count} annotation(s)",
        "updated_count": updated_count,
        "merged": merge_mode,
        "old_tag_deleted": remaining_usage == 0,
    }


@router.delete("/{image_id}/annotations/{annotator_id}/tags/{tag_name}")
def remove_tag_from_specific_annotation(
    image_id: int, annotator_id: int, tag_name: str, db: Session = Depends(get_db)
):
    """Remove a tag from a specific annotator's annotation"""
    # Find the specific annotation
    annotation = (
        db.query(Annotation)
        .filter(
            Annotation.image_id == image_id, Annotation.annotator_id == annotator_id
        )
        .first()
    )

    if not annotation:
        raise HTTPException(404, "Annotation not found")

    # Find the tag
    tag = db.query(Tags).filter(Tags.name == tag_name.lower()).first()
    if not tag:
        raise HTTPException(404, "Tag not found")

    if tag not in annotation.tags:
        raise HTTPException(400, "Tag not in this annotation")

    annotation.tags.remove(tag)
    annotation.updated_at = datetime.utcnow()
    db.commit()

    return {"ok": True, "message": f"Tag '{tag_name}' removed from annotation"}


@router.post("/{image_id}/groups/{group_id}")
def add_image_to_group(image_id: int, group_id: int, db: Session = Depends(get_db)):
    """Add an image to a group"""
    image = db.query(Image).filter(Image.id == image_id).first()
    group = db.query(Groups).filter(Groups.id == group_id).first()

    if not image:
        raise HTTPException(404, "Image not found")
    if not group:
        raise HTTPException(404, "Group not found")

    if group not in image.groups:
        image.groups.append(group)
        db.commit()

    return {"ok": True, "message": "Image added to group"}


@router.delete("/{image_id}/groups/{group_id}")
def remove_image_from_group(
    image_id: int, group_id: int, db: Session = Depends(get_db)
):
    """Remove an image from a group"""
    image = db.query(Image).filter(Image.id == image_id).first()
    group = db.query(Groups).filter(Groups.id == group_id).first()

    if not image:
        raise HTTPException(404, "Image not found")
    if not group:
        raise HTTPException(404, "Group not found")

    if group in image.groups:
        image.groups.remove(group)
        db.commit()

    return {"ok": True, "message": "Image removed from group"}
