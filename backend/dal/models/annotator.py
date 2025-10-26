from sqlalchemy import String, Table, Column, ForeignKey, DateTime, Boolean
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

# Association table for annotation tags
annotation_tags = Table(
    "annotation_tags",
    Base.metadata,
    Column("annotation_id", ForeignKey("annotations.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)


class Annotator(Base):
    __tablename__ = "annotators"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    annotations: Mapped[list["Annotation"]] = relationship(back_populates="annotator")
    groups = relationship(
        "Groups", secondary="group_annotators", back_populates="annotators"
    )


class Annotation(Base):
    __tablename__ = "annotations"

    id: Mapped[int] = mapped_column(primary_key=True)
    image_id: Mapped[int] = mapped_column(ForeignKey("images.id"))
    annotator_id: Mapped[int] = mapped_column(ForeignKey("annotators.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    image: Mapped["Image"] = relationship(back_populates="annotations")
    annotator: Mapped["Annotator"] = relationship(back_populates="annotations")
    tags: Mapped[list["Tags"]] = relationship(
        secondary=annotation_tags, back_populates="annotations"
    )
