# TherapyTrack Development Log

## Session Summary
This document captures the complete development of the TherapyTrack application - a web app for therapists to manage clients, schedule sessions, and track clinical notes.

---

## Initial Requirements

**User Request:** Build a web app for therapists to manage clients and session notes with structured data collection.

**Key Features Requested:**
- Client management
- Session notes with structured data (life domains, emotional themes)
- Pattern recognition across sessions
- Rich text notes instead of numeric ratings
- Scheduling system with appointment times
- Global "Today" view for daily schedule

---

## Phase 1: Basic Client Management (Initial Build)

### Backend Setup
- **Tech Stack:** FastAPI + SQLite + Pydantic
- **Files Created:**
  - `backend/requirements.txt` - Dependencies
  - `backend/database.py` - SQLite setup with context managers
  - `backend/models.py` - Pydantic models for validation
  - `backend/main.py` - FastAPI CRUD endpoints with CORS

### Database Schema - Clients Table
```sql
CREATE TABLE clients (
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
```

### Frontend Setup
- **Tech Stack:** React (Vite) + Modern CSS
- Client list with sidebar navigation
- Add client form
- Basic styling

---

## Phase 2: Session Notes with Structured Data

### Problem Statement
User wanted to track patterns across sessions. Initial approach used mood rating (1-5), but this evolved into structured data collection with specific life domains and emotional themes.

### Database Schema - Sessions Table (Initial)
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    session_date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    -- JSON fields for structured data
    life_domains TEXT,
    emotional_themes TEXT,
    interventions TEXT,
    -- Clinical notes
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
```

### Structured Data Categories

**Life Domains (8 categories):**
- Relationships
- Career
- Self Esteem
- Family
- Physical Health
- Financial
- Substance Use
- Trauma

**Emotional Themes (9 categories):**
- Anxiety
- Depression
- Anger
- Shame
- Guilt
- Grief
- Fear
- Loneliness
- Joy

**Interventions (10 types):**
- CBT
- DBT
- Mindfulness
- Exposure Therapy
- EMDR
- Psychoeducation
- Behavioral Activation
- Cognitive Restructuring
- Grounding Techniques
- Relaxation Exercises

---

## Phase 3: Rich Text Notes vs Numeric Ratings

### Critical User Feedback
> "We can't score them on a sliding scale because this isn't discretizable. We need the ability to capture richer information."

### Design Change
**Before:** Sliders with 0-10 ratings for each domain/theme
**After:** Checkboxes + text areas for detailed qualitative notes

**Implementation:**
- Each life domain/emotion has a checkbox
- When checked, a textarea appears for detailed notes
- Data structure: `{"relationships": "detailed notes...", "career": "notes..."}`
- Analytics changed from averages to occurrence counts

### UI Pattern
```jsx
<div className="domain-field">
  <label className="domain-checkbox">
    <input type="checkbox" />
    <span className="domain-label">Relationships</span>
  </label>
  {checked && (
    <textarea placeholder="What was discussed about relationships?" />
  )}
</div>
```

---

## Phase 4: Modern UI Redesign

### Design System
- **Colors:** Purple gradient theme (#667eea to #764ba2)
- **Font:** Inter family
- **Effects:** Glassmorphism, smooth transitions, hover effects
- **Components:** Modal overlays, tab navigation, status badges

### Key UI Features
- Dashboard with analytics (bar charts for themes/domains/interventions)
- Modal forms instead of inline forms
- Color-coded status badges
- Session cards with clickable details
- View/Edit modes for sessions

---

## Phase 5: Scheduling System Implementation

### User Requirements (Clarified via Questions)
1. ✅ Appointment times with specific slots (e.g., 2:00 PM - 2:50 PM)
2. ✅ Session status tracking (scheduled, completed, cancelled, no-show)
3. ✅ Mark cancelled sessions (keep record for history)
4. ✅ Display: client name, time slot, status, notes preview

### Database Migration
**Added two new columns to sessions table:**
```sql
ALTER TABLE sessions ADD COLUMN session_time TEXT;  -- HH:MM format
ALTER TABLE sessions ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';
```

**Migration strategy:** Existing sessions get `status='completed'` and `session_time=NULL`

### Backend Changes

**Updated Models (models.py):**
```python
class SessionBase(BaseModel):
    client_id: int
    session_date: str  # YYYY-MM-DD
    session_time: Optional[str] = None  # HH:MM
    duration_minutes: int
    status: str = "completed"  # scheduled, completed, cancelled, no-show
    # ... existing fields

class SessionWithClient(Session):
    """For Today view with client info"""
    first_name: str
    last_name: str
```

**New API Endpoints (main.py):**
1. `GET /api/sessions/today` - All sessions for today with client info
2. `POST /api/sessions/schedule` - Quick scheduling endpoint
3. `PATCH /api/sessions/{id}/cancel` - Mark session as cancelled

**Routing Fix:**
- `/api/sessions/today` must come BEFORE `/api/sessions/{session_id}` to avoid routing conflicts

### Frontend Architecture Changes

**New State Variables:**
```jsx
const [appView, setAppView] = useState('today')  // today, scheduled, or clients
const [todaySessions, setTodaySessions] = useState([])
const [allScheduledSessions, setAllScheduledSessions] = useState([])
const [showScheduleModal, setShowScheduleModal] = useState(false)
const [clientView, setClientView] = useState('summary')  // summary, sessions, or analytics
```

**Navigation Structure:**
```
Top-level tabs: [Today] [Scheduled] [Clients]

Today view:
  - Shows all sessions for today across all clients
  - Schedule Appointment button
  - Session cards with time, client, status, notes preview

Scheduled view:
  - Shows all upcoming scheduled appointments
  - Chronologically ordered
  - View/Cancel buttons

Clients view:
  - Client sidebar
  - Selected client tabs: [Summary] [Sessions] [Analytics]
```

### Time Formatting Utilities
```javascript
const formatTime = (time24) => {
  if (!time24) return 'Time TBD'
  const [hours, minutes] = time24.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

const calculateEndTime = (startTime, durationMinutes) => {
  // Calculates end time from start time + duration
  // Returns HH:MM in 24-hour format
}
```

---

## Phase 6: Enhanced Features

### Today View
**Components:**
- Today session cards with status-based styling
- Time blocks showing "2:00 PM - 2:50 PM"
- Status badges (color-coded)
- Quick notes preview (truncated to 100 chars)
- Action buttons (View, Cancel for scheduled)

**Card Styling by Status:**
- Scheduled: Blue left border (#3b82f6)
- Completed: Green left border (#10b981)
- Cancelled: Gray left border, reduced opacity (#6b7280)
- No-show: Red left border (#ef4444)

### Scheduled Appointments View
**Features:**
- All upcoming scheduled appointments across all dates
- Sorted chronologically by date and time
- Date section with gradient background
- Client info and duration
- View Details and Cancel buttons

### Client Summary Tab
**Three Cards:**

1. **Client Information:**
   - Full name, DOB, phone, email
   - Emergency contact details
   - Status badge

2. **Session Overview:**
   - Total sessions count
   - Scheduled count
   - Completed count

3. **Recent Sessions:**
   - Last 5 sessions
   - Date, time, and status
   - Clickable to view details

### Scheduling Modal
**Form Fields:**
- Client dropdown (all active clients)
- Date picker (defaults to today)
- Time picker (type="time", defaults to 14:00)
- Duration input (defaults to 50 min)

**Flow:**
- Creates session with `status='scheduled'`
- Empty clinical notes (to be filled later)
- Refreshes Today and Scheduled views

---

## Analytics Dashboard

### Calculations Changed
**Before:** Average ratings (numeric)
**After:** Occurrence counts (qualitative)

```javascript
const calculateAnalytics = () => {
  // Count how many times each theme was discussed
  emotionCounts[emotion] = sessions.filter(s =>
    s.emotional_themes[emotion] && s.emotional_themes[emotion].trim()
  ).length

  // Same for domains
  domainCounts[domain] = sessions.filter(s =>
    s.life_domains[domain] && s.life_domains[domain].trim()
  ).length
}
```

**Display:**
- Bar charts show "X sessions" instead of average scores
- Top 5 most discussed themes/domains
- Intervention usage frequency

---

## CSS Architecture

### Key Classes

**Navigation:**
- `.app-nav` - Top-level navigation container
- `.nav-tab` - Individual tab buttons
- `.nav-tab.active` - Active tab with gradient background

**Today/Scheduled Views:**
- `.today-container` - Main container
- `.today-session-card` - Individual session cards
- `.status-scheduled`, `.status-completed`, etc. - Status-based styling
- `.session-time-block` - Time display section
- `.session-actions` - Button container

**Client Summary:**
- `.client-summary` - Summary view container
- `.summary-card` - Individual cards
- `.detail-row` - Info rows with label/value pairs
- `.overview-stats` - Stats grid
- `.recent-sessions-list` - Recent sessions list

**Scheduled Appointments:**
- `.scheduled-list` - Appointments container
- `.scheduled-appointment-card` - Individual appointment cards
- `.appointment-date-section` - Date/time display with gradient
- `.appointment-info` - Client info section

**Status Badges:**
```css
.badge-scheduled { background: #3b82f6; }
.badge-completed { background: #10b981; }
.badge-cancelled { background: #6b7280; }
.badge-no-show { background: #ef4444; }
```

---

## Technical Decisions & Rationale

### 1. Time Storage: Separate Fields
**Decision:** Store `session_date` (YYYY-MM-DD) and `session_time` (HH:MM) separately
**Rationale:**
- Backward compatible with existing date-only field
- Simpler queries (no timezone complexity)
- Easy to sort within a day
- NULL time for legacy sessions works seamlessly

### 2. Status Field: Enum Values
**Values:** scheduled, completed, cancelled, no-show
**Rationale:**
- Tracks appointment lifecycle
- Enables pattern analysis (no-show rates)
- Preserves history (cancelled sessions kept)
- Extensible (can add more statuses)

### 3. Cancellation: Soft Delete
**Decision:** Mark as cancelled, keep record
**Rationale:**
- Audit trail for analytics
- Pattern recognition (frequent cancellations)
- History preservation for billing/insurance

### 4. Default Landing: Today View
**Rationale:**
- Most relevant for daily workflow
- Immediate visibility of schedule
- Quick access to today's appointments

### 5. Scheduled Sessions: Empty Clinical Notes
**Decision:** Allow scheduled sessions without notes
**Rationale:**
- Notes are added AFTER session completion
- Scheduling happens in advance
- Separation of scheduling vs documentation

---

## Data Flow Examples

### Creating a Scheduled Appointment
1. User clicks "Schedule Appointment"
2. Modal opens with form
3. User selects client, date, time, duration
4. Submit → `POST /api/sessions/schedule`
5. Backend creates session with `status='scheduled'`, empty notes
6. Frontend refreshes Today and Scheduled views
7. New appointment appears in both views

### Completing a Scheduled Session
1. User views scheduled session from Today or Scheduled view
2. Clicks "View" → Opens session detail modal
3. Clicks "Edit" → Switches to edit mode
4. Adds clinical notes (domains, themes, interventions, etc.)
5. Changes status from "scheduled" to "completed"
6. Submit → `PUT /api/sessions/{id}`
7. Session updated, appears as completed

### Cancelling a Session
1. User clicks "Cancel" on scheduled session
2. Confirmation dialog appears
3. Confirm → `PATCH /api/sessions/{id}/cancel`
4. Backend sets `status='cancelled'`, updates timestamp
5. Session remains in database (history preserved)
6. UI shows greyed out with "cancelled" badge

---

## File Structure

### Backend
```
backend/
├── venv/                    # Virtual environment
├── therapy.db              # SQLite database
├── requirements.txt        # Python dependencies
├── database.py            # DB initialization & connection
├── models.py              # Pydantic models
└── main.py                # FastAPI app & endpoints
```

### Frontend
```
frontend/
├── node_modules/
├── src/
│   ├── App.jsx           # Main React component (1200+ lines)
│   ├── App.css           # Styles (1400+ lines)
│   └── main.jsx          # Entry point
├── package.json
└── vite.config.js
```

---

## API Endpoints Reference

### Clients
- `GET /api/clients` - List all clients (optional status filter)
- `GET /api/clients/{id}` - Get specific client
- `POST /api/clients` - Create new client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Soft delete (set status='inactive')

### Sessions
- `GET /api/sessions` - List all sessions (optional client_id filter)
- `GET /api/sessions/today` - Today's sessions with client info
- `GET /api/sessions/{id}` - Get specific session
- `POST /api/sessions` - Create new session (full or scheduled)
- `POST /api/sessions/schedule` - Quick schedule (minimal data)
- `PUT /api/sessions/{id}` - Update session
- `PATCH /api/sessions/{id}/cancel` - Cancel session
- `DELETE /api/sessions/{id}` - Delete session

---

## Testing Checklist (Completed)

### Backend
- ✅ Create session with time and status
- ✅ GET /api/sessions/today returns correct sessions
- ✅ Schedule endpoint creates scheduled session
- ✅ Cancel endpoint marks session as cancelled
- ✅ Legacy sessions still load correctly (NULL time)
- ✅ Routing works correctly (today vs {id})

### Frontend
- ✅ Today view displays all sessions for today
- ✅ Scheduled view shows all upcoming appointments
- ✅ Schedule modal creates new appointment
- ✅ Cancel button marks session as cancelled
- ✅ Time displays in 12-hour format
- ✅ Status badges show correct colors
- ✅ Navigation between Today/Scheduled/Clients works
- ✅ Client Summary tab shows all information
- ✅ Client tabs (Summary/Sessions/Analytics) work
- ✅ Legacy sessions (no time) display gracefully ("Time TBD")
- ✅ Hot module reloading works without errors

---

## Known Issues & Future Enhancements

### Current Limitations
1. No conflict detection (can double-book same time slot)
2. No timezone support (assumes single timezone)
3. No recurring appointments
4. No reminders/notifications
5. No waitlist management
6. No multi-therapist support

### Potential Future Features
1. **Calendar View:** Monthly calendar showing all appointments
2. **Recurring Sessions:** Auto-schedule weekly sessions
3. **Reminders:** Email/SMS before appointments
4. **Conflict Detection:** Warn about overlapping sessions
5. **Waitlist:** Track cancelled slots and notify waitlist
6. **Time Zones:** Support for multi-location practices
7. **Batch Scheduling:** Schedule multiple sessions at once
8. **Session Templates:** Pre-fill common configurations
9. **Availability Blocks:** Define therapist availability
10. **Client Portal:** Let clients view/request times
11. **Billing Integration:** Track sessions for invoicing
12. **Insurance:** Track authorization codes
13. **Treatment Plans:** Link goals to sessions
14. **Progress Tracking:** Visualize trends over time
15. **Export:** Generate reports for insurance/supervision

---

## Performance Considerations

### Database Indexing (Recommended)
```sql
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_client ON sessions(client_id);
```

### Query Optimization
- Today view query filters by exact date (fast with index)
- Scheduled view filters by status (fast with index)
- Client sessions filtered by client_id (fast with index)
- JSON fields stored as TEXT, parsed on retrieval

### Caching Strategy
- Client list cached on frontend
- Sessions fetched on-demand per client
- Today/Scheduled views refreshed after mutations

---

## Development Timeline

1. **Phase 1:** Basic client management (1 session)
2. **Phase 2:** Session notes with structured data (1 session)
3. **Phase 3:** Rich text notes redesign (1 session)
4. **Phase 4:** UI redesign with modern styling (1 session)
5. **Phase 5:** Scheduling system (backend + frontend) (2 sessions)
6. **Phase 6:** Enhanced features (Scheduled view, Client Summary) (1 session)

**Total:** ~7 development sessions

---

## Key Learnings

### 1. User Feedback is Critical
The shift from numeric sliders to rich text notes came from direct user feedback that "therapy concepts aren't discretizable." This fundamental change improved the UX significantly.

### 2. Structured Data + Flexibility
Using JSON fields in SQLite provides structure (known categories) while maintaining flexibility (variable-length text notes).

### 3. Status-Driven Workflows
The status field enables a clean workflow: schedule → complete → analyze, with cancellation tracking built in.

### 4. Progressive Enhancement
Started simple (clients + notes) and added features incrementally:
- Basic → Structured data → Rich notes → Scheduling → Enhanced views

### 5. React State Management
With 1200+ lines in App.jsx, the component is getting complex. Future refactor could split into:
- TodayView component
- ScheduledView component
- ClientView component with sub-components
- Shared SchedulingModal component

---

## Code Snippets - Key Implementations

### Backend: Today Sessions Endpoint
```python
@app.get("/api/sessions/today", response_model=List[SessionWithClient])
def get_today_sessions():
    today = datetime.now().date().isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, c.first_name, c.last_name
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
```

### Frontend: Today View Component
```jsx
{appView === 'today' ? (
  <div className="today-container">
    <div className="today-header">
      <h2>Today's Schedule - {new Date().toLocaleDateString()}</h2>
      <button onClick={() => setShowScheduleModal(true)}>
        + Schedule Appointment
      </button>
    </div>

    <div className="today-sessions-list">
      {todaySessions.map(session => (
        <TodaySessionCard
          session={session}
          onView={openSession}
          onCancel={handleCancelSession}
        />
      ))}
    </div>
  </div>
) : /* other views */}
```

### Client Summary Implementation
```jsx
{clientView === 'summary' && (
  <div className="client-summary">
    {/* Client Information Card */}
    <div className="summary-card">
      <h3>Client Information</h3>
      <div className="summary-details">
        {/* Detail rows with label/value pairs */}
      </div>
    </div>

    {/* Session Overview Card */}
    <div className="summary-card">
      <h3>Session Overview</h3>
      <div className="overview-stats">
        {/* Total, Scheduled, Completed counts */}
      </div>
    </div>

    {/* Recent Sessions Card */}
    <div className="summary-card">
      <h3>Recent Sessions</h3>
      <div className="recent-sessions-list">
        {/* Last 5 sessions */}
      </div>
    </div>
  </div>
)}
```

---

## Deployment Considerations

### Development
- Backend: `./venv/bin/python main.py` (port 8000)
- Frontend: `npm run dev` (port 5173)
- CORS configured for localhost:5173

### Production Checklist
1. **Environment Variables:**
   - Database path
   - API URL
   - CORS origins

2. **Security:**
   - Add authentication/authorization
   - HTTPS only
   - HIPAA compliance (if handling PHI)
   - Input validation & sanitization
   - Rate limiting

3. **Database:**
   - Consider PostgreSQL for production
   - Set up backups
   - Add indexes
   - Connection pooling

4. **Frontend:**
   - Build for production (`npm run build`)
   - Serve static files
   - Environment-specific API URLs

5. **Monitoring:**
   - Error tracking (Sentry)
   - Analytics (usage patterns)
   - Performance monitoring

---

## Conclusion

TherapyTrack has evolved from a simple client management tool into a comprehensive scheduling and clinical documentation system. The iterative development process, guided by user feedback, resulted in a practical application that balances structure with flexibility.

**Key Success Factors:**
1. User-centered design (responding to feedback)
2. Incremental feature addition
3. Clean data model (status-driven workflow)
4. Modern, intuitive UI
5. Backward compatibility (existing data preserved)

**Final Application Features:**
- ✅ Client management (CRUD)
- ✅ Structured session notes (life domains, emotional themes, interventions)
- ✅ Rich text notes (qualitative data)
- ✅ Appointment scheduling (date + time)
- ✅ Status tracking (scheduled → completed/cancelled/no-show)
- ✅ Today view (daily schedule)
- ✅ Scheduled view (all upcoming appointments)
- ✅ Client summary (profile + overview + recent sessions)
- ✅ Analytics dashboard (pattern recognition)
- ✅ Modern, responsive UI
- ✅ Real-time updates (HMR)

The application is production-ready for local/single-user deployment and has a clear path for scaling and enhancement.

---

---

## Phase 7: Appointment Linking Workflow

### User Requirement
> "Instead of creating a new session on the clients page we should be able to link an appointment with a client and auto-populate sessions when that happens. But once that happens we should be able to go in and edit the notes once the session ends."

### Problem
The original flow had two separate paths:
1. Schedule appointments (creates scheduled session)
2. Create new sessions (creates completed session with notes)

These weren't connected, causing confusion about workflow.

### Solution: Unified Appointment-Based Flow

**Changes Made:**

1. **Replaced "New Session" button with "Schedule Appointment"** (frontend/src/App.jsx:585-596)
   - Button now opens scheduling modal
   - Pre-selects the current client
   - Creates scheduled appointment

2. **Enhanced Schedule Modal** (frontend/src/App.jsx:1286-1297)
   - Client dropdown disabled when scheduling from client page
   - Shows helpful message: "Scheduling for [Client Name]"
   - Can still be used from Today/Scheduled views

3. **Updated Sessions Tab Display** (frontend/src/App.jsx:1201-1209)
   - Session cards now show time alongside date
   - Status badge displayed prominently
   - Both scheduled and completed sessions visible

4. **Enhanced Session Detail Modal** (frontend/src/App.jsx:774-809)
   - Button changes from "Edit" to "Add Notes" for scheduled appointments
   - Blue notice banner for scheduled appointments
   - Shows status and time information clearly
   - Progress badge only shown for completed sessions

5. **CSS Styling** (frontend/src/App.css:552-570)
   - `.field-hint` - Gray italicized form hints
   - `.scheduled-notice` - Blue gradient notice banner

### New Workflow
```
1. User clicks "Schedule Appointment" on client page
   ↓
2. Appointment created with status='scheduled'
   ↓
3. Appointment appears in client's Sessions tab
   ↓
4. User clicks session card to view details
   ↓
5. User clicks "Add Notes" button
   ↓
6. User fills clinical notes, changes status to 'completed'
   ↓
7. Session saved with full documentation
```

### Benefits
- Single unified workflow (no confusion)
- Scheduled appointments automatically populate session list
- Clear visual distinction between scheduled vs completed
- Therapist prompted to add notes after session

---

## Phase 8: Modern Minimalist UI Redesign

### Motivation
User feedback: "I don't like the UI. We need to make it nicer."

The original purple gradient with glassmorphism felt too "tech startup" for a therapy application.

### Design Philosophy: Modern Minimalism

**Core Principles:**
- Clean neutral palette
- Generous whitespace
- Subtle shadows and borders
- Clear typography hierarchy
- Focus on content over decoration
- Calm, professional aesthetic

### Complete CSS Rewrite (1530 lines)

**Color System (CSS Variables):**
```css
:root {
  /* Neutral Palette */
  --color-bg: #fafbfc;           /* Soft off-white background */
  --color-surface: #ffffff;       /* Clean white surfaces */
  --color-border: #e5e7eb;        /* Light gray borders */
  --color-border-light: #f3f4f6;  /* Very light borders */

  /* Text Hierarchy */
  --color-text-primary: #1a1a1a;    /* Dark gray */
  --color-text-secondary: #6b7280;  /* Medium gray */
  --color-text-tertiary: #9ca3af;   /* Light gray */

  /* Accent Colors */
  --color-accent: #0ea5e9;          /* Subtle cyan/blue */
  --color-accent-hover: #0284c7;    /* Darker on hover */
  --color-accent-light: #e0f2fe;    /* Light blue backgrounds */

  /* Spacing System (8px base) */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */

  /* Consistent Radii */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Subtle Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);
}
```

**Typography Improvements:**
- Negative letter-spacing on headings (-0.02em) for modern look
- Clear size hierarchy (1.75rem → 1.5rem → 1.125rem → 0.875rem)
- Improved line-height (1.6) for better readability
- Consistent font weights (400, 500, 600, 700)

**Component Updates:**

1. **Navigation Tabs**
   - Transparent background with hover states
   - Active tab gets light blue background
   - Smooth 150ms transitions

2. **Cards & Surfaces**
   - White background with subtle border
   - Very light shadow (barely visible)
   - No heavy gradients or effects
   - Clean borders instead of heavy shadows

3. **Buttons**
   - Minimal 1px lift on hover
   - Subtle shadow increase
   - Clean, flat design
   - Consistent padding system

4. **Status Badges**
   - Muted pastel backgrounds
   - Dark text for readability
   - Pill-shaped (border-radius: 100px)
   - Color-coded but subtle

5. **Form Inputs**
   - Clean border with focus ring
   - Light blue glow on focus (accent color)
   - Consistent padding and sizing
   - Subtle hover states

6. **Session Cards**
   - Minimal hover lift (2px)
   - Border color change on hover
   - Status-based left border (4px)
   - Light background for sections

7. **Modals**
   - Backdrop blur (4px)
   - Clean white surface
   - Generous padding
   - Subtle border at bottom of header

**Whitespace Strategy:**
- Doubled spacing between sections
- More padding in cards (2rem → 3rem for major sections)
- Consistent gap system using CSS variables
- Generous margin on main containers

**Status Colors (Muted):**
```css
/* Before: Bright colors */
.badge-scheduled { background: #3b82f6; color: white; }

/* After: Muted pastels */
.badge-scheduled { background: #dbeafe; color: #1e40af; }
```

**Interactive States:**
- All transitions: 150ms (consistent, feels snappy)
- Hover transforms: 1-2px maximum (subtle)
- Focus rings: 3px glow matching accent color
- No aggressive animations or effects

### Responsive Design
- Mobile-first approach maintained
- Breakpoints at 768px and 1024px
- Sidebar hidden on mobile
- Grid layouts collapse gracefully

### Before/After Comparison

**Before:**
- Heavy purple gradient background
- Glassmorphism effects everywhere
- Bold shadows and gradients
- Heavy visual weight
- "Tech startup" aesthetic

**After:**
- Clean off-white background
- Subtle borders and shadows
- Minimal decoration
- Light visual weight
- Professional, calming aesthetic

### Design System Benefits
1. **Maintainability:** CSS variables make theming trivial
2. **Consistency:** Standardized spacing/colors/shadows
3. **Accessibility:** Better contrast ratios, clear focus states
4. **Performance:** Simpler CSS, fewer effects, better paint times
5. **Scalability:** Easy to add dark mode or custom themes

---

## Future Vision: Advanced Features Brainstorming

### Context
Discussion about transforming TherapyTrack into a comprehensive session management platform with AI-powered features.

---

## Future Feature 1: Video Conferencing Integration

### Goal
Enable therapists to conduct video sessions directly within the app.

### Technology Options

**Option A: Embedded Video (Recommended)**
- **Daily.co** - HIPAA compliant, simple embed, $0.002/min
- **Twilio Video** - Robust, HIPAA, more complex, $0.0015/min
- **Whereby Embedded** - Easy, limited HIPAA support

**Pros:** Seamless UX, full control, can capture audio for transcription
**Cons:** More complex, costs scale with usage

**Option B: External Launch**
- **Zoom SDK/Links** - Most familiar to users
- **Google Meet** - Simple, widely used
- **Doxy.me** - Built for telehealth, HIPAA compliant

**Pros:** Simpler implementation, users already know tools
**Cons:** Less integrated, harder to capture audio

### Recommended Approach
Start with **Daily.co embedded** for excellent developer experience, HIPAA compliance, reasonable pricing, and easy audio capture for transcription.

### Implementation Architecture
```javascript
// Session Start Flow
<ScheduledAppointment>
  <button onClick={startSession}>Start Session</button>
  ↓
  Creates iframe with Daily.co room
  ↓
  Session status: scheduled → in_progress
  ↓
  Timer tracks actual duration
  ↓
  Captures audio stream for transcription
</ScheduledAppointment>
```

---

## Future Feature 2: In-Session Chat Integration

### Goal
Real-time chat during sessions for sharing resources, pre-session notes, and between-session messaging.

### Technology Options

**Option A: Build Custom (WebSocket)**
- Use Socket.io or native WebSockets
- Store messages in database alongside session
- Real-time updates

**Option B: Use Chat SDK**
- **Stream Chat** - Feature-rich, good for healthcare
- **Twilio Conversations** - HIPAA compliant
- **SendBird** - Good UX, healthcare features

### Use Cases
1. **During Session:** Share links, resources, homework
2. **Pre-Session:** Client sends notes about what to discuss
3. **Between Sessions:** Homework reminders, check-ins
4. **Post-Session:** Follow-up resources

### Data Model
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    session_id INTEGER,
    sender TEXT,  -- 'therapist' or 'client'
    content TEXT,
    timestamp TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
)
```

---

## Future Feature 3: AI Transcription

### Goal
Automatically transcribe therapy sessions in real-time with speaker labels.

### Service Comparison

| Service | Price/min | HIPAA | Real-time | Accuracy | Medical Vocab |
|---------|-----------|-------|-----------|----------|---------------|
| **AssemblyAI** | $0.015 | ✅ | ✅ | 95%+ | ✅ |
| **OpenAI Whisper** | $0.006 | ❌ (need BAA) | ❌ | 95%+ | ✅ |
| **Deepgram** | $0.012 | ✅ | ✅ | 94%+ | ✅ |
| **Rev.ai** | $0.025 | ✅ | ❌ | 98%+ | ✅ |

**Recommendation:** **AssemblyAI** for production (HIPAA compliant) or **Whisper** for MVP/development.

### Architecture
```
Video Session (Daily.co)
    ↓
Capture Audio Stream
    ↓
Stream to AssemblyAI
    ↓
Real-time Transcript with Speaker Labels
    ↓
Display in Sidebar During Session
    ↓
Store Final Transcript with Session
```

### Implementation Flow
```python
# Backend endpoint
@app.post("/api/sessions/{id}/transcribe")
async def transcribe_session(session_id: int, audio_file: UploadFile):
    # Upload to AssemblyAI
    response = assembly.transcribe(audio_file)

    # Get transcript with speaker diarization
    transcript = response.get_transcript()

    # Store with session
    update_session(session_id, transcript=transcript)

    return {"transcript": transcript, "speakers": speakers}
```

### UI Features
- Real-time transcript sidebar during session
- Speaker labels (Therapist/Client)
- Timestamps for navigation
- Searchable transcript
- Export as PDF or text

### Privacy Considerations
- Client consent required for recording
- Option to turn off recording
- Secure storage with encryption
- Retention policy (auto-delete after X days)
- Clear indicator when recording

---

## Future Feature 4: RAG (Retrieval-Augmented Generation) Over Transcripts

### Goal
Enable semantic search across all session transcripts to find patterns, track progress, and generate insights.

### Architecture

```
Session Transcripts
    ↓
Generate Embeddings (OpenAI text-embedding-3)
    ↓
Store in Vector Database
    ↓
User Query → Semantic Search → Retrieve Relevant Chunks
    ↓
Pass to LLM with Context → Generate Answer
```

### Vector Database Options

| Database | Type | Cost | Pros | Cons |
|----------|------|------|------|------|
| **ChromaDB** | Open source, local | Free | Simple, no external deps | Scaling limits |
| **Pinecone** | Managed cloud | ~$70/mo | Scalable, simple API | Cost at scale |
| **Weaviate** | Open source + cloud | Free or $25+/mo | Flexible, good docs | More complex |

**Recommendation:** Start with **ChromaDB** for MVP, migrate to **Pinecone** for production.

### Use Cases

1. **Pattern Detection**
   - Query: "Show me all times client mentioned their father"
   - Returns: Relevant chunks across all sessions with context

2. **Progress Tracking**
   - Query: "How has client's anxiety changed over time?"
   - Returns: Timeline of anxiety mentions with sentiment

3. **Insight Generation**
   - Query: "What are recurring themes in this client's sessions?"
   - Returns: Semantic clustering of topics

4. **Clinical Notes Assistance**
   - Query: "Summarize last 3 sessions"
   - Returns: AI-generated summary with key points

### Implementation Example

```python
# After session ends
transcript = session.transcript
chunks = split_transcript_by_speaker_turn(transcript)

# Generate embeddings
embeddings = openai.embed(chunks)

# Store with metadata
for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
    vector_db.upsert({
        'id': f'session_{session.id}_chunk_{i}',
        'embedding': embedding,
        'metadata': {
            'client_id': client.id,
            'session_date': session.date,
            'speaker': 'therapist' | 'client',
            'text': chunk,
            'emotional_themes': session.emotional_themes
        }
    })

# Query later
query = "What did client say about work stress?"
results = vector_db.query(
    query_embedding=openai.embed(query),
    filter={'client_id': client.id},
    top_k=10
)

# Pass to LLM for synthesis
answer = gpt4.complete(
    prompt=f"Based on these excerpts: {results}, answer: {query}"
)
```

### UI Features

**"Ask About Client" Search Bar:**
```jsx
<div className="client-insights">
  <input
    placeholder="Ask anything about this client's sessions..."
    onSubmit={handleRAGQuery}
  />

  {results && (
    <div className="insights-results">
      <h3>Found in {results.length} sessions:</h3>
      {results.map(result => (
        <div className="insight-card">
          <div className="session-date">{result.session_date}</div>
          <div className="excerpt">{result.text}</div>
          <button onClick={() => openSession(result.session_id)}>
            View Full Session
          </button>
        </div>
      ))}

      <div className="ai-summary">
        <h4>AI Summary:</h4>
        <p>{aiGeneratedSummary}</p>
      </div>
    </div>
  )}
</div>
```

**Additional Features:**
- "Find Similar Sessions" - semantic similarity search
- Timeline view of topic evolution
- Auto-generated session themes
- Pattern alerts (e.g., "Client has mentioned 'insomnia' in 5 recent sessions")

### Cost Estimation
- Embeddings: $0.0001 per 1K tokens (~$0.01 per session)
- Vector storage: ~$0.01 per 1K vectors/month
- LLM queries: $0.01-0.10 per query depending on context
- **Total:** ~$0.05-0.15 per session stored + query costs

---

## Future Feature 5: AI-Powered Note Generation

### Goal
Automatically extract structured information from transcripts to pre-populate clinical notes.

### Architecture

```
Session Transcript
    ↓
Send to LLM (GPT-4 or Claude)
    ↓
Structured Output:
  - Life domains discussed (with quotes)
  - Emotional themes (with evidence)
  - Client insights
  - Interventions used
  - Homework suggestions
  - Risk assessment flags
    ↓
Present as Pre-filled Form (editable by therapist)
```

### LLM Prompt Template

```
You are a clinical assistant reviewing a therapy session transcript.

Transcript:
[FULL TRANSCRIPT WITH SPEAKER LABELS]

Analyze this session and extract structured information:

1. LIFE DOMAINS DISCUSSED
   For each domain mentioned, provide:
   - Domain name (relationships, career, self_esteem, family,
     physical_health, financial, substance_use, trauma)
   - Brief summary (2-3 sentences)
   - Most relevant quote from transcript

2. EMOTIONAL THEMES PRESENT
   For each emotion present, provide:
   - Emotion (anxiety, depression, anger, shame, guilt, grief,
     fear, loneliness, joy)
   - Context (when/why it arose)
   - Relevant quote demonstrating the emotion

3. INTERVENTIONS USED
   List therapeutic techniques used:
   [CBT, DBT, Mindfulness, Exposure Therapy, EMDR, Psychoeducation,
    Behavioral Activation, Cognitive Restructuring, Grounding
    Techniques, Relaxation Exercises]

4. CLIENT INSIGHTS
   Key realizations or breakthroughs the client had

5. SESSION SUMMARY
   2-3 sentence overview of the session

6. SUGGESTED HOMEWORK
   Based on session content, suggest homework assignments

7. RISK ASSESSMENT
   Note any safety concerns, suicidal ideation, self-harm mentions,
   or other risk factors. If none, state "No immediate concerns noted."

Output as JSON with the above structure.
```

### Implementation Flow

```jsx
// After session ends
const handleEndSession = async () => {
  // Update status
  await updateSession(sessionId, { status: 'completed' })

  // Show loading state
  setAnalyzing(true)

  // Send transcript to LLM
  const analysis = await analyzeTranscript(transcript)

  // Pre-fill form with AI suggestions
  setSessionFormData({
    life_domains: analysis.life_domains,
    emotional_themes: analysis.emotional_themes,
    interventions: analysis.interventions,
    client_insights: analysis.client_insights,
    session_summary: analysis.session_summary,
    homework_assigned: analysis.homework_suggestions,
    risk_assessment: analysis.risk_assessment
  })

  // Show form with "AI-suggested" badges
  setShowEditForm(true)
  setAnalyzing(false)
}
```

### UI Design

```jsx
<form className="session-form ai-assisted">
  <div className="ai-notice">
    🤖 The following fields have been auto-filled by AI.
    Please review and edit as needed.
  </div>

  {/* Life Domains with AI suggestions */}
  <div className="form-section">
    <h4>Life Domains Discussed <span className="ai-badge">AI</span></h4>
    {Object.entries(aiSuggestions.life_domains).map(([domain, data]) => (
      <div className="ai-suggestion-card">
        <div className="suggestion-header">
          <input type="checkbox" checked={true} />
          <span>{formatLabel(domain)}</span>
          <span className="confidence">95% confidence</span>
        </div>

        <textarea value={data.summary} />

        <div className="supporting-quote">
          <strong>Supporting quote:</strong>
          <em>"{data.quote}"</em>
        </div>

        <div className="suggestion-actions">
          <button onClick={acceptSuggestion}>✓ Keep</button>
          <button onClick={rejectSuggestion}>✗ Remove</button>
        </div>
      </div>
    ))}
  </div>

  {/* Risk Assessment with highlighting */}
  <div className="form-section risk-section">
    <h4>Risk Assessment <span className="ai-badge">AI</span></h4>
    <textarea value={aiSuggestions.risk_assessment} />
    {aiSuggestions.risk_level === 'high' && (
      <div className="risk-alert">
        ⚠️ AI detected potential risk factors. Please review carefully.
      </div>
    )}
  </div>

  <button type="submit">Save Session Notes</button>
</form>
```

### Benefits

1. **Time Savings:** 10-15 minutes saved per session on note-taking
2. **Consistency:** Structured format enforced across all sessions
3. **Completeness:** AI catches details therapist might miss
4. **Pattern Recognition:** AI can highlight recurring themes
5. **Risk Detection:** Automatic flagging of concerning language

### Safeguards & Ethics

**Critical Requirements:**
1. **Therapist Review Required:** AI suggestions are aids, not replacements
2. **Clear Labeling:** All AI-generated content marked clearly
3. **Edit Capability:** Therapist can modify or reject any suggestion
4. **Audit Trail:** Log what was AI-suggested vs therapist-edited
5. **Risk Assessment:** Cannot rely solely on AI for risk evaluation
6. **Documentation:** Note that therapist reviewed and approved AI content

**Legal/Clinical Considerations:**
- State licensure boards may have rules about AI assistance
- Insurance may require human-reviewed documentation
- HIPAA compliance for all AI processing
- Client consent for AI analysis of sessions
- Professional liability insurance considerations

### Cost Estimation
- GPT-4 analysis: ~$0.15-0.25 per session (depending on transcript length)
- Claude analysis: ~$0.10-0.20 per session
- Processing time: 30-60 seconds
- **ROI:** Saves 10-15 min/session = therapist time worth $30-75

---

## Future Feature 6: "Start Session" Workflow

### Goal
Unified workflow that combines video, chat, transcription, and note-taking.

### State Machine

```
Session Status States:
- scheduled (future appointment)
- pre_session (15 min before start)
- in_progress (session actively running)
- post_session (ended, pending notes)
- completed (notes finalized)
- cancelled
- no_show
```

### Complete Workflow

**1. Pre-Session (15 min before)**
```jsx
<SessionCard status="scheduled">
  <button className="btn-start" disabled={!canStart}>
    Start Session {timeUntilStart}
  </button>

  {canStart && (
    <div className="pre-session-checklist">
      ✓ Client reminded via email
      ✓ Room ready
      ⚠ Review client's recent sessions
    </div>
  )}
</SessionCard>
```

**2. Start Session**
```jsx
const handleStartSession = async () => {
  // Update status
  await updateSession(sessionId, {
    status: 'in_progress',
    actual_start_time: new Date()
  })

  // Launch video room
  const room = await daily.createRoom({
    name: `session-${sessionId}`,
    privacy: 'private',
    properties: {
      enable_recording: consentGiven,
      enable_chat: true
    }
  })

  // Start transcription
  if (consentGiven) {
    startTranscription(room.audio_stream)
  }

  // Show session UI
  setInSession(true)
}
```

**3. In-Session UI**
```jsx
<div className="session-active">
  {/* Video Section */}
  <div className="video-container">
    <DailyVideo room={room} />

    <div className="session-controls">
      <button onClick={toggleMute}>🎤 Mute</button>
      <button onClick={toggleVideo}>📹 Video</button>
      <button onClick={endSession}>End Session</button>
      <div className="timer">{elapsedTime}</div>
    </div>
  </div>

  {/* Sidebar */}
  <div className="session-sidebar">
    <Tabs>
      <Tab label="Chat">
        <ChatWindow sessionId={sessionId} />
      </Tab>

      <Tab label="Transcript">
        <TranscriptView
          transcript={liveTranscript}
          autoScroll={true}
        />
      </Tab>

      <Tab label="Notes">
        <QuickNotes
          notes={sessionNotes}
          onChange={setSessionNotes}
        />
      </Tab>
    </Tabs>
  </div>
</div>
```

**4. End Session**
```jsx
const handleEndSession = async () => {
  // Stop video
  room.leave()

  // Finalize transcript
  const finalTranscript = await transcription.finalize()

  // Update session
  await updateSession(sessionId, {
    status: 'post_session',
    actual_end_time: new Date(),
    actual_duration: elapsedTime,
    transcript: finalTranscript
  })

  // Trigger AI analysis
  setAnalyzing(true)
  const analysis = await analyzeTranscript(finalTranscript)

  // Show notes form with AI suggestions
  openNotesForm(analysis)
}
```

**5. Post-Session Notes**
```jsx
<div className="post-session">
  <div className="session-summary-header">
    <h2>Session Completed</h2>
    <div className="session-stats">
      <span>Duration: {actualDuration}</span>
      <span>Date: {sessionDate}</span>
    </div>
  </div>

  {/* AI-assisted notes form */}
  <SessionNotesForm
    prefilled={aiSuggestions}
    transcript={transcript}
    onSubmit={finalizeSession}
  />
</div>
```

### UI Mockup Flow

```
┌─────────────────────────────────────┐
│  Today's Schedule                   │
│  ┌──────────────────────┐           │
│  │ 2:00 PM - John Doe   │ [Start]   │  ← Pre-session
│  │ Status: Scheduled    │           │
│  └──────────────────────┘           │
└─────────────────────────────────────┘
                ↓ Click Start
┌─────────────────────────────────────┐
│  ┌─────────────────┬─────────────┐  │
│  │                 │   Sidebar   │  │
│  │   Video Feed    │ ┌─────────┐ │  │
│  │                 │ │  Chat   │ │  │  ← In-session
│  │   [You]  [John] │ │Transcript│ │  │
│  │                 │ │  Notes  │ │  │
│  │  [🎤] [📹]      │ └─────────┘ │  │
│  │  [End Session]  │   00:47:23  │  │
│  └─────────────────┴─────────────┘  │
└─────────────────────────────────────┘
                ↓ End Session
┌─────────────────────────────────────┐
│  Analyzing transcript... 🤖          │  ← AI processing
│  ████████░░ 80%                     │
└─────────────────────────────────────┘
                ↓ Analysis complete
┌─────────────────────────────────────┐
│  Session Notes - John Doe           │
│  ┌─────────────────────────────┐   │
│  │ Life Domains (AI) ✨        │   │  ← Post-session
│  │ ☑ Relationships             │   │
│  │   "Client discussed..."     │   │
│  │ ☑ Career                    │   │
│  │   "Feelings of stress..."   │   │
│  └─────────────────────────────┘   │
│  [Review & Save Notes]              │
└─────────────────────────────────────┘
```

---

## Technology Stack Proposal

### Frontend
```javascript
// Current
- React 18+ with Vite
- Vanilla CSS with CSS Variables

// Additions Needed
- Daily.co React SDK (@daily-co/daily-react)
- Socket.io client (for chat)
- Real-time markdown editor (for notes)
```

### Backend
```python
# Current
- FastAPI
- SQLite
- Pydantic

# Additions Needed
- daily-python (video SDK)
- assemblyai (transcription)
- openai (embeddings + GPT-4)
- chromadb (vector database)
- python-socketio (chat)
```

### Database Evolution
```sql
-- Current: SQLite
-- Future: PostgreSQL with pgvector extension

-- New Tables Needed:

CREATE TABLE transcripts (
    id INTEGER PRIMARY KEY,
    session_id INTEGER,
    content TEXT,
    speakers JSONB,
    timestamps JSONB,
    created_at TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    session_id INTEGER,
    sender TEXT,  -- 'therapist' | 'client'
    content TEXT,
    timestamp TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE embeddings (
    id INTEGER PRIMARY KEY,
    session_id INTEGER,
    chunk_index INTEGER,
    embedding vector(1536),  -- pgvector type
    content TEXT,
    speaker TEXT,
    metadata JSONB,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## Cost Analysis: AI-Powered Features

### Per-Session Costs

| Feature | Service | Cost | Notes |
|---------|---------|------|-------|
| **Video** | Daily.co | $0.10 | 50 min @ $0.002/min |
| **Transcription** | AssemblyAI | $0.75 | 50 min @ $0.015/min |
| **AI Analysis** | GPT-4 | $0.20 | Structured extraction |
| **Embeddings** | OpenAI | $0.01 | Text-embedding-3-small |
| **Vector Storage** | Pinecone | $0.01 | Monthly storage |
| **RAG Queries** | GPT-4 + embeddings | $0.05 | Per query (avg 3/session) |
| **TOTAL** | | **$1.12** | per session |

### Monthly Costs (20 sessions/day, 20 work days)

| Item | Calculation | Monthly Cost |
|------|-------------|--------------|
| Sessions | 20 × 20 × $1.12 | $448 |
| Vector DB | Pinecone Pro | $70 |
| Chat Infrastructure | Self-hosted | $0 |
| **TOTAL** | | **~$520/month** |

### Revenue Analysis
- Therapy session rate: $100-200/hour
- Time saved per session: 10-15 min (notes)
- Value created: ~$25-50 per session
- **ROI:** Features pay for themselves if they save 15+ min/session

### Pricing Models

**Option A: Flat Monthly**
- $99/month for solo practitioners
- Unlimited sessions

**Option B: Per-Session**
- $2-3 per AI-assisted session
- Only pay for what you use

**Option C: Tiered**
- Basic: $49/mo (manual notes, no AI)
- Pro: $149/mo (AI notes, transcription)
- Enterprise: $299/mo (RAG, advanced analytics)

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Set up Daily.co account and test room creation
- [ ] Implement basic video embed
- [ ] Add "Start Session" button and status flow

### Phase 2: Transcription (Weeks 3-4)
- [ ] Integrate AssemblyAI
- [ ] Capture audio from video session
- [ ] Store transcripts in database
- [ ] Display transcript in session sidebar
- [ ] Add consent flow for recording

### Phase 3: AI Note Generation (Weeks 5-6)
- [ ] Design structured extraction prompt
- [ ] Integrate OpenAI GPT-4
- [ ] Build AI-assisted notes form
- [ ] Implement edit/approve workflow
- [ ] Add audit trail for AI suggestions

### Phase 4: RAG System (Weeks 7-9)
- [ ] Set up ChromaDB/Pinecone
- [ ] Generate and store embeddings for transcripts
- [ ] Build semantic search UI
- [ ] Implement "Ask About Client" feature
- [ ] Add insight generation

### Phase 5: Chat (Weeks 10-11)
- [ ] Set up WebSocket infrastructure
- [ ] Build in-session chat UI
- [ ] Add pre-session messaging
- [ ] Implement between-session check-ins

### Phase 6: Polish & Testing (Weeks 12-13)
- [ ] End-to-end workflow testing
- [ ] HIPAA compliance audit
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Documentation

### Phase 7: Launch (Week 14+)
- [ ] Beta program with select therapists
- [ ] Gather feedback and iterate
- [ ] Production deployment
- [ ] Marketing and onboarding

**Total Timeline:** ~3-4 months for full feature set

---

## Privacy & Compliance Considerations

### HIPAA Requirements

**Technical Safeguards:**
1. End-to-end encryption for video/audio
2. Encrypted storage for transcripts
3. Secure WebSocket connections (WSS)
4. Access logging and audit trails
5. Data backup and recovery

**Administrative Safeguards:**
1. Business Associate Agreements (BAA) with:
   - Daily.co (video)
   - AssemblyAI (transcription)
   - OpenAI (AI analysis)
   - Pinecone (vector storage)
2. Privacy policy and terms of service
3. Incident response plan
4. Employee training (if applicable)

**Physical Safeguards:**
1. Secure server infrastructure
2. Database encryption at rest
3. Regular security audits

### Client Consent

**Required Disclosures:**
```jsx
<ConsentForm>
  <h3>Video Session Consent</h3>
  <Checkbox required>
    I consent to video recording of this session
  </Checkbox>

  <Checkbox required>
    I consent to AI transcription of this session
  </Checkbox>

  <Checkbox required>
    I consent to AI analysis to assist with clinical notes
  </Checkbox>

  <Checkbox>
    I consent to anonymized data used for pattern analysis
  </Checkbox>

  <p>
    You can revoke consent at any time. Recording can be
    turned off during any session. All data will be encrypted
    and stored securely. AI processing is HIPAA-compliant.
  </p>
</ConsentForm>
```

### Data Retention

**Recommended Policy:**
- Session recordings: Delete after 7 days
- Transcripts: Delete after 90 days (or per state law)
- Clinical notes: Retain per legal requirements (typically 7 years)
- Chat messages: Delete after 30 days
- Embeddings: Delete when transcripts deleted
- Audit logs: Retain for 6 years

### Right to Delete

```python
@app.delete("/api/clients/{id}/data")
async def delete_client_data(client_id: int):
    """
    Complete data deletion per client request
    """
    # Delete all session data
    delete_sessions(client_id)
    delete_transcripts(client_id)
    delete_embeddings(client_id)
    delete_messages(client_id)
    delete_videos(client_id)

    # Anonymize client record (don't delete for audit)
    anonymize_client(client_id)

    # Log deletion request
    log_data_deletion(client_id, timestamp=datetime.now())

    return {"status": "deleted"}
```

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| API downtime | Fallback to manual notes if AI fails |
| Transcription errors | Always allow manual editing |
| Data breach | Encryption, access controls, audit logs |
| AI hallucinations | Therapist review required, show confidence scores |
| Video quality issues | Adaptive bitrate, network quality monitoring |

### Clinical Risks

| Risk | Mitigation |
|------|------------|
| Over-reliance on AI | Clear labeling, therapist training, required review |
| Missed risk factors | AI flags for review, therapist final decision |
| Privacy concerns | Explicit consent, clear opt-out, secure storage |
| AI bias | Regular model evaluation, diverse training data |
| Technical barriers | Simple UI, help docs, onboarding support |

### Legal Risks

| Risk | Mitigation |
|------|------------|
| HIPAA violation | BAAs, encryption, compliance audit |
| Licensing issues | Check state rules on AI assistance |
| Liability | Professional insurance, clear disclaimers |
| Data breach | Incident response plan, cyber insurance |
| Consent issues | Documented consent flow, easy revocation |

---

## Success Metrics

### User Metrics
- Time saved per session (target: 10+ minutes)
- Therapist satisfaction score (target: 8+/10)
- Client satisfaction with video quality (target: 90%+)
- Adoption rate of AI suggestions (target: 70%+)

### Technical Metrics
- Video session success rate (target: 99%+)
- Transcription accuracy (target: 95%+)
- AI note generation accuracy (target: 85%+)
- RAG query relevance (target: 80%+)
- Page load time (target: <2s)
- System uptime (target: 99.9%+)

### Business Metrics
- Monthly recurring revenue
- Customer acquisition cost
- Customer lifetime value
- Churn rate (target: <5%/month)
- Net promoter score (target: 50+)

---

## Alternative Future Directions

### Option 1: Focus on Analytics
Instead of video/AI, double down on data visualization:
- Advanced pattern recognition
- Predictive analytics (risk of no-show, treatment success)
- Comparative benchmarking
- Outcome tracking across therapists

### Option 2: Collaborative Care
Multi-disciplinary features:
- Psychiatrist integration (medication tracking)
- Care team coordination
- Referral management
- Insurance/billing integration

### Option 3: Client-Facing Portal
Give clients access to:
- Homework assignments
- Progress tracking
- Mood journaling
- Resource library
- Self-scheduling

### Option 4: Group Therapy
- Multi-participant video
- Group notes
- Participation tracking
- Breakout rooms

---

**Development Log Last Updated:** December 28, 2025
**Total Lines of Code:** ~3100+ (Backend: ~400, Frontend: ~1300 JS + ~1530 CSS)
**Status:** Active Development
**Latest Changes:** Appointment linking workflow + Modern minimalist UI redesign
