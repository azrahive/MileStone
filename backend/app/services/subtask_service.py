from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.subtask_repo import SubtaskRepository
from app.repositories.task_repo import TaskRepository
from app.schemas.subtask import SubtaskCreate, SubtaskUpdate, SubtaskResponse


class SubtaskService:
    def __init__(self, db: Session):
        self.db = db
        self.subtask_repo = SubtaskRepository(db)
        self.task_repo = TaskRepository(db)

    def get_by_task_id(self, task_id: str, user_id: str) -> List[SubtaskResponse]:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        subtasks = self.subtask_repo.get_by_task_id(task_id)
        return [SubtaskResponse.model_validate(s) for s in subtasks]

    def create(self, task_id: str, subtask_in: SubtaskCreate, user_id: str) -> SubtaskResponse:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        subtask = self.subtask_repo.create(subtask_in, task_id)
        return SubtaskResponse.model_validate(subtask)

    def update(self, subtask_id: str, subtask_in: SubtaskUpdate, user_id: str) -> SubtaskResponse:
        subtask = self.subtask_repo.get_by_id(subtask_id)
        if not subtask or subtask.task.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")
        updated = self.subtask_repo.update(subtask, subtask_in)
        return SubtaskResponse.model_validate(updated)

    def toggle(self, subtask_id: str, user_id: str) -> SubtaskResponse:
        subtask = self.subtask_repo.get_by_id(subtask_id)
        if not subtask or subtask.task.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")
        toggled = self.subtask_repo.toggle_complete(subtask)
        return SubtaskResponse.model_validate(toggled)

    def delete(self, subtask_id: str, user_id: str) -> None:
        subtask = self.subtask_repo.get_by_id(subtask_id)
        if not subtask or subtask.task.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")
        self.subtask_repo.delete(subtask)
