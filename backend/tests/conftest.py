"""Pytest fixtures: a disposable test database and per-test rollback isolation."""

from __future__ import annotations

from collections.abc import Generator

import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import Session, sessionmaker

from recipe_recommender.api.app import create_app
from recipe_recommender.config import settings
from recipe_recommender.database import Base, get_db


def _ensure_database_exists(url_str: str) -> None:
    """Create the target database if it does not already exist."""
    url = make_url(url_str)
    admin_dsn = (
        f"host={url.host} port={url.port or 5432} "
        f"user={url.username} password={url.password} dbname=postgres"
    )
    with psycopg.connect(admin_dsn, autocommit=True) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (url.database,)
        ).fetchone()
        if not exists:
            conn.execute(f'CREATE DATABASE "{url.database}"')


@pytest.fixture(scope="session")
def engine() -> Generator[Engine, None, None]:
    """Session-scoped engine bound to the test database with a fresh schema."""
    _ensure_database_exists(settings.TEST_DATABASE_URL)
    test_engine = create_engine(settings.TEST_DATABASE_URL, pool_pre_ping=True)
    Base.metadata.drop_all(test_engine)
    Base.metadata.create_all(test_engine)
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def db_session(engine: Engine) -> Generator[Session, None, None]:
    """Wrap each test in a transaction that is rolled back afterwards."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection, expire_on_commit=False)()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI test client whose ``get_db`` yields the rolled-back test session."""
    app = create_app()

    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
