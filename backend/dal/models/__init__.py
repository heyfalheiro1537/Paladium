# Import Base first
from .base import Base

# Import association tables and all models
from .image import image_groups, Image
from .tags import Tags
from .groups import Groups
from .annotator import Annotator, Annotation

# This ensures all models are loaded before relationships are configured
__all__ = [
    "Base",
    "Image",
    "Tags",
    "Groups",
    "image_tags",
    "image_groups",
    "Annotator",
    "Annotation",
]
