# Therapy Client Management System

A simple web application for therapists to manage clients built with FastAPI (backend) and React (frontend).

## Features

- View list of all clients
- Add new clients with personal information
- Store emergency contact information
- Track client status (active/inactive)

## Project Structure

```
therapy-app/
├── backend/          # FastAPI backend
│   ├── main.py      # API endpoints
│   ├── database.py  # SQLite database setup
│   ├── models.py    # Pydantic models
│   └── therapy.db   # SQLite database (created on first run)
├── frontend/         # React frontend
│   └── src/
│       ├── App.jsx  # Main client management component
│       └── App.css  # Styles
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd therapy-app/backend
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
python main.py
```

The backend will start at `http://localhost:8000`

API documentation available at: `http://localhost:8000/docs`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd therapy-app/frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start at `http://localhost:5173`

## API Endpoints

- `GET /api/clients` - List all clients
- `GET /api/clients/{id}` - Get a specific client
- `POST /api/clients` - Create a new client
- `PUT /api/clients/{id}` - Update a client
- `DELETE /api/clients/{id}` - Soft delete a client (set status to inactive)

## Database Schema

### clients table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| first_name | TEXT | Client's first name |
| last_name | TEXT | Client's last name |
| date_of_birth | TEXT | Date of birth (YYYY-MM-DD) |
| phone | TEXT | Phone number |
| email | TEXT | Email address |
| emergency_contact_name | TEXT | Emergency contact name |
| emergency_contact_phone | TEXT | Emergency contact phone |
| status | TEXT | Client status (active/inactive) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Next Steps

Potential features to add:
- Session management
- Treatment plans
- Progress tracking
- Authentication
- Client search and filtering
- Edit/update client information from UI
