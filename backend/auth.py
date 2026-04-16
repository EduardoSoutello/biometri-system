import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import math
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def compare_faces(known_embedding: list[float], live_embedding: list[float]) -> bool:
    """Computes Euclidean distance between two embeddings. Lower is closer."""
    if len(known_embedding) != len(live_embedding):
        return False
    
    distance = math.sqrt(sum((x - y) ** 2 for x, y in zip(known_embedding, live_embedding)))
    # Face-API.js euclidian distance threshold is usually ~0.6 for Euclidian distance.
    return distance < 0.60
