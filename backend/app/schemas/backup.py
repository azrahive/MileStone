from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class BackupExportData(BaseModel):
    version: str = "1.0.0"
    exported_at: str
    user_email: str
    categories: List[Dict[str, Any]]
    tags: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    tasks: List[Dict[str, Any]]
    subtasks: List[Dict[str, Any]]


class RestoreRequest(BaseModel):
    backup_data: BackupExportData
    merge_strategy: str = "merge" # merge or replace
