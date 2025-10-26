from fastapi.concurrency import asynccontextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from dal.models import Base

ENGINE = create_engine("sqlite:///paladium.db")


def setup_db():
    global ENGINE
    Session = sessionmaker(bind=ENGINE)
    return Session()


def get_db():
    db = setup_db()
    try:
        yield db
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app):
    global ENGINE
    Base.metadata.create_all(bind=ENGINE)
    yield
    pass
