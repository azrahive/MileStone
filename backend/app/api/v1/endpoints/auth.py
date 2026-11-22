from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse, ProfileUpdate, PasswordChange
from app.services.auth_service import AuthService
from app.core.security import verify_password, get_password_hash
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.register(user_in)


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.login(login_data)


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if profile_in.email and profile_in.email.lower().strip() != current_user.email:
        existing = db.query(User).filter(User.email == profile_in.email.lower().strip()).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
        current_user.email = profile_in.email.lower().strip()
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name.strip()
    if "avatar_url" in profile_in.model_fields_set:
        current_user.avatar_url = profile_in.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
def change_password(
    pwd_in: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match."
        )
    if len(pwd_in.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters."
        )
    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    db.commit()
    return {"message": "Password updated successfully."}
