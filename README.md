# International-News

Compare how different countries cover the same news stories. Select any topic and see side-by-side coverage from news sources across the globe, revealing diverse perspectives and regional reporting differences on international events.

## Tech Stack

- **Python** + **FastAPI** + **Uvicorn**
- **SQLAlchemy** (ORM) + **SQLite**
- **JWT** authentication with **Argon2** password hashing
- **Pydantic** for data validation

## Project Structure

```
src/
└── app/
    ├── main.py          # App entry point, middleware
    ├── api/v1/          # Router composition
    ├── routes/          # API endpoint handlers
    ├── services/        # Business logic
    ├── repository/      # Database access layer
    ├── models/          # SQLAlchemy ORM models
    ├── schemas/         # Pydantic request/response schemas
    └── core/            # Auth, database, settings, dependencies
```

## Setup & Installation

### Prerequisites
- Python 3.14+
- [uv](https://docs.astral.sh/uv/) package manager

### Install uv (if not installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Install dependencies

```bash
uv sync
```

## Running the Application

```bash
uv run uvicorn src.app.main:app --reload
```

The API will be available at: `http://localhost:8000`

Interactive API docs: `http://localhost:8000/docs`

## Running Tests

```bash
uv run pytest
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/signup` | Register a new user | No |
| POST | `/api/v1/auth/login` | Login and get JWT token | No |
| GET | `/api/v1/users/me` | Get current user profile | Yes |
| GET | `/api/v1/users/{id}` | Get user by ID | No |
| PUT | `/api/v1/users/{id}` | Update user | Yes |
| DELETE | `/api/v1/users/{id}` | Delete user | Yes |
| GET | `/api/v1/articles` | Search/filter articles | No |
| GET | `/api/v1/articles/{id}` | Get article by ID | No |
| GET | `/api/v1/topics/{id}/coverage` | Compare coverage across countries | No |
| GET | `/api/v1/countries` | List all countries | No |
| GET | `/api/v1/regions` | List all regions | No |
| GET | `/api/v1/bookmarks` | Get user bookmarks | Yes |
| POST | `/api/v1/bookmarks` | Bookmark an article | Yes |
| DELETE | `/api/v1/bookmarks/{id}` | Remove a bookmark | Yes |

## Environment Variables

Create a `.env` file in the root directory to override defaults:

```env
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///./Horizon_News.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
```
