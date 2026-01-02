"""
Intake System API Routes
Handles client intake forms, assessments, and form link management
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
import json
import secrets
from datetime import datetime, timedelta
from database import get_db
from models import (
    FormLinkCreate, FormLink,
    IntakeResponseCreate, IntakeResponseUpdate, IntakeResponse,
    AssessmentResponseCreate, AssessmentResponse,
    IntakeWithAssessments
)
from auth import get_current_therapist

router = APIRouter(prefix="/api/intake", tags=["intake"])


def generate_secure_token():
    """Generate a cryptographically secure token"""
    return secrets.token_urlsafe(32)


# ============================================================================
# THERAPIST ENDPOINTS (Protected)
# ============================================================================

@router.post("/create-link", response_model=dict)
def create_intake_link(
    form_data: FormLinkCreate,
    therapist_id: int = Depends(get_current_therapist)
):
    """
    Create a secure intake form link
    Returns link token and public URL
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Generate unique token
        link_token = generate_secure_token()

        # Calculate expiration
        expires_at = datetime.now() + timedelta(days=form_data.expires_in_days)

        # Insert form link
        cursor.execute("""
            INSERT INTO form_links (
                therapist_id, client_email, client_name, link_token,
                form_type, included_assessments, expires_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            therapist_id,
            form_data.client_email,
            form_data.client_name,
            link_token,
            form_data.form_type,
            json.dumps(form_data.included_assessments),
            expires_at.isoformat(),
            datetime.now().isoformat()
        ))

        # Also create the intake_response record
        cursor.execute("""
            INSERT INTO intake_responses (
                therapist_id, form_type, responses, status,
                link_token, expires_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            therapist_id,
            form_data.form_type,
            json.dumps({}),  # Empty responses initially
            'pending',
            link_token,
            expires_at.isoformat(),
            datetime.now().isoformat()
        ))

        conn.commit()

        return {
            "link_token": link_token,
            "public_url": f"/intake/{link_token}",
            "expires_at": expires_at.isoformat(),
            "client_email": form_data.client_email,
            "form_type": form_data.form_type
        }


@router.post("/send-email")
def send_intake_email(
    link_token: str,
    custom_message: str = "",
    therapist_id: int = Depends(get_current_therapist)
):
    """
    Send intake form email to client
    TODO: Integrate with email service (SendGrid, Postmark, etc.)
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify link belongs to therapist
        cursor.execute("""
            SELECT client_email, client_name, form_type
            FROM form_links
            WHERE link_token = ? AND therapist_id = ?
        """, (link_token, therapist_id))

        link = cursor.fetchone()
        if not link:
            raise HTTPException(status_code=404, detail="Link not found")

        # Update sent_at timestamp
        cursor.execute("""
            UPDATE form_links
            SET sent_at = ?, status = 'sent'
            WHERE link_token = ?
        """, (datetime.now().isoformat(), link_token))

        conn.commit()

        # TODO: Actually send email here
        # For now, just return success
        return {
            "success": True,
            "message": f"Email would be sent to {link['client_email']}",
            "note": "Email integration pending - use the link directly for now"
        }


@router.get("/pending", response_model=List[dict])
def get_pending_intakes(therapist_id: int = Depends(get_current_therapist)):
    """
    Get all pending/completed intake responses for therapist
    """
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                ir.id,
                ir.form_type,
                ir.status,
                ir.completed_at,
                ir.created_at,
                fl.client_name,
                fl.client_email
            FROM intake_responses ir
            LEFT JOIN form_links fl ON ir.link_token = fl.link_token
            WHERE ir.therapist_id = ?
            AND ir.status IN ('in_progress', 'completed')
            ORDER BY ir.created_at DESC
        """, (therapist_id,))

        intakes = []
        for row in cursor.fetchall():
            intakes.append({
                "id": row[0],
                "form_type": row[1],
                "status": row[2],
                "completed_at": row[3],
                "created_at": row[4],
                "client_name": row[5],
                "client_email": row[6]
            })

        return intakes


@router.get("/review/{intake_id}", response_model=dict)
def get_intake_for_review(
    intake_id: int,
    therapist_id: int = Depends(get_current_therapist)
):
    """
    Get intake response and assessments for therapist review
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Get intake response
        cursor.execute("""
            SELECT
                ir.*,
                fl.client_name,
                fl.client_email
            FROM intake_responses ir
            LEFT JOIN form_links fl ON ir.link_token = fl.link_token
            WHERE ir.id = ? AND ir.therapist_id = ?
        """, (intake_id, therapist_id))

        intake_row = cursor.fetchone()
        if not intake_row:
            raise HTTPException(status_code=404, detail="Intake not found")

        intake = {
            "id": intake_row[0],
            "client_id": intake_row[1],
            "therapist_id": intake_row[2],
            "form_type": intake_row[3],
            "responses": json.loads(intake_row[4]) if intake_row[4] else {},
            "status": intake_row[5],
            "completed_at": intake_row[7],
            "client_name": intake_row[-2],
            "client_email": intake_row[-1]
        }

        # Get associated assessments
        cursor.execute("""
            SELECT id, assessment_id, responses, scores, completed_at
            FROM assessment_responses
            WHERE intake_response_id = ?
        """, (intake_id,))

        assessments = []
        for row in cursor.fetchall():
            assessments.append({
                "id": row[0],
                "assessment_id": row[1],
                "responses": json.loads(row[2]) if row[2] else {},
                "scores": json.loads(row[3]) if row[3] else {},
                "completed_at": row[4]
            })

        intake["assessments"] = assessments

        return intake


@router.post("/approve/{intake_id}")
def approve_intake(
    intake_id: int,
    create_client: bool = True,
    therapist_id: int = Depends(get_current_therapist)
):
    """
    Approve intake and optionally create client profile
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Get intake and form link
        cursor.execute("""
            SELECT ir.*, fl.client_name, fl.client_email
            FROM intake_responses ir
            LEFT JOIN form_links fl ON ir.link_token = fl.link_token
            WHERE ir.id = ? AND ir.therapist_id = ?
        """, (intake_id, therapist_id))

        intake = cursor.fetchone()
        if not intake:
            raise HTTPException(status_code=404, detail="Intake not found")

        client_name = intake[-2]
        client_email = intake[-1]
        responses = json.loads(intake[4]) if intake[4] else {}

        client_id = None

        # Create client if requested
        if create_client and client_name:
            # Extract basic info from responses
            first_name = client_name.split()[0] if client_name else "Unknown"
            last_name = " ".join(client_name.split()[1:]) if len(client_name.split()) > 1 else ""

            # Try to get DOB from intake form
            dob = responses.get('date_of_birth', '1990-01-01')

            cursor.execute("""
                INSERT INTO clients (
                    first_name, last_name, date_of_birth,
                    email, phone, therapist_id, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                first_name,
                last_name,
                dob,
                client_email,
                responses.get('phone', ''),
                therapist_id,
                'active',
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))

            client_id = cursor.lastrowid

            # Update intake with client_id
            cursor.execute("""
                UPDATE intake_responses
                SET client_id = ?, reviewed_at = ?, status = 'reviewed'
                WHERE id = ?
            """, (client_id, datetime.now().isoformat(), intake_id))

            # Update assessments with client_id
            cursor.execute("""
                UPDATE assessment_responses
                SET client_id = ?
                WHERE intake_response_id = ?
            """, (client_id, intake_id))
        else:
            # Just mark as reviewed
            cursor.execute("""
                UPDATE intake_responses
                SET reviewed_at = ?, status = 'reviewed'
                WHERE id = ?
            """, (datetime.now().isoformat(), intake_id))

        conn.commit()

        return {
            "success": True,
            "client_id": client_id,
            "message": "Intake approved" + (" and client created" if client_id else "")
        }


# ============================================================================
# PUBLIC ENDPOINTS (No authentication required)
# ============================================================================

@router.get("/form/{token}", response_model=dict)
def get_intake_form_by_token(token: str):
    """
    Get intake form configuration by token (public endpoint)
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Get form link
        cursor.execute("""
            SELECT
                form_type, included_assessments, expires_at,
                status, client_name
            FROM form_links
            WHERE link_token = ?
        """, (token,))

        link = cursor.fetchone()
        if not link:
            raise HTTPException(status_code=404, detail="Invalid or expired link")

        # Check expiration
        expires_at = datetime.fromisoformat(link[2])
        if datetime.now() > expires_at:
            raise HTTPException(status_code=410, detail="Link has expired")

        # Mark as opened if first time
        if link[3] == 'sent':
            cursor.execute("""
                UPDATE form_links
                SET status = 'opened', opened_at = ?
                WHERE link_token = ?
            """, (datetime.now().isoformat(), token))
            conn.commit()

        # Get existing responses if any
        cursor.execute("""
            SELECT responses, status
            FROM intake_responses
            WHERE link_token = ?
        """, (token,))

        intake = cursor.fetchone()
        existing_responses = json.loads(intake[0]) if intake and intake[0] else {}
        status = intake[1] if intake else 'pending'

        return {
            "token": token,
            "form_type": link[0],
            "included_assessments": json.loads(link[1]) if link[1] else [],
            "client_name": link[4],
            "status": status,
            "existing_responses": existing_responses
        }


@router.post("/submit/{token}")
def submit_intake_section(token: str, responses: dict):
    """
    Submit intake form section (public endpoint)
    Allows incremental saves
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify token
        cursor.execute("""
            SELECT expires_at FROM form_links WHERE link_token = ?
        """, (token,))
        link = cursor.fetchone()

        if not link:
            raise HTTPException(status_code=404, detail="Invalid link")

        # Check expiration
        expires_at = datetime.fromisoformat(link[0])
        if datetime.now() > expires_at:
            raise HTTPException(status_code=410, detail="Link has expired")

        # Get existing responses
        cursor.execute("""
            SELECT id, responses, started_at
            FROM intake_responses
            WHERE link_token = ?
        """, (token,))

        intake = cursor.fetchone()
        if not intake:
            raise HTTPException(status_code=404, detail="Intake not found")

        # Merge new responses with existing
        existing = json.loads(intake[1]) if intake[1] else {}
        existing.update(responses)

        # Update with merged responses
        started_at = intake[2] if intake[2] else datetime.now().isoformat()

        cursor.execute("""
            UPDATE intake_responses
            SET responses = ?, status = 'in_progress', started_at = ?
            WHERE id = ?
        """, (json.dumps(existing), started_at, intake[0]))

        conn.commit()

        return {"success": True, "message": "Progress saved"}


@router.post("/submit-assessment/{token}")
def submit_assessment(token: str, assessment_data: dict):
    """
    Submit assessment responses (public endpoint)
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Get intake response ID
        cursor.execute("""
            SELECT ir.id, ir.therapist_id, fl.expires_at
            FROM intake_responses ir
            JOIN form_links fl ON ir.link_token = fl.link_token
            WHERE ir.link_token = ?
        """, (token,))

        intake = cursor.fetchone()
        if not intake:
            raise HTTPException(status_code=404, detail="Invalid link")

        # Check expiration
        expires_at = datetime.fromisoformat(intake[2])
        if datetime.now() > expires_at:
            raise HTTPException(status_code=410, detail="Link has expired")

        intake_id = intake[0]
        therapist_id = intake[1]
        assessment_id = assessment_data.get('assessment_id')
        responses = assessment_data.get('responses', {})

        # Calculate scores (simplified - should import from assessments.js logic)
        scores = {"raw": "calculated_scores_here"}  # TODO: Implement proper scoring

        # Insert assessment response
        cursor.execute("""
            INSERT INTO assessment_responses (
                therapist_id, intake_response_id, assessment_id,
                responses, scores, completed_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            therapist_id,
            intake_id,
            assessment_id,
            json.dumps(responses),
            json.dumps(scores),
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))

        conn.commit()

        return {"success": True, "message": "Assessment submitted"}


@router.post("/complete/{token}")
def complete_intake(token: str):
    """
    Mark intake as completed (public endpoint)
    """
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE intake_responses
            SET status = 'completed', completed_at = ?
            WHERE link_token = ?
        """, (datetime.now().isoformat(), token))

        # Also update form link status
        cursor.execute("""
            UPDATE form_links
            SET status = 'completed'
            WHERE link_token = ?
        """, (token,))

        conn.commit()

        return {"success": True, "message": "Intake completed. Thank you!"}
