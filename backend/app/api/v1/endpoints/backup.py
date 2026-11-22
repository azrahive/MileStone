from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.backup import RestoreRequest
from app.services.backup_service import BackupService

router = APIRouter()


@router.get("/export/json")
def export_backup_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = BackupService(db)
    return service.export_json(current_user)


@router.get("/export/csv")
def export_tasks_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = BackupService(db)
    csv_data = service.export_csv(current_user.id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=smarttask_tasks.csv"}
    )


@router.post("/restore")
def restore_backup_json(
    restore_req: RestoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = BackupService(db)
    return service.restore_json(current_user, restore_req)
