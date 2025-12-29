import sqlite3
from contextlib import contextmanager
from typing import Generator

DATABASE_URL = "therapy.db"


def init_db():
    """Initialize database and create tables"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Create therapists table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS therapists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clerk_user_id TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            date_of_birth TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            session_date TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,

            -- Structured data (stored as JSON)
            life_domains TEXT,
            emotional_themes TEXT,
            interventions TEXT,

            -- Progress and clinical notes
            overall_progress TEXT,
            session_summary TEXT,
            client_insights TEXT,
            homework_assigned TEXT,
            clinical_observations TEXT,
            risk_assessment TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients (id)
        )
    """)

    # Migration: Add session_time and status columns if they don't exist
    cursor.execute("PRAGMA table_info(sessions)")
    columns = [column[1] for column in cursor.fetchall()]

    if 'session_time' not in columns:
        cursor.execute("ALTER TABLE sessions ADD COLUMN session_time TEXT")
        print("Added session_time column to sessions table")

    if 'status' not in columns:
        cursor.execute("ALTER TABLE sessions ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'")
        print("Added status column to sessions table")

    # Migration: Add therapist_id foreign key to clients table
    cursor.execute("PRAGMA table_info(clients)")
    client_columns = [column[1] for column in cursor.fetchall()]

    if 'therapist_id' not in client_columns:
        cursor.execute("ALTER TABLE clients ADD COLUMN therapist_id INTEGER REFERENCES therapists(id)")
        print("Added therapist_id column to clients table")

    # Migration: Add therapist_id foreign key to sessions table
    cursor.execute("PRAGMA table_info(sessions)")
    session_columns = [column[1] for column in cursor.fetchall()]

    if 'therapist_id' not in session_columns:
        cursor.execute("ALTER TABLE sessions ADD COLUMN therapist_id INTEGER REFERENCES therapists(id)")
        print("Added therapist_id column to sessions table")

    # Migration: Add notes and summary fields to sessions table
    if 'notes' not in session_columns:
        cursor.execute("ALTER TABLE sessions ADD COLUMN notes TEXT")
        print("Added notes column to sessions table")

    if 'summary' not in session_columns:
        cursor.execute("ALTER TABLE sessions ADD COLUMN summary TEXT")
        print("Added summary column to sessions table")

    # Create todos table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            therapist_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            source_session_id INTEGER,
            completed_session_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients (id),
            FOREIGN KEY (therapist_id) REFERENCES therapists (id),
            FOREIGN KEY (source_session_id) REFERENCES sessions (id),
            FOREIGN KEY (completed_session_id) REFERENCES sessions (id)
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully")


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
