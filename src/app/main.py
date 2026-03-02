from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import api_router
from app.core.database import Base, engine
from app.core.settings import settings

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description= "An API for International news articles",
    version=settings.app_version,
)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
