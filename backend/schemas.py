from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    face_embedding: List[float]  # length 128

class FaceLogin(BaseModel):
    username: str
    face_embedding: List[float]

class CredentialCreate(BaseModel):
    site_name: str
    site_url: str
    username: str
    password: str

class CredentialUpdate(BaseModel):
    site_name: Optional[str] = None
    site_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class CredentialResponse(BaseModel):
    id: int
    site_name: str
    site_url: str
    username: str
    password: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
