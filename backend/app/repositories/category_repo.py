from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, user_id: str) -> List[Category]:
        return self.db.query(Category).filter(Category.user_id == user_id).order_by(Category.name.asc()).all()

    def get_by_id(self, category_id: str, user_id: str) -> Optional[Category]:
        return self.db.query(Category).filter(
            Category.id == category_id,
            Category.user_id == user_id
        ).first()

    def create(self, category_in: CategoryCreate, user_id: str) -> Category:
        category = Category(
            user_id=user_id,
            name=category_in.name.strip(),
            color=category_in.color or "#6366f1",
            icon=category_in.icon or "folder"
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category: Category, category_in: CategoryUpdate) -> Category:
        if category_in.name is not None:
            category.name = category_in.name.strip()
        if category_in.color is not None:
            category.color = category_in.color
        if category_in.icon is not None:
            category.icon = category_in.icon
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category: Category) -> None:
        self.db.delete(category)
        self.db.commit()
