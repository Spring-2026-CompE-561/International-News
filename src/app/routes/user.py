from fastapi import APIRouter

api_router = APIRouter(prefix="/user", tags=["users"])


@api_router.get("/{id}")
async def get_user(id: int):
    return {"message": f"get user {id}"}


@api_router.put("/{id}")
async def update_user(id: int):
    return {"message": f"update user {id}"}


@api_router.delete("/{id}")
async def delete_user(id: int):
    return {"message": f"delete user {id}"}
