from pathlib import Path

from app.core.config import BACKEND_DIR, Settings


def test_relative_sqlite_url_resolves_from_backend_directory():
    settings = Settings(DATABASE_URL="sqlite:///./milestone.db")

    assert settings.DATABASE_URL == f"sqlite:///{BACKEND_DIR / 'milestone.db'}"


def test_default_sqlite_url_uses_backend_database():
    settings = Settings()

    assert settings.DATABASE_URL.endswith(str(Path("backend") / "milestone.db"))
