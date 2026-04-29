from sqlalchemy.orm import Session
from fastapi import HTTPException
from passlib.context import CryptContext
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.utils.jwt_utils import create_access_token

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def register_user(db: Session, req: RegisterRequest) -> UserResponse:
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(email=req.email, hashed_password=pwd_ctx.hash(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

def login_user(db: Session, req: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not pwd_ctx.verify(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)
