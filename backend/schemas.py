from pydantic import BaseModel
from typing import List

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
