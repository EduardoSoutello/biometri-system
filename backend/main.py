import json
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from database import engine, SessionLocal, Base
import models, schemas, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Biometri System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if len(user_in.face_embedding) != 128:
        raise HTTPException(status_code=400, detail="Face embedding must be 128 floats")
    
    new_user = models.User(
        username=user_in.username,
        face_embedding=json.dumps(user_in.face_embedding)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=schemas.Token)
def login(login_data: schemas.FaceLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == login_data.username).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="User not found")
    
    known_embedding = json.loads(db_user.face_embedding)
    live_embedding = login_data.face_embedding
    
    is_match = auth.compare_faces(known_embedding, live_embedding)
    if not is_match:
        raise HTTPException(status_code=401, detail="Facial authentication failed")
    
    # Authorized!
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/credentials", response_model=schemas.CredentialResponse)
def add_credential(cred_in: schemas.CredentialCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    encrypted_pw = auth.encrypt_password(cred_in.password)
    
    new_cred = models.Credential(
        site_name=cred_in.site_name,
        site_url=cred_in.site_url,
        username=cred_in.username,
        encrypted_password=encrypted_pw,
        owner_id=current_user.id
    )
    db.add(new_cred)
    db.commit()
    db.refresh(new_cred)
    
    return schemas.CredentialResponse(
        id=new_cred.id,
        site_name=new_cred.site_name,
        site_url=new_cred.site_url,
        username=new_cred.username,
        password=cred_in.password # return raw just for this response
    )

@app.get("/credentials", response_model=list[schemas.CredentialResponse])
def get_credentials(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    creds = db.query(models.Credential).filter(models.Credential.owner_id == current_user.id).all()
    results = []
    for c in creds:
        c_dict = {
            "id": c.id,
            "site_name": c.site_name,
            "site_url": c.site_url,
            "username": c.username,
            "password": auth.decrypt_password(c.encrypted_password)
        }
        results.append(schemas.CredentialResponse(**c_dict))
    return results
