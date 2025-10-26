from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Tags(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30), unique=True)

    annotations: Mapped[list["Annotation"]] = relationship(  # noqa: F821 # type: ignore
        secondary="annotation_tags", back_populates="tags"
    )
