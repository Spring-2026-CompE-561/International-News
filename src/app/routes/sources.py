from fastapi import APIRouter

api_router = APIRouter(prefix="/sources", tags=["sources"])


@api_router.get("")
async def get_sources():
    return {"message": "Get sources"}


@api_router.get("/{id}")
async def get_specific_source(id: int):
    return {"message": f"Get source {id}"}
