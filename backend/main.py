from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
import json

from database import init_db, get_db
from models import Client, ClientCreate, ClientUpdate, Session, SessionCreate, SessionUpdate, SessionWithClient

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


@app.get("/api/clients", response_model=List[Client])
def get_clients(status: str = None):
    """Get all clients, optionally filtered by status"""
    with get_db() as conn:
        cursor = conn.cursor()
        if status:
            cursor.execute(
                "SELECT * FROM clients WHERE status = ? ORDER BY last_name, first_name",
                (status,)
            )
        else:
            cursor.execute("SELECT * FROM clients ORDER BY last_name, first_name")

        rows = cursor.fetchall()
        return [dict(row) for row in rows]


@app.get("/api/clients/{client_id}", response_model=Client)
def get_client(client_id: int):
    """Get a specific client by ID"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Client not found")

        return dict(row)


@app.post("/api/clients", response_model=Client, status_code=201)
def create_client(client: ClientCreate):
    """Create a new client"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO clients (
                first_name, last_name, date_of_birth, phone, email,
                emergency_contact_name, emergency_contact_phone, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            client.first_name,
            client.last_name,
            client.date_of_birth,
            client.phone,
            client.email,
            client.emergency_contact_name,
            client.emergency_contact_phone,
            client.status
        ))

        client_id = cursor.lastrowid
        cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
        row = cursor.fetchone()

        return dict(row)


@app.put("/api/clients/{client_id}", response_model=Client)
def update_client(client_id: int, client: ClientUpdate):
    """Update an existing client"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if client exists
        cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
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
def delete_client(client_id: int):
    """Delete a client (soft delete by setting status to inactive)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if client exists
        cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        # Soft delete by setting status to inactive
        cursor.execute(
            "UPDATE clients SET status = 'inactive', updated_at = ? WHERE id = ?",
            (datetime.now().isoformat(), client_id)
        )

        return None


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
def get_sessions(client_id: int = None):
    """Get all sessions, optionally filtered by client_id"""
    with get_db() as conn:
        cursor = conn.cursor()
        if client_id:
            cursor.execute(
                "SELECT * FROM sessions WHERE client_id = ? ORDER BY session_date DESC",
                (client_id,)
            )
        else:
            cursor.execute("SELECT * FROM sessions ORDER BY session_date DESC")

        rows = cursor.fetchall()
        return [parse_session_row(row) for row in rows]


@app.get("/api/sessions/today", response_model=List[SessionWithClient])
def get_today_sessions():
    """Get all sessions scheduled for today across all clients"""
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
            WHERE s.session_date = ?
            ORDER BY
                CASE WHEN s.session_time IS NULL THEN 1 ELSE 0 END,
                s.session_time ASC,
                s.created_at ASC
        """, (today,))

        rows = cursor.fetchall()
        return [parse_session_with_client_row(row) for row in rows]


@app.get("/api/sessions/{session_id}", response_model=Session)
def get_session(session_id: int):
    """Get a specific session by ID"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        return parse_session_row(row)


@app.post("/api/sessions", response_model=Session, status_code=201)
def create_session(session: SessionCreate):
    """Create a new session"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if client exists
        cursor.execute("SELECT * FROM clients WHERE id = ?", (session.client_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        cursor.execute("""
            INSERT INTO sessions (
                client_id, session_date, session_time, duration_minutes, status,
                life_domains, emotional_themes, interventions,
                overall_progress, session_summary, client_insights,
                homework_assigned, clinical_observations, risk_assessment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            session.risk_assessment
        ))

        session_id = cursor.lastrowid
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()

        return parse_session_row(row)


@app.put("/api/sessions/{session_id}", response_model=Session)
def update_session(session_id: int, session: SessionUpdate):
    """Update an existing session"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if session exists
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
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
def delete_session(session_id: int):
    """Delete a session"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if session exists
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")

        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))

        return None


@app.post("/api/sessions/schedule", response_model=Session, status_code=201)
def schedule_session(session: SessionCreate):
    """Quick schedule endpoint for creating appointment slots with minimal data"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if client exists
        cursor.execute("SELECT * FROM clients WHERE id = ?", (session.client_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        cursor.execute("""
            INSERT INTO sessions (
                client_id, session_date, session_time, duration_minutes, status,
                life_domains, emotional_themes, interventions,
                overall_progress, session_summary, client_insights,
                homework_assigned, clinical_observations, risk_assessment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            session.risk_assessment
        ))

        session_id = cursor.lastrowid
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()

        return parse_session_row(row)


@app.patch("/api/sessions/{session_id}/cancel", response_model=Session)
def cancel_session(session_id: int):
    """Mark a session as cancelled. Keeps record for history."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if session exists
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
