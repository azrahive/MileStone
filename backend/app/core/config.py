import json
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    PROJECT_NAME: str = "MileStone"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "milestone_dev_secret_key_849203847592038495029384750293847"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite default, easily swapped with postgresql+psycopg2://user:pass@host:5432/dbname
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'milestone.db'}"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return f"postgresql://{value.removeprefix('postgres://')}"
        database_url = make_url(value)
        database_path = database_url.database
        if (
            database_url.drivername.startswith("sqlite")
            and database_path
            and database_path != ":memory:"
            and not Path(database_path).is_absolute()
        ):
            database_path = str((BACKEND_DIR / database_path).resolve())
            return database_url.set(database=database_path).render_as_string(hide_password=False)
        return value
    
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost",
        "capacitor://localhost",
        "*"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
