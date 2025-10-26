from sqlalchemy import String, Table, Column, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


group_annotators = Table(
    "group_annotators",
    Base.metadata,
    Column("group_id", Integer, ForeignKey("groups.id")),
    Column("annotator_id", Integer, ForeignKey("annotators.id")),
)


class Groups(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30), unique=True)

    images: Mapped[list["Image"]] = relationship(
        secondary="image_groups", back_populates="groups"
    )
    annotators = relationship(
        "Annotator", secondary="group_annotators", back_populates="groups"
    )
