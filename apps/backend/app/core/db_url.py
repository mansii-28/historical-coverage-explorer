"""Database URL normalization utility."""


def normalize_database_url(url: str | None) -> str | None:
    """
    Safely normalizes a PostgreSQL connection URL to use the async psycopg driver
    scheme ('postgresql+psycopg://').

    Handles common Neon / cloud provider URL prefixes:
    - 'postgres://' -> 'postgresql+psycopg://'
    - 'postgresql://' -> 'postgresql+psycopg://'
    - 'postgresql+psycopg://' remains unchanged.

    Performs safe scheme-prefix replacement to preserve special characters,
    percent-encoded passwords, hosts, and query parameters without parsing.
    Never logs or exposes the connection string.
    """
    if not url:
        return url

    # If it already begins with postgresql+psycopg://, leave completely untouched
    if url.startswith("postgresql+psycopg://"):
        return url

    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]

    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]

    return url
