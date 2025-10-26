from sqlalchemy import String, Table, Column, ForeignKey, DateTime
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


image_groups = Table(
    "image_groups",
    Base.metadata,
    Column("image_id", ForeignKey("images.id"), primary_key=True),
    Column("group_id", ForeignKey("groups.id"), primary_key=True),
)


class Image(Base):
    __tablename__ = "images"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    url: Mapped[str] = mapped_column(String(255))
    date_added: Mapped[datetime] = mapped_column(DateTime, default=datetime.now())

    groups: Mapped[list["Groups"]] = relationship(  # noqa: F821 # type: ignore
        secondary=image_groups, back_populates="images"
    )
    annotations: Mapped[list["Annotation"]] = relationship(back_populates="image")  # type: ignore # noqa: F821
