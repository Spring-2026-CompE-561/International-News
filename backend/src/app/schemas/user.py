"""User schemas.

This module defines Pydantic schemas for user data validation and serialization.
"""

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    username: str


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str


class UserDb(UserBase):
    hashed_password: str


class User(UserBase):
    """Schema for user response."""

    id: int
    model_config = {"from_attributes": True}
