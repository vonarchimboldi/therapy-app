from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from database import get_db
from models import (
    TodoCreate, TodoUpdate, Todo,
    MessageCreate, MessageUpdate, Message,
    HomeworkAssignmentCreate, HomeworkAssignmentUpdate, HomeworkAssignment, HomeworkAssignmentWithSubmission,
    HomeworkSubmissionCreate, HomeworkSubmissionUpdate, HomeworkSubmission
)
from auth import get_current_therapist
import json
import os
import uuid
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ============================================
# FILE UPLOAD ROUTES
# ============================================

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    therapist_id: int = Depends(get_current_therapist)
):
    """Upload a file (image, document, etc.) and return the file URL"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Determine file type
        file_type = "file"
        if file.content_type and file.content_type.startswith("image/"):
            file_type = "image"
        elif file.content_type and file.content_type.startswith("video/"):
            file_type = "video"
        elif file.content_type and "pdf" in file.content_type:
            file_type = "pdf"

        return {
            "type": file_type,
            "url": f"/api/uploads/{unique_filename}",
            "filename": file.filename,
            "size": len(contents)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@router.post("/fetch-link-preview")
async def fetch_link_preview(url: str, therapist_id: int = Depends(get_current_therapist)):
    """Fetch OpenGraph metadata for a URL to create rich link previews"""
    try:
        # Validate URL
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise HTTPException(status_code=400, detail="Invalid URL")

        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        # Fetch the page with timeout
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        response.raise_for_status()

        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract OpenGraph metadata
        og_title = None
        og_description = None
        og_image = None
        og_site_name = None

        # Try OpenGraph tags first
        og_tags = soup.find_all('meta', property=re.compile('^og:'))
        for tag in og_tags:
            property_name = tag.get('property', '')
            content = tag.get('content', '')

            if property_name == 'og:title':
                og_title = content
            elif property_name == 'og:description':
                og_description = content
            elif property_name == 'og:image':
                og_image = content
            elif property_name == 'og:site_name':
                og_site_name = content

        # Fallback to Twitter Card tags
        if not og_title:
            twitter_title = soup.find('meta', attrs={'name': 'twitter:title'})
            if twitter_title:
                og_title = twitter_title.get('content')

        if not og_description:
            twitter_desc = soup.find('meta', attrs={'name': 'twitter:description'})
            if twitter_desc:
                og_description = twitter_desc.get('content')

        if not og_image:
            twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
            if twitter_image:
                og_image = twitter_image.get('content')

        # Fallback to standard HTML tags
        if not og_title:
            title_tag = soup.find('title')
            if title_tag:
                og_title = title_tag.string

        if not og_description:
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                og_description = meta_desc.get('content')

        # Make image URL absolute if it's relative
        if og_image and not og_image.startswith('http'):
            base_url = f"{parsed.scheme}://{parsed.netloc}"
            if og_image.startswith('//'):
                og_image = f"{parsed.scheme}:{og_image}"
            elif og_image.startswith('/'):
                og_image = f"{base_url}{og_image}"
            else:
                og_image = f"{base_url}/{og_image}"

        # Return structured data
        return {
            "type": "link",
            "url": url,
            "title": og_title or url,
            "description": og_description,
            "thumbnail": og_image,
            "site_name": og_site_name or parsed.netloc
        }

    except requests.RequestException as e:
        # If fetching fails, return basic link info
        return {
            "type": "link",
            "url": url,
            "title": url,
            "description": None,
            "thumbnail": None,
            "site_name": urlparse(url).netloc
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch link preview: {str(e)}")


# ============================================
# TODO ROUTES
# ============================================

@router.get("/todos/client/{client_id}")
def get_client_todos(
    client_id: int,
    status: str = None,
    therapist_id: int = Depends(get_current_therapist)
):
    """Get all todos for a specific client"""
    with get_db() as conn:
        cursor = conn.cursor()

        query = """
            SELECT * FROM todos
            WHERE client_id = ? AND therapist_id = ?
        """
        params = [client_id, therapist_id]

        if status:
            query += " AND status = ?"
            params.append(status)

        query += " ORDER BY created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        todos = []
        for row in rows:
            todos.append({
                'id': row['id'],
                'client_id': row['client_id'],
                'therapist_id': row['therapist_id'],
                'text': row['text'],
                'status': row['status'],
                'source_session_id': row['source_session_id'],
                'completed_session_id': row['completed_session_id'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at']
            })

        return todos


@router.get("/todos/session/{session_id}")
def get_session_todos(
    session_id: int,
    therapist_id: int = Depends(get_current_therapist)
):
    """Get todos for a specific session (created in that session or pending from previous)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get client_id from session
        cursor.execute("SELECT client_id FROM sessions WHERE id = ? AND therapist_id = ?",
                      (session_id, therapist_id))
        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        client_id = session['client_id']

        # Get todos created in this session OR open todos from previous sessions
        cursor.execute("""
            SELECT * FROM todos
            WHERE client_id = ? AND therapist_id = ?
            AND (source_session_id = ? OR (status = 'open' AND source_session_id < ?))
            ORDER BY status ASC, created_at ASC
        """, (client_id, therapist_id, session_id, session_id))

        rows = cursor.fetchall()

        todos = []
        for row in rows:
            todos.append({
                'id': row['id'],
                'client_id': row['client_id'],
                'therapist_id': row['therapist_id'],
                'text': row['text'],
                'status': row['status'],
                'source_session_id': row['source_session_id'],
                'completed_session_id': row['completed_session_id'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at']
            })

        return todos


@router.post("/todos")
def create_todo(
    todo: TodoCreate,
    therapist_id: int = Depends(get_current_therapist)
):
    """Create a new todo"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify client belongs to therapist
        cursor.execute("SELECT id FROM clients WHERE id = ? AND therapist_id = ?",
                      (todo.client_id, therapist_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        cursor.execute("""
            INSERT INTO todos (client_id, therapist_id, text, source_session_id)
            VALUES (?, ?, ?, ?)
        """, (todo.client_id, therapist_id, todo.text, todo.source_session_id))

        todo_id = cursor.lastrowid

        # Fetch and return the created todo
        cursor.execute("SELECT * FROM todos WHERE id = ?", (todo_id,))
        row = cursor.fetchone()

        return {
            'id': row['id'],
            'client_id': row['client_id'],
            'therapist_id': row['therapist_id'],
            'text': row['text'],
            'status': row['status'],
            'source_session_id': row['source_session_id'],
            'completed_session_id': row['completed_session_id'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at']
        }


@router.patch("/todos/{todo_id}")
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    therapist_id: int = Depends(get_current_therapist)
):
    """Update a todo (mark as completed, change text, etc.)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify todo belongs to therapist
        cursor.execute("SELECT * FROM todos WHERE id = ? AND therapist_id = ?",
                      (todo_id, therapist_id))
        todo = cursor.fetchone()
        if not todo:
            raise HTTPException(status_code=404, detail="Todo not found")

        # Build update query
        update_fields = []
        params = []

        if todo_update.text is not None:
            update_fields.append("text = ?")
            params.append(todo_update.text)

        if todo_update.status is not None:
            update_fields.append("status = ?")
            params.append(todo_update.status)

        if todo_update.completed_session_id is not None:
            update_fields.append("completed_session_id = ?")
            params.append(todo_update.completed_session_id)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(todo_id)

        query = f"UPDATE todos SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)

        # Return updated todo
        cursor.execute("SELECT * FROM todos WHERE id = ?", (todo_id,))
        row = cursor.fetchone()

        return {
            'id': row['id'],
            'client_id': row['client_id'],
            'therapist_id': row['therapist_id'],
            'text': row['text'],
            'status': row['status'],
            'source_session_id': row['source_session_id'],
            'completed_session_id': row['completed_session_id'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at']
        }


@router.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    therapist_id: int = Depends(get_current_therapist)
):
    """Delete a todo"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify todo belongs to therapist
        cursor.execute("SELECT id FROM todos WHERE id = ? AND therapist_id = ?",
                      (todo_id, therapist_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Todo not found")

        cursor.execute("DELETE FROM todos WHERE id = ?", (todo_id,))

        return {"message": "Todo deleted successfully"}


# ============================================
# MESSAGE ROUTES
# ============================================

@router.get("/messages/thread/{other_party_id}")
def get_message_thread(
    other_party_id: int,
    other_party_type: str,  # 'client' or 'therapist'
    therapist_id: int = Depends(get_current_therapist)
):
    """Get message thread between therapist and client"""
    with get_db() as conn:
        cursor = conn.cursor()

        # For therapist, get messages with specific client
        cursor.execute("""
            SELECT * FROM messages
            WHERE (sender_id = ? AND sender_type = 'therapist' AND recipient_id = ? AND recipient_type = ?)
            OR (sender_id = ? AND sender_type = ? AND recipient_id = ? AND recipient_type = 'therapist')
            ORDER BY created_at ASC
        """, (therapist_id, other_party_id, other_party_type,
              other_party_id, other_party_type, therapist_id))

        rows = cursor.fetchall()

        messages = []
        for row in rows:
            attachments = json.loads(row['attachments']) if row['attachments'] else []
            messages.append({
                'id': row['id'],
                'sender_id': row['sender_id'],
                'sender_type': row['sender_type'],
                'recipient_id': row['recipient_id'],
                'recipient_type': row['recipient_type'],
                'content': row['content'],
                'attachments': attachments,
                'related_session_id': row['related_session_id'],
                'read': bool(row['read']),
                'read_at': row['read_at'],
                'created_at': row['created_at']
            })

        return messages


@router.post("/messages")
def send_message(
    message: MessageCreate,
    therapist_id: int = Depends(get_current_therapist)
):
    """Send a message to a client"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Serialize attachments
        attachments_json = json.dumps(message.attachments) if message.attachments else None

        cursor.execute("""
            INSERT INTO messages
            (sender_id, sender_type, recipient_id, recipient_type, content, attachments, related_session_id)
            VALUES (?, 'therapist', ?, ?, ?, ?, ?)
        """, (therapist_id, message.recipient_id, message.recipient_type,
              message.content, attachments_json, message.related_session_id))

        message_id = cursor.lastrowid

        # Return created message
        cursor.execute("SELECT * FROM messages WHERE id = ?", (message_id,))
        row = cursor.fetchone()

        attachments = json.loads(row['attachments']) if row['attachments'] else []
        return {
            'id': row['id'],
            'sender_id': row['sender_id'],
            'sender_type': row['sender_type'],
            'recipient_id': row['recipient_id'],
            'recipient_type': row['recipient_type'],
            'content': row['content'],
            'attachments': attachments,
            'related_session_id': row['related_session_id'],
            'read': bool(row['read']),
            'read_at': row['read_at'],
            'created_at': row['created_at']
        }


@router.patch("/messages/{message_id}/read")
def mark_message_read(
    message_id: int,
    therapist_id: int = Depends(get_current_therapist)
):
    """Mark a message as read"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify message exists and therapist is the recipient
        cursor.execute("""
            SELECT * FROM messages
            WHERE id = ? AND recipient_id = ? AND recipient_type = 'therapist'
        """, (message_id, therapist_id))

        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Message not found")

        cursor.execute("""
            UPDATE messages
            SET read = 1, read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (message_id,))

        return {"message": "Message marked as read"}


@router.get("/messages/unread-count")
def get_unread_message_count(
    therapist_id: int = Depends(get_current_therapist)
):
    """Get count of unread messages for therapist"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT COUNT(*) as count FROM messages
            WHERE recipient_id = ? AND recipient_type = 'therapist' AND read = 0
        """, (therapist_id,))

        row = cursor.fetchone()
        return {"unread_count": row['count']}


# ============================================
# HOMEWORK ROUTES
# ============================================

@router.get("/homework/client/{client_id}")
def get_client_homework(
    client_id: int,
    therapist_id: int = Depends(get_current_therapist)
):
    """Get all homework assignments for a client with their submissions"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify client belongs to therapist
        cursor.execute("SELECT id FROM clients WHERE id = ? AND therapist_id = ?",
                      (client_id, therapist_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        # Get all assignments for this client
        cursor.execute("""
            SELECT * FROM homework_assignments
            WHERE client_id = ? AND therapist_id = ?
            ORDER BY created_at DESC
        """, (client_id, therapist_id))

        assignments_rows = cursor.fetchall()

        assignments = []
        for assign_row in assignments_rows:
            attachments = json.loads(assign_row['attachments']) if assign_row['attachments'] else []

            assignment = {
                'id': assign_row['id'],
                'therapist_id': assign_row['therapist_id'],
                'client_id': assign_row['client_id'],
                'session_id': assign_row['session_id'],
                'title': assign_row['title'],
                'instructions': assign_row['instructions'],
                'attachments': attachments,
                'due_date': assign_row['due_date'],
                'status': assign_row['status'],
                'created_at': assign_row['created_at'],
                'submission': None
            }

            # Get submission if exists
            cursor.execute("""
                SELECT * FROM homework_submissions
                WHERE assignment_id = ?
                ORDER BY submitted_at DESC
                LIMIT 1
            """, (assign_row['id'],))

            sub_row = cursor.fetchone()
            if sub_row:
                sub_attachments = json.loads(sub_row['attachments']) if sub_row['attachments'] else []
                assignment['submission'] = {
                    'id': sub_row['id'],
                    'assignment_id': sub_row['assignment_id'],
                    'client_id': sub_row['client_id'],
                    'content': sub_row['content'],
                    'attachments': sub_attachments,
                    'submitted_at': sub_row['submitted_at'],
                    'therapist_feedback': sub_row['therapist_feedback'],
                    'feedback_at': sub_row['feedback_at']
                }

            assignments.append(assignment)

        return assignments


@router.post("/homework")
def create_homework_assignment(
    assignment: HomeworkAssignmentCreate,
    therapist_id: int = Depends(get_current_therapist)
):
    """Create a new homework assignment"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify client belongs to therapist
        cursor.execute("SELECT id FROM clients WHERE id = ? AND therapist_id = ?",
                      (assignment.client_id, therapist_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client not found")

        # Serialize attachments
        attachments_json = json.dumps(assignment.attachments) if assignment.attachments else None

        cursor.execute("""
            INSERT INTO homework_assignments
            (therapist_id, client_id, session_id, title, instructions, attachments, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (therapist_id, assignment.client_id, assignment.session_id,
              assignment.title, assignment.instructions, attachments_json, assignment.due_date))

        assignment_id = cursor.lastrowid

        # Return created assignment
        cursor.execute("SELECT * FROM homework_assignments WHERE id = ?", (assignment_id,))
        row = cursor.fetchone()

        attachments = json.loads(row['attachments']) if row['attachments'] else []
        return {
            'id': row['id'],
            'therapist_id': row['therapist_id'],
            'client_id': row['client_id'],
            'session_id': row['session_id'],
            'title': row['title'],
            'instructions': row['instructions'],
            'attachments': attachments,
            'due_date': row['due_date'],
            'status': row['status'],
            'created_at': row['created_at']
        }


@router.patch("/homework/{assignment_id}")
def update_homework_assignment(
    assignment_id: int,
    assignment_update: HomeworkAssignmentUpdate,
    therapist_id: int = Depends(get_current_therapist)
):
    """Update a homework assignment"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify assignment belongs to therapist
        cursor.execute("SELECT * FROM homework_assignments WHERE id = ? AND therapist_id = ?",
                      (assignment_id, therapist_id))
        assignment = cursor.fetchone()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Build update query
        update_fields = []
        params = []

        if assignment_update.title is not None:
            update_fields.append("title = ?")
            params.append(assignment_update.title)

        if assignment_update.instructions is not None:
            update_fields.append("instructions = ?")
            params.append(assignment_update.instructions)

        if assignment_update.attachments is not None:
            update_fields.append("attachments = ?")
            params.append(json.dumps(assignment_update.attachments))

        if assignment_update.due_date is not None:
            update_fields.append("due_date = ?")
            params.append(assignment_update.due_date)

        if assignment_update.status is not None:
            update_fields.append("status = ?")
            params.append(assignment_update.status)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(assignment_id)

        query = f"UPDATE homework_assignments SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)

        # Return updated assignment
        cursor.execute("SELECT * FROM homework_assignments WHERE id = ?", (assignment_id,))
        row = cursor.fetchone()

        attachments = json.loads(row['attachments']) if row['attachments'] else []
        return {
            'id': row['id'],
            'therapist_id': row['therapist_id'],
            'client_id': row['client_id'],
            'session_id': row['session_id'],
            'title': row['title'],
            'instructions': row['instructions'],
            'attachments': attachments,
            'due_date': row['due_date'],
            'status': row['status'],
            'created_at': row['created_at']
        }


@router.post("/homework/{assignment_id}/submit")
def submit_homework(
    assignment_id: int,
    submission: HomeworkSubmissionCreate,
    client_id: int  # TODO: This should come from client authentication
):
    """Submit homework (called by client)"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify assignment exists and belongs to client
        cursor.execute("SELECT * FROM homework_assignments WHERE id = ? AND client_id = ?",
                      (assignment_id, client_id))
        assignment = cursor.fetchone()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Serialize attachments
        attachments_json = json.dumps(submission.attachments) if submission.attachments else None

        cursor.execute("""
            INSERT INTO homework_submissions
            (assignment_id, client_id, content, attachments)
            VALUES (?, ?, ?, ?)
        """, (assignment_id, client_id, submission.content, attachments_json))

        submission_id = cursor.lastrowid

        # Update assignment status
        cursor.execute("""
            UPDATE homework_assignments
            SET status = 'submitted'
            WHERE id = ?
        """, (assignment_id,))

        # Return created submission
        cursor.execute("SELECT * FROM homework_submissions WHERE id = ?", (submission_id,))
        row = cursor.fetchone()

        attachments = json.loads(row['attachments']) if row['attachments'] else []
        return {
            'id': row['id'],
            'assignment_id': row['assignment_id'],
            'client_id': row['client_id'],
            'content': row['content'],
            'attachments': attachments,
            'submitted_at': row['submitted_at'],
            'therapist_feedback': row['therapist_feedback'],
            'feedback_at': row['feedback_at']
        }


@router.patch("/homework/submission/{submission_id}/feedback")
def add_homework_feedback(
    submission_id: int,
    feedback_update: HomeworkSubmissionUpdate,
    therapist_id: int = Depends(get_current_therapist)
):
    """Add feedback to a homework submission"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify submission exists and belongs to therapist's client
        cursor.execute("""
            SELECT hs.*, ha.therapist_id
            FROM homework_submissions hs
            JOIN homework_assignments ha ON hs.assignment_id = ha.id
            WHERE hs.id = ? AND ha.therapist_id = ?
        """, (submission_id, therapist_id))

        submission = cursor.fetchone()
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        cursor.execute("""
            UPDATE homework_submissions
            SET therapist_feedback = ?, feedback_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (feedback_update.therapist_feedback, submission_id))

        # Update assignment status to reviewed
        cursor.execute("""
            UPDATE homework_assignments
            SET status = 'reviewed'
            WHERE id = ?
        """, (submission['assignment_id'],))

        return {"message": "Feedback added successfully"}
