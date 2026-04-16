from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    # Storing 128 float values as a json string
    face_embedding = Column(Text) 
    
    credentials = relationship("Credential", back_populates="owner")

class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String, index=True)
    site_url = Column(String)
    username = Column(String)
    encrypted_password = Column(Text)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="credentials")
