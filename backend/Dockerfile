# Backend image: FastAPI app served by uvicorn, deps managed by uv.
FROM python:3.12-slim

# uv for fast, reproducible installs from the lockfile.
COPY --from=ghcr.io/astral-sh/uv:0.5.9 /uv /uvx /bin/

WORKDIR /app

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# Install dependencies first (cached layer), then the project.
COPY pyproject.toml ./
RUN uv sync --no-install-project --no-dev

COPY . .
RUN uv sync --no-dev

# Compose overrides this with `alembic upgrade head && uvicorn ... --reload`.
CMD ["uvicorn", "recipe_recommender.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
