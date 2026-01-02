# Client Intake & Assessment System

## Overview

A comprehensive system for onboarding new clients through intake forms and personality/clinical assessments. Supports both email-link access (no account) and client portal login.

---

## Components Created

### 1. **Intake Forms** (`frontend/src/config/intakeForms.js`)

Practice-specific intake questionnaires:

#### **Therapy Intake Form** (6 sections, 50+ fields)
- Basic Information (demographics, living situation)
- Presenting Concerns (reason for therapy, goals, urgency)
- Mental Health History (diagnoses, medications, hospitalizations, substance use, self-harm, suicidality)
- Life History & Background (childhood, trauma, education, relationships)
- Current Life Situation (support system, coping, strengths, sleep, health)
- Practical Matters (session frequency, format preferences)

#### **Training/Coaching Intake Form** (5 sections)
- Fitness goals, experience, health screening, lifestyle, schedule

#### **Tutoring Intake Form** (4 sections)
- Academic needs, learning profile, subjects, schedule

#### **Freelance Project Intake Form** (4 sections)
- Project details, scope, timeline, budget, collaboration needs

### 2. **Assessment Library** (`frontend/src/config/assessments.js`)

Five validated assessment tools:

#### **Big Five Personality (30 questions)**
- Measures: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- 5-point Likert scale
- Takes ~10 minutes

#### **Attachment Style (18 questions)**
- Measures: Secure, Anxious, Avoidant, Fearful attachment patterns
- 5-point scale
- Takes ~5 minutes

#### **PHQ-9 Depression Screening (9 questions)**
- Clinical tool for depression severity
- Scoring: Minimal (0-4), Mild (5-9), Moderate (10-14), Moderately Severe (15-19), Severe (20-27)
- 4-point frequency scale
- Takes ~3 minutes

#### **GAD-7 Anxiety Screening (7 questions)**
- Clinical tool for anxiety severity
- Scoring: Minimal (0-4), Mild (5-9), Moderate (10-14), Severe (15-21)
- 4-point frequency scale
- Takes ~3 minutes

#### **Four Masculine Archetypes (24 questions)**
- Measures: King, Warrior, Magician, Lover (Moore & Gillette model)
- 5-point scale
- Takes ~8 minutes

---

## System Architecture

### Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. THERAPIST CREATES CLIENT                             │
│    → "Send Intake Form" button                          │
│    → Selects: Form + Assessments to include             │
│    → Generates unique secure link                       │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 2. CLIENT RECEIVES EMAIL                                │
│    → Link to intake portal (no login required)          │
│    → Or: Client portal login link (if account exists)   │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 3. CLIENT COMPLETES FORMS                               │
│    → Multi-step form wizard                             │
│    → Progress tracking                                  │
│    → Save & resume capability                           │
│    → Intake form + selected assessments                 │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 4. THERAPIST REVIEWS                                    │
│    → Notification when completed                        │
│    → Review intake responses                            │
│    → View assessment scores & interpretations           │
│    → Approve & create/update client profile             │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Intake form submissions
CREATE TABLE intake_responses (
    id INTEGER PRIMARY KEY,
    client_id INTEGER,
    therapist_id INTEGER NOT NULL,
    form_type TEXT NOT NULL, -- 'therapy', 'training', 'tutoring', 'freelance'
    responses TEXT NOT NULL, -- JSON: { field_id: value }
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'reviewed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    link_token TEXT UNIQUE, -- Secure token for email link access
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment results
CREATE TABLE assessment_responses (
    id INTEGER PRIMARY KEY,
    client_id INTEGER,
    therapist_id INTEGER NOT NULL,
    intake_response_id INTEGER, -- Links to intake if taken together
    assessment_id TEXT NOT NULL, -- 'big-five', 'phq-9', etc.
    responses TEXT NOT NULL, -- JSON: { question_id: value }
    scores TEXT NOT NULL, -- JSON: calculated scores
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shareable form links
CREATE TABLE form_links (
    id INTEGER PRIMARY KEY,
    therapist_id INTEGER NOT NULL,
    client_email TEXT NOT NULL,
    client_name TEXT,
    link_token TEXT UNIQUE NOT NULL,
    form_type TEXT NOT NULL,
    included_assessments TEXT, -- JSON array: ['big-five', 'phq-9']
    status TEXT DEFAULT 'sent', -- 'sent', 'opened', 'completed'
    expires_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Backend API Endpoints

```python
# Create intake form link
POST /api/intake/create-link
Body: {
    "client_email": "client@example.com",
    "client_name": "John Doe",
    "form_type": "therapy",
    "included_assessments": ["big-five", "phq-9"],
    "expires_in_days": 7
}
Response: {
    "link_token": "abc123...",
    "public_url": "https://app.com/intake/abc123",
    "expires_at": "2025-01-15T00:00:00Z"
}

# Send intake form email
POST /api/intake/send-email
Body: {
    "link_token": "abc123...",
    "client_email": "client@example.com",
    "custom_message": "Looking forward to working with you!"
}

# Get intake form by token (public, no auth)
GET /api/intake/form/:token
Response: {
    "form_type": "therapy",
    "form_config": {...},
    "assessments": [...],
    "client_name": "John Doe",
    "status": "pending"
}

# Submit intake response (public, no auth)
POST /api/intake/submit/:token
Body: {
    "section": "basic_info",
    "responses": { "field_id": "value" }
}

# Submit assessment response (public, no auth)
POST /api/intake/submit-assessment/:token
Body: {
    "assessment_id": "big-five",
    "responses": { "bf1": 4, "bf2": 5, ... }
}

# Mark intake as completed (public, no auth)
POST /api/intake/complete/:token

# List pending intakes for therapist (protected)
GET /api/intake/pending
Response: [
    {
        "id": 123,
        "client_name": "John Doe",
        "form_type": "therapy",
        "status": "completed",
        "completed_at": "2025-01-10T14:30:00Z"
    }
]

# Get intake response for review (protected)
GET /api/intake/:id
Response: {
    "responses": {...},
    "assessment_results": [...],
    "client_info": {...}
}

# Approve intake and create client (protected)
POST /api/intake/:id/approve
Body: {
    "create_client": true,
    "additional_notes": "..."
}

# Re-administer assessment to existing client (protected)
POST /api/assessments/assign
Body: {
    "client_id": 456,
    "assessment_id": "phq-9",
    "send_email": true
}
```

---

## Frontend Components to Build

### 1. **Therapist-Side Components**

#### **SendIntakeButton** (in Dashboard, Client Profile)
- Button: "Send Intake Form"
- Opens modal to:
  - Select form type (auto-detected from practice type)
  - Select assessments to include (checkboxes)
  - Enter client email
  - Add optional personal message
  - Set expiration (default 7 days)
- Generates link and sends email

#### **PendingIntakesWidget** (Dashboard)
- Shows list of sent/pending intake forms
- Badge with count of completed, awaiting review
- Click to review

#### **IntakeReviewPage** (`/intake/review/:id`)
- Shows all intake responses in organized sections
- Assessment results with visualizations (radar charts, score tables)
- Notes textarea for therapist
- "Approve & Create Client" button
- "Request Changes" button (sends email back to client)

#### **ClientProfileIntakeTab** (Client detail page)
- View historical intake responses
- Re-administer assessments button
- Track PHQ-9/GAD-7 scores over time (line chart)

### 2. **Client-Side Components**

#### **IntakePortal** (`/intake/:token` - public route)
- No authentication required
- Validates token, checks expiration
- Multi-step wizard:
  1. Welcome screen (shows therapist name, estimated time)
  2. Intake form sections (one section per step)
  3. Assessment quizzes (one per step)
  4. Review & submit
  5. Thank you confirmation
- Progress bar
- Save & resume functionality (stores in localStorage + backend)
- Mobile-responsive

#### **AssessmentViewer** (reusable component)
- Displays assessment questions
- Radio buttons / checkboxes for responses
- Progress indicator
- "Previous" and "Next" buttons
- Client-friendly styling (less clinical, more conversational)

### 3. **Visualization Components**

#### **BigFiveChart** (Radar chart)
```
      Openness
         /\
        /  \
 Neurot.    Conscientiousness
    |          |
    |          |
 Agree.  Extraversion
```

#### **AttachmentStyleChart** (Quadrant chart)
```
   Anxious
      |
Avoid.+  Secure
      |
  Fearful
```

#### **PHQ9GAD7Tracker** (Line chart over time)
- Track depression/anxiety scores across multiple administrations
- Show trend lines
- Highlight severity zones

---

## UI/UX Considerations

### Email Design
```
Subject: Complete Your Intake Form - [Therapist Name]

Hi [Client Name],

Thank you for choosing to work with me. Before our first session,
please complete this brief intake form. It should take about 15-20 minutes.

[Complete Intake Form Button]

This link will expire in 7 days. If you need more time or have questions,
please reply to this email.

Looking forward to meeting you!

[Therapist Name]
```

### Client Portal Styling
- Warm, welcoming design (not sterile/clinical)
- Clear progress indicators
- Encouraging microcopy ("You're doing great!", "Almost done!")
- Mobile-first responsive design
- Large touch targets for radio buttons
- Autosave every field change
- No data loss if browser closes

### Therapist Review Interface
- Clean, scannable layout
- Highlight urgent concerns (suicide ideation, current crisis)
- Group related information
- Assessment scores prominently displayed
- Quick actions: Approve, Edit, Request Changes
- Export to PDF for records

---

## Implementation Priority

### Phase 1: MVP (Core Workflow)
1. Database tables for intake_responses, assessment_responses, form_links
2. Backend API endpoints (create link, submit, review)
3. Simple email sending (SendGrid/Postmark)
4. IntakePortal component (public form viewer)
5. Basic SendIntakeButton in Dashboard
6. IntakeReviewPage for therapist

### Phase 2: Enhanced Features
1. Assessment score calculations & visualizations
2. Progress tracking over time (PHQ-9/GAD-7 charts)
3. Client portal login option (vs. email link)
4. Custom assessment builder
5. Form customization per therapist
6. Multi-language support

### Phase 3: Advanced Features
1. AI-assisted intake summary generation
2. Risk assessment alerts (suicide ideation detection)
3. Insurance billing code suggestions based on intake
4. Treatment plan generation from intake data
5. Automated follow-up assessment scheduling
6. Client pre-session check-ins (brief PHQ-9/GAD-7 before each session)

---

## Security & Privacy Considerations

1. **Link Tokens**: Cryptographically secure, single-use, expiring
2. **Rate Limiting**: Prevent brute force token guessing
3. **HTTPS Only**: All intake submissions over encrypted connection
4. **Data Encryption**: Sensitive responses encrypted at rest
5. **HIPAA Compliance**:
   - Business Associate Agreements with email provider
   - Audit logging of all access
   - Automatic expiration of old submissions
6. **No PII in URLs**: Token is opaque, doesn't reveal client info
7. **Consent**: Clear privacy policy on intake portal
8. **Client Portal**: Optional 2FA for ongoing access

---

## Testing Checklist

- [ ] Send intake link via email
- [ ] Complete intake form as client (no account)
- [ ] Save and resume intake in progress
- [ ] Submit all assessments
- [ ] Review intake as therapist
- [ ] Approve and create client profile
- [ ] Re-administer single assessment to existing client
- [ ] Track PHQ-9 scores over time
- [ ] Test expired link (should show error)
- [ ] Test invalid token (404)
- [ ] Mobile responsiveness
- [ ] Email deliverability
- [ ] PDF export of intake responses

---

## Next Steps

1. Review this plan and confirm approach
2. Build database migrations
3. Implement backend API
4. Build IntakePortal (client-facing)
5. Build therapist review interface
6. Connect to email service
7. Test end-to-end workflow
8. Deploy to production

Questions or adjustments needed before we start building?
