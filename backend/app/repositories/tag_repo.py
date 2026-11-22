from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate


class TagRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, user_id: str) -> List[Tag]:
        return self.db.query(Tag).filter(Tag.user_id == user_id).order_by(Tag.name.asc()).all()

    def get_by_id(self, tag_id: str, user_id: str) -> Optional[Tag]:
        return self.db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()

    def get_by_ids(self, tag_ids: List[str], user_id: str) -> List[Tag]:
        if not tag_ids:
            return []
        return self.db.query(Tag).filter(Tag.id.in_(tag_ids), Tag.user_id == user_id).all()

    def create(self, tag_in: TagCreate, user_id: str) -> Tag:
        tag = Tag(
            user_id=user_id,
            name=tag_in.name.strip(),
            color=tag_in.color or "#6366f1"
        )
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def update(self, tag: Tag, tag_in: TagUpdate) -> Tag:
        if tag_in.name is not None:
            tag.name = tag_in.name.strip()
        if tag_in.color is not None:
            tag.color = tag_in.color
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def delete(self, tag: Tag) -> None:
        self.db.delete(tag)
        self.db.commit()
