FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim

WORKDIR /app

# Install dependencies from lockfile (reproducible)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy source
COPY src/ ./src/

ENV PYTHONPATH=src

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
