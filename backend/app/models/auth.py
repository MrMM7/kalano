from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ErrorDetail(BaseModel):
    code: str = Field(
        description="Machine-readable error code",
        examples=["DUPLICATE_EMAIL"],
    )
    message: str = Field(
        description="Human-readable error description",
        examples=["A user with this email address already exists."],
    )


class ErrorResponse(BaseModel):
    error: ErrorDetail = Field(description="Standard error envelope")


class UserRegisterRequest(BaseModel):
    email: str = Field(
        pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
        description="Unique user email address",
        examples=["user@example.com"],
    )
    password: str = Field(
        min_length=8,
        description="Plaintext password, minimum 8 characters",
        examples=["secret12345"],
    )
    display_name: str = Field(
        min_length=1,
        max_length=100,
        description="Public display name",
        examples=["Jane Doe"],
    )
    user_role: Literal["buyer", "merchant"] = Field(
        description="User account role",
        examples=["buyer"],
    )

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("display_name", mode="before")
    @classmethod
    def strip_display_name(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("display_name cannot be empty or only whitespace")
            return cleaned
        return v


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(
        description="Unique user identifier",
        examples=["e4b01e3e-7a42-4f1b-8c29-33b6d080b091"],
    )
    created_at: datetime = Field(
        description="Account creation timestamp",
        examples=["2026-09-03T12:00:00Z"],
    )
    email: str = Field(description="User email address", examples=["user@example.com"])
    display_name: str = Field(description="User public display name", examples=["Jane Doe"])
    user_role: str = Field(description="User role", examples=["buyer"])
    address: str | None = Field(
        default=None,
        description="User address, null upon registration",
        examples=[None],
    )
