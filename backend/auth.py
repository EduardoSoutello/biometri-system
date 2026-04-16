import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import json
import math

SECRET_KEY = "SUPER_SECRET_KEY_FOR_JWT_REPLACE_IN_PROD"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Simple encryption key for symmetric password encryption in DB
# In production, this must be stored securely!
ENCRYPTION_KEY = b'sXkRzWbq2xI4s1L0a-lM5zS9v_7qYX3sRkA5P-rL6g8='
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_password(password: str) -> str:
    return cipher_suite.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    return cipher_suite.decrypt(encrypted_password.encode()).decode()

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
