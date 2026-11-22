from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.settings import UserSettings
from app.schemas.user import UserCreate


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower().strip()).first()

    def create(self, user_in: UserCreate, hashed_password: str) -> User:
        user = User(
            email=user_in.email.lower().strip(),
            hashed_password=hashed_password,
            full_name=user_in.full_name
        )
        self.db.add(user)
        self.db.flush()
        
        # Create default user settings
        settings = UserSettings(user_id=user.id)
        self.db.add(settings)
        self.db.commit()
        self.db.refresh(user)
        return user
