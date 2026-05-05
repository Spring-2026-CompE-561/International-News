from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserDb(UserBase):
    hashed_password: str


class User(UserBase):
    id: int
    model_config = {"from_attributes": True}


class UserProfile(UserBase):
    """Full profile — includes optional fields editable on /account."""
    id: int
    display_name: str | None = None
    bio: str | None = None
    country: str | None = None
    city: str | None = None
    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    """Payload for PATCH /users/me/profile."""
    display_name: str | None = None
    bio: str | None = None
    country: str | None = None
    city: str | None = None
