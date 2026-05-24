from fastapi import FastAPI
from contextlib import asynccontextmanager
from routes import base_router,auth_router
from helpers.config import engine, Base
import models  # noqa: F401 — registers all models with Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(base_router)
app.include_router(auth_router)
