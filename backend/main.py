from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from datetime import datetime
import json
import os
from dotenv import load_dotenv

from database import init_db, get_db
from models import (
    Client, ClientCreate, ClientUpdate,
    Session, SessionCreate, SessionUpdate, SessionWithClient,
    Therapist,
    Todo, TodoCreate, TodoUpdate
)
from auth import get_current_therapist

# Load environment variables
load_dotenv()

app = FastAPI(title="Therapy Client Management API")

# CORS middleware to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    init_db()


@app.get("/")
def read_root():
    return {"message": "Therapy Client Management API"}


# Authentication Endpoints
@app.post("/api/auth/sync", response_model=Therapist)
async def sync_therapist(therapist: Dict[str, Any] = Depends(get_current_therapist)):
    """
    Auto-create/sync therapist record on first login
    Called automatically by frontend after Clerk authentication
    """
    return therapist


@app.get("/api/auth/me", response_model=Therapist)
async def get_current_user(therapist: Dict[str, Any] = Depends(get_current_therapist)):
    """Return current authenticated therapist info"""
    return therapist


# Client Endpoints
@app.get("/api/clients", response_model=List[Client])
async def get_clients(
    status: str = None,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Get all clients for the current therapist, optionally filtered by status"""
    with get_db() as conn:
        cursor = conn.cursor()
        if status:
            cursor.execute(
                "SELECT * FROM clients WHERE therapist_id = ? AND status = ? ORDER BY last_name, first_name",
                (therapist['id'], status)
            )
        else:
            cursor.execute(
                "SELECT * FROM clients WHERE therapist_id = ? ORDER BY last_name, first_name",
                (therapist['id'],)
            )

        rows = cursor.fetchall()
        return [dict(row) for row in rows]


@app.get("/api/clients/{client_id}", response_model=Client)
async def get_client(
    client_id: int,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Get a specific client by ID (must belong to current therapist)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM clients WHERE id = ? AND therapist_id = ?",
            (client_id, therapist['id'])
        )
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Client not found")

        return dict(row)


@app.post("/api/clients", response_model=Client, status_code=201)
async def create_client(
    client: ClientCreate,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Create a new client for the current therapist"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO clients (
                first_name, last_name, date_of_birth, phone, email,
                emergency_contact_name, emergency_contact_phone, status, therapist_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            client.first_name,
            client.last_name,
            client.date_of_birth,
            client.phone,
            client.email,
            client.emergency_contact_name,
            client.emergency_contact_phone,
            client.status,
            therapist['id']
        ))

        client_id = cursor.lastrowid
        cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
        row = cursor.fetchone()

        return dict(row)


@app.put("/api/clients/{client_id}", response_model=Client)
async def update_client(
    client_id: int,
    client: ClientUpdate,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Update an existing client (must belong to current therapist)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if client exists and belongs to therapist
        cursor.execute(
            "SELECT * FROM clients WHERE id = ? AND therapist_id = ?",
            (client_id, therapist['id'])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        # Build update query dynamically for provided fields
        update_fields = []
        values = []

        for field, value in client.model_dump(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = ?")
                values.append(value)

        if update_fields:
            update_fields.append("updated_at = ?")
            values.append(datetime.now().isoformat())
            values.append(client_id)

            query = f"UPDATE clients SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, values)

        # Return updated client
        cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
        row = cursor.fetchone()

        return dict(row)


@app.delete("/api/clients/{client_id}", status_code=204)
async def delete_client(
    client_id: int,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Delete a client (soft delete by setting status to inactive, must belong to current therapist)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if client exists and belongs to therapist
        cursor.execute(
            "SELECT * FROM clients WHERE id = ? AND therapist_id = ?",
            (client_id, therapist['id'])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        # Soft delete by setting status to inactive
        cursor.execute(
            "UPDATE clients SET status = 'inactive', updated_at = ? WHERE id = ? AND therapist_id = ?",
            (datetime.now().isoformat(), client_id, therapist['id'])
        )

        return None


@app.get("/api/clients/{client_id}/session-prep")
async def get_session_prep(
    client_id: int,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """
    Get pre-session preparation data for a client:
    - Last session summary
    - Open to-dos with session context
    - Client stats
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify client belongs to therapist
        cursor.execute(
            "SELECT * FROM clients WHERE id = ? AND therapist_id = ?",
            (client_id, therapist['id'])
        )
        client = cursor.fetchone()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        client_dict = dict(client)

        # Get last session
        cursor.execute("""
            SELECT * FROM sessions
            WHERE client_id = ? AND therapist_id = ? AND status = 'completed'
            ORDER BY session_date DESC, session_time DESC
            LIMIT 1
        """, (client_id, therapist['id']))
        last_session_row = cursor.fetchone()
        last_session = dict(last_session_row) if last_session_row else None

        # Get open to-dos with session context
        cursor.execute("""
            SELECT t.*, s.session_date as source_session_date
            FROM todos t
            LEFT JOIN sessions s ON t.source_session_id = s.id
            WHERE t.client_id = ? AND t.therapist_id = ? AND t.status = 'open'
            ORDER BY t.created_at DESC
        """, (client_id, therapist['id']))
        todos_rows = cursor.fetchall()
        todos = []
        for row in todos_rows:
            todo_dict = dict(row)
            # Calculate how many sessions ago this todo was created
            if todo_dict.get('source_session_id'):
                cursor.execute("""
                    SELECT COUNT(*) FROM sessions
                    WHERE client_id = ? AND therapist_id = ? AND status = 'completed'
                    AND (session_date > ? OR (session_date = ? AND session_time > ?))
                """, (
                    client_id,
                    therapist['id'],
                    todo_dict['source_session_date'],
                    todo_dict['source_session_date'],
                    '00:00'  # Default time if not specified
                ))
                sessions_since = cursor.fetchone()[0]
                todo_dict['sessions_ago'] = sessions_since
            else:
                todo_dict['sessions_ago'] = None
            todos.append(todo_dict)

        # Get client stats
        # Total completed sessions
        cursor.execute("""
            SELECT COUNT(*) FROM sessions
            WHERE client_id = ? AND therapist_id = ? AND status = 'completed'
        """, (client_id, therapist['id']))
        total_sessions = cursor.fetchone()[0]

        # Days since first session (how long they've been a client)
        cursor.execute("""
            SELECT MIN(session_date) FROM sessions
            WHERE client_id = ? AND therapist_id = ?
        """, (client_id, therapist['id']))
        first_session_date = cursor.fetchone()[0]
        days_as_client = None
        if first_session_date:
            from datetime import date
            first_date = date.fromisoformat(first_session_date)
            days_as_client = (date.today() - first_date).days

        # Last session date
        last_session_date = last_session['session_date'] if last_session else None

        return {
            'client': client_dict,
            'last_session': last_session,
            'open_todos': todos,
            'stats': {
                'total_sessions': total_sessions,
                'days_as_client': days_as_client,
                'last_session_date': last_session_date
            }
        }


# Helper function to parse session row
def parse_session_row(row):
    """Parse a session row and deserialize JSON fields"""
    session_dict = dict(row)
    # Parse JSON fields
    for field in ['life_domains', 'emotional_themes', 'interventions']:
        if session_dict.get(field):
            try:
                session_dict[field] = json.loads(session_dict[field])
            except:
                session_dict[field] = {} if field != 'interventions' else []
        else:
            session_dict[field] = {} if field != 'interventions' else []
    return session_dict


def parse_session_with_client_row(row):
    """Parse session row with client info embedded"""
    session_dict = parse_session_row(row)
    # Add client info from joined columns
    session_dict['first_name'] = row['first_name']
    session_dict['last_name'] = row['last_name']
    return session_dict


# Session endpoints
@app.get("/api/sessions", response_model=List[Session])
async def get_sessions(
    client_id: int = None,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Get all sessions for current therapist's clients, optionally filtered by client_id"""
    with get_db() as conn:
        cursor = conn.cursor()
        if client_id:
            # Verify client belongs to therapist and get their sessions
            cursor.execute("""
                SELECT s.* FROM sessions s
                JOIN clients c ON s.client_id = c.id
                WHERE s.client_id = ? AND c.therapist_id = ?
                ORDER BY s.session_date DESC
            """, (client_id, therapist['id']))
        else:
            # Get all sessions for therapist's clients
            cursor.execute("""
                SELECT s.* FROM sessions s
                JOIN clients c ON s.client_id = c.id
                WHERE c.therapist_id = ?
                ORDER BY s.session_date DESC
            """, (therapist['id'],))

        rows = cursor.fetchall()
        return [parse_session_row(row) for row in rows]


@app.get("/api/sessions/today", response_model=List[SessionWithClient])
async def get_today_sessions(therapist: Dict[str, Any] = Depends(get_current_therapist)):
    """Get all sessions scheduled for today for current therapist's clients"""
    today = datetime.now().date().isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                s.*,
                c.first_name,
                c.last_name
            FROM sessions s
            JOIN clients c ON s.client_id = c.id
            WHERE s.session_date = ? AND c.therapist_id = ?
            ORDER BY
                CASE WHEN s.session_time IS NULL THEN 1 ELSE 0 END,
                s.session_time ASC,
                s.created_at ASC
        """, (today, therapist['id']))

        rows = cursor.fetchall()
        return [parse_session_with_client_row(row) for row in rows]


@app.get("/api/sessions/{session_id}", response_model=Session)
async def get_session(
    session_id: int,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Get a specific session by ID (must belong to therapist's client)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.* FROM sessions s
            JOIN clients c ON s.client_id = c.id
            WHERE s.id = ? AND c.therapist_id = ?
        """, (session_id, therapist['id']))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        return parse_session_row(row)


@app.post("/api/sessions", response_model=Session, status_code=201)
async def create_session(
    session: SessionCreate,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Create a new session for therapist's client"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if client exists and belongs to therapist
        cursor.execute(
            "SELECT * FROM clients WHERE id = ? AND therapist_id = ?",
            (session.client_id, therapist['id'])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        cursor.execute("""
            INSERT INTO sessions (
                client_id, session_date, session_time, duration_minutes, status,
                life_domains, emotional_themes, interventions,
                overall_progress, session_summary, client_insights,
                homework_assigned, clinical_observations, risk_assessment, therapist_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session.client_id,
            session.session_date,
            session.session_time,
            session.duration_minutes,
            session.status,
            json.dumps(session.life_domains),
            json.dumps(session.emotional_themes),
            json.dumps(session.interventions),
            session.overall_progress,
            session.session_summary,
            session.client_insights,
            session.homework_assigned,
            session.clinical_observations,
            session.risk_assessment,
            therapist['id']
        ))

        session_id = cursor.lastrowid
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()

        return parse_session_row(row)


@app.put("/api/sessions/{session_id}", response_model=Session)
async def update_session(
    session_id: int,
    session: SessionUpdate,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Update an existing session (must belong to therapist's client)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if session exists and belongs to therapist
        cursor.execute("""
            SELECT s.* FROM sessions s
            JOIN clients c ON s.client_id = c.id
            WHERE s.id = ? AND c.therapist_id = ?
        """, (session_id, therapist['id']))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")

        # Build update query dynamically for provided fields
        update_fields = []
        values = []

        for field, value in session.model_dump(exclude_unset=True).items():
            if value is not None:
                # Serialize JSON fields
                if field in ['life_domains', 'emotional_themes', 'interventions']:
                    value = json.dumps(value)

                update_fields.append(f"{field} = ?")
                values.append(value)

        if update_fields:
            update_fields.append("updated_at = ?")
            values.append(datetime.now().isoformat())
            values.append(session_id)

            query = f"UPDATE sessions SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, values)

        # Return updated session
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()

        return parse_session_row(row)


@app.delete("/api/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: int,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Delete a session (must belong to therapist's client)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if session exists and belongs to therapist
        cursor.execute("""
            SELECT s.* FROM sessions s
            JOIN clients c ON s.client_id = c.id
            WHERE s.id = ? AND c.therapist_id = ?
        """, (session_id, therapist['id']))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")

        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))

        return None


@app.post("/api/sessions/schedule", response_model=Session, status_code=201)
async def schedule_session(
    session: SessionCreate,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Quick schedule endpoint for creating appointment slots for therapist's client"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if client exists and belongs to therapist
        cursor.execute(
            "SELECT * FROM clients WHERE id = ? AND therapist_id = ?",
            (session.client_id, therapist['id'])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        cursor.execute("""
            INSERT INTO sessions (
                client_id, session_date, session_time, duration_minutes, status,
                life_domains, emotional_themes, interventions,
                overall_progress, session_summary, client_insights,
                homework_assigned, clinical_observations, risk_assessment, therapist_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session.client_id,
            session.session_date,
            session.session_time,
            session.duration_minutes,
            session.status,
            json.dumps(session.life_domains),
            json.dumps(session.emotional_themes),
            json.dumps(session.interventions),
            session.overall_progress,
            session.session_summary,
            session.client_insights,
            session.homework_assigned,
            session.clinical_observations,
            session.risk_assessment,
            therapist['id']
        ))

        session_id = cursor.lastrowid
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()

        return parse_session_row(row)


@app.patch("/api/sessions/{session_id}/cancel", response_model=Session)
async def cancel_session(
    session_id: int,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Mark a session as cancelled (must belong to therapist's client). Keeps record for history."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if session exists and belongs to therapist
        cursor.execute("""
            SELECT s.* FROM sessions s
            JOIN clients c ON s.client_id = c.id
            WHERE s.id = ? AND c.therapist_id = ?
        """, (session_id, therapist['id']))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")

        # Update status to cancelled
        cursor.execute("""
            UPDATE sessions
            SET status = 'cancelled', updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), session_id))

        # Return updated session
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()

        return parse_session_row(row)


# Todo Endpoints
@app.get("/api/todos", response_model=List[Todo])
async def get_todos(
    client_id: int,
    status: str = None,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Get todos for a specific client (must belong to current therapist)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify client belongs to therapist
        cursor.execute(
            "SELECT id FROM clients WHERE id = ? AND therapist_id = ?",
            (client_id, therapist['id'])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        # Get todos
        if status:
            cursor.execute("""
                SELECT * FROM todos
                WHERE client_id = ? AND therapist_id = ? AND status = ?
                ORDER BY created_at DESC
            """, (client_id, therapist['id'], status))
        else:
            cursor.execute("""
                SELECT * FROM todos
                WHERE client_id = ? AND therapist_id = ?
                ORDER BY created_at DESC
            """, (client_id, therapist['id']))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]


@app.post("/api/todos", response_model=Todo, status_code=201)
async def create_todo(
    todo: TodoCreate,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Create a new todo for a client (must belong to current therapist)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify client belongs to therapist
        cursor.execute(
            "SELECT id FROM clients WHERE id = ? AND therapist_id = ?",
            (todo.client_id, therapist['id'])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        # Create todo
        cursor.execute("""
            INSERT INTO todos (
                client_id, therapist_id, text, status, source_session_id, created_at, updated_at
            ) VALUES (?, ?, ?, 'open', ?, ?, ?)
        """, (
            todo.client_id,
            therapist['id'],
            todo.text,
            todo.source_session_id,
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))

        todo_id = cursor.lastrowid
        cursor.execute("SELECT * FROM todos WHERE id = ?", (todo_id,))
        row = cursor.fetchone()

        return dict(row)


@app.patch("/api/todos/{todo_id}", response_model=Todo)
async def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    therapist: Dict[str, Any] = Depends(get_current_therapist)
):
    """Update a todo (must belong to current therapist)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if todo exists and belongs to therapist
        cursor.execute(
            "SELECT * FROM todos WHERE id = ? AND therapist_id = ?",
            (todo_id, therapist['id'])
        )
        existing_todo = cursor.fetchone()
        if not existing_todo:
            raise HTTPException(status_code=404, detail="Todo not found")

        # Build update query dynamically
        update_fields = []
        update_values = []

        if todo_update.text is not None:
            update_fields.append("text = ?")
            update_values.append(todo_update.text)

        if todo_update.status is not None:
            update_fields.append("status = ?")
            update_values.append(todo_update.status)

        if todo_update.completed_session_id is not None:
            update_fields.append("completed_session_id = ?")
            update_values.append(todo_update.completed_session_id)

        if not update_fields:
            # No fields to update, return existing todo
            return dict(existing_todo)

        # Add updated_at
        update_fields.append("updated_at = ?")
        update_values.append(datetime.now().isoformat())

        # Add todo_id for WHERE clause
        update_values.append(todo_id)

        # Execute update
        query = f"UPDATE todos SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, update_values)

        # Return updated todo
        cursor.execute("SELECT * FROM todos WHERE id = ?", (todo_id,))
        row = cursor.fetchone()

        return dict(row)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
