from fastapi import APIRouter

api_router = APIRouter(prefix="/auth", tags=["auth"])


@api_router.post("/signup")
async def signup():
    return {"message": "signup route"}


@api_router.post("/login")
async def login():
    return {"message": "login route"}
