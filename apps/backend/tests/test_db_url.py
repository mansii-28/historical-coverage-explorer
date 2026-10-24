"""Unit tests for database URL normalization."""

from app.core.db_url import normalize_database_url


def test_normalize_postgres_prefix():
    raw = "postgres://user:password@ep-cool-host.neon.tech/neondb"
    normalized = normalize_database_url(raw)
    assert normalized == "postgresql+psycopg://user:password@ep-cool-host.neon.tech/neondb"


def test_normalize_postgresql_prefix():
    raw = "postgresql://user:secret@ep-cool-host.neon.tech/neondb?sslmode=require"
    normalized = normalize_database_url(raw)
    assert (
        normalized
        == "postgresql+psycopg://user:secret@ep-cool-host.neon.tech/neondb?sslmode=require"
    )


def test_normalize_postgresql_psycopg_prefix_unchanged():
    raw = "postgresql+psycopg://hce_user:changeme@localhost:5432/historical_coverage"
    normalized = normalize_database_url(raw)
    assert normalized == raw


def test_normalize_preserves_encoded_passwords_and_query_params():
    raw = "postgresql://user:p%40ss%23word@neon-host:5432/prod_db?sslmode=require&channel_binding=prefer"
    normalized = normalize_database_url(raw)
    assert (
        normalized
        == "postgresql+psycopg://user:p%40ss%23word@neon-host:5432/prod_db?sslmode=require&channel_binding=prefer"
    )


def test_normalize_none_and_empty():
    assert normalize_database_url(None) is None
    assert normalize_database_url("") == ""


def test_normalize_other_scheme_unchanged():
    raw = "sqlite+aiosqlite:///test.db"
    assert normalize_database_url(raw) == raw
