"""Run schema migrations against the Supabase database."""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")

engine = create_engine(DATABASE_URL)

migrations = [
    # Add profile columns to users (safe – IF NOT EXISTS)
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)",

    # Create comments table
    """
    CREATE TABLE IF NOT EXISTS comments (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        article_id  INTEGER,
        story_id    INTEGER,
        content     TEXT NOT NULL,
        user_country VARCHAR(100),
        user_city    VARCHAR(100),
        created_at  TIMESTAMP DEFAULT NOW()
    )
    """,

    # Indexes for fast lookups
    "CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id)",
    "CREATE INDEX IF NOT EXISTS idx_comments_story_id   ON comments(story_id)",
    "CREATE INDEX IF NOT EXISTS idx_comments_user_id    ON comments(user_id)",
]

with engine.connect() as conn:
    for sql in migrations:
        label = sql.strip().splitlines()[0][:70]
        conn.execute(text(sql))
        print(f"  OK  {label}")
    conn.commit()

print("All migrations applied successfully.")
