/**
 * Track Configurations for Multi-Practice Platform
 *
 * Each practice type (therapy, training, tutoring, freelance) has its own:
 * - Terminology (client/student, session/workout/lesson/meeting)
 * - Domains (what areas are tracked)
 * - Themes (what patterns/topics emerge)
 * - Interventions (what methods/techniques are used)
 * - Field visibility flags (which forms fields to show/hide)
 */

export const TRACK_CONFIGS = {
  therapy: {
    label: 'Therapist',
    clientTerm: 'Client',
    clientTermPlural: 'Clients',
    sessionTerm: 'Session',
    sessionTermPlural: 'Sessions',

    domains: [
      { value: 'relationships', label: 'Relationships' },
      { value: 'career', label: 'Career' },
      { value: 'self_esteem', label: 'Self Esteem' },
      { value: 'family', label: 'Family' },
      { value: 'physical_health', label: 'Physical Health' },
      { value: 'financial', label: 'Financial' },
      { value: 'substance_use', label: 'Substance Use' },
      { value: 'trauma', label: 'Trauma' }
    ],

    themes: [
      { value: 'anxiety', label: 'Anxiety' },
      { value: 'depression', label: 'Depression' },
      { value: 'anger', label: 'Anger' },
      { value: 'shame', label: 'Shame' },
      { value: 'guilt', label: 'Guilt' },
      { value: 'grief', label: 'Grief' },
      { value: 'fear', label: 'Fear' },
      { value: 'loneliness', label: 'Loneliness' },
      { value: 'joy', label: 'Joy' }
    ],

    interventions: [
      { value: 'CBT', label: 'CBT' },
      { value: 'DBT', label: 'DBT' },
      { value: 'Mindfulness', label: 'Mindfulness' },
      { value: 'Exposure Therapy', label: 'Exposure Therapy' },
      { value: 'EMDR', label: 'EMDR' },
      { value: 'Psychoeducation', label: 'Psychoeducation' },
      { value: 'Behavioral Activation', label: 'Behavioral Activation' },
      { value: 'Cognitive Restructuring', label: 'Cognitive Restructuring' },
      { value: 'Grounding Techniques', label: 'Grounding Techniques' },
      { value: 'Relaxation Exercises', label: 'Relaxation Exercises' }
    ],

    fields: {
      showRiskAssessment: true,
      showEmotionalThemes: true,
      showLifeDomains: true,
      showInterventions: true,
      showHomework: true,
      showClinicalObservations: true
    },

    domainLabel: 'Life Domains',
    themesLabel: 'Emotional Themes',
    interventionsLabel: 'Interventions Used'
  },

  training: {
    label: 'Personal Trainer',
    clientTerm: 'Client',
    clientTermPlural: 'Clients',
    sessionTerm: 'Workout',
    sessionTermPlural: 'Workouts',

    domains: [
      { value: 'cardio', label: 'Cardio' },
      { value: 'strength', label: 'Strength' },
      { value: 'flexibility', label: 'Flexibility' },
      { value: 'endurance', label: 'Endurance' },
      { value: 'recovery', label: 'Recovery' },
      { value: 'nutrition', label: 'Nutrition' },
      { value: 'form', label: 'Form' },
      { value: 'motivation', label: 'Motivation' }
    ],

    themes: [
      { value: 'fatigue', label: 'Fatigue' },
      { value: 'soreness', label: 'Soreness' },
      { value: 'improvement', label: 'Improvement' },
      { value: 'confidence', label: 'Confidence' },
      { value: 'plateau', label: 'Plateau' },
      { value: 'pain', label: 'Pain' },
      { value: 'energy', label: 'Energy' },
      { value: 'motivation', label: 'Motivation' }
    ],

    interventions: [
      { value: 'Strength Training', label: 'Strength Training' },
      { value: 'HIIT', label: 'HIIT' },
      { value: 'Flexibility Work', label: 'Flexibility Work' },
      { value: 'Nutrition Coaching', label: 'Nutrition Coaching' },
      { value: 'Form Correction', label: 'Form Correction' },
      { value: 'Cardio Training', label: 'Cardio Training' },
      { value: 'Recovery Techniques', label: 'Recovery Techniques' },
      { value: 'Goal Setting', label: 'Goal Setting' },
      { value: 'Motivation Techniques', label: 'Motivation Techniques' }
    ],

    fields: {
      showRiskAssessment: false,
      showEmotionalThemes: false,
      showLifeDomains: true,
      showInterventions: true,
      showHomework: true,
      showClinicalObservations: false,
      showPerformanceMetrics: true,
      showExerciseTracking: true
    },

    domainLabel: 'Training Focus',
    themesLabel: 'Physical Themes',
    interventionsLabel: 'Training Methods'
  },

  tutoring: {
    label: 'Tutor',
    clientTerm: 'Student',
    clientTermPlural: 'Students',
    sessionTerm: 'Lesson',
    sessionTermPlural: 'Lessons',

    domains: [
      { value: 'math', label: 'Math' },
      { value: 'english', label: 'English' },
      { value: 'science', label: 'Science' },
      { value: 'history', label: 'History' },
      { value: 'languages', label: 'Languages' },
      { value: 'test_prep', label: 'Test Prep' },
      { value: 'coding', label: 'Coding' },
      { value: 'writing', label: 'Writing' }
    ],

    themes: [
      { value: 'confusion', label: 'Confusion' },
      { value: 'breakthrough', label: 'Breakthrough' },
      { value: 'engagement', label: 'Engagement' },
      { value: 'frustration', label: 'Frustration' },
      { value: 'progress', label: 'Progress' },
      { value: 'mastery', label: 'Mastery' },
      { value: 'comprehension', label: 'Comprehension' },
      { value: 'retention', label: 'Retention' }
    ],

    interventions: [
      { value: 'Lecture', label: 'Lecture' },
      { value: 'Socratic Questioning', label: 'Socratic Questioning' },
      { value: 'Problem Solving', label: 'Problem Solving' },
      { value: 'Spaced Repetition', label: 'Spaced Repetition' },
      { value: 'Practice Problems', label: 'Practice Problems' },
      { value: 'Concept Mapping', label: 'Concept Mapping' },
      { value: 'Visual Aids', label: 'Visual Aids' },
      { value: 'Study Techniques', label: 'Study Techniques' },
      { value: 'Test Strategies', label: 'Test Strategies' }
    ],

    fields: {
      showRiskAssessment: false,
      showEmotionalThemes: false,
      showLifeDomains: true,
      showInterventions: true,
      showHomework: true,
      showClinicalObservations: false,
      showTestTracking: true,
      showAssignments: true
    },

    domainLabel: 'Subject Areas',
    themesLabel: 'Learning Themes',
    interventionsLabel: 'Teaching Methods'
  },

  freelance: {
    label: 'Freelancer/Consultant',
    clientTerm: 'Client',
    clientTermPlural: 'Clients',
    sessionTerm: 'Meeting',
    sessionTermPlural: 'Meetings',

    domains: [
      { value: 'scope', label: 'Scope' },
      { value: 'timeline', label: 'Timeline' },
      { value: 'budget', label: 'Budget' },
      { value: 'deliverables', label: 'Deliverables' },
      { value: 'communication', label: 'Communication' },
      { value: 'stakeholder_management', label: 'Stakeholder Management' },
      { value: 'risk', label: 'Risk' },
      { value: 'quality', label: 'Quality' }
    ],

    themes: [
      { value: 'blockers', label: 'Blockers' },
      { value: 'decisions', label: 'Decisions' },
      { value: 'progress', label: 'Progress' },
      { value: 'issues', label: 'Issues' },
      { value: 'approvals', label: 'Approvals' },
      { value: 'revisions', label: 'Revisions' },
      { value: 'scope_creep', label: 'Scope Creep' },
      { value: 'alignment', label: 'Alignment' }
    ],

    interventions: [
      { value: 'Status Update', label: 'Status Update' },
      { value: 'Design Review', label: 'Design Review' },
      { value: 'Code Review', label: 'Code Review' },
      { value: 'Testing', label: 'Testing' },
      { value: 'Feedback Session', label: 'Feedback Session' },
      { value: 'Scope Adjustment', label: 'Scope Adjustment' },
      { value: 'Risk Mitigation', label: 'Risk Mitigation' },
      { value: 'Stakeholder Alignment', label: 'Stakeholder Alignment' },
      { value: 'Planning', label: 'Planning' }
    ],

    fields: {
      showRiskAssessment: false,
      showEmotionalThemes: false,
      showLifeDomains: true,
      showInterventions: true,
      showHomework: false,
      showClinicalObservations: false,
      showDeliverables: true,
      showTimeTracking: true,
      showProjectInfo: true
    },

    domainLabel: 'Project Areas',
    themesLabel: 'Session Themes',
    interventionsLabel: 'Work Methods'
  }
}

/**
 * Get track configuration for a given practice type
 * Falls back to therapy config if practice type is not found or is null
 *
 * @param {string|null} practiceType - The practice type (therapy, training, tutoring, freelance)
 * @returns {object} Track configuration object
 */
export function getTrackConfig(practiceType) {
  return TRACK_CONFIGS[practiceType] || TRACK_CONFIGS.therapy
}

/**
 * Get array of all available practice types
 * Useful for dropdowns and selection UIs
 *
 * @returns {Array} Array of {value, label} objects
 */
export function getPracticeTypes() {
  return [
    { value: 'therapy', label: 'Therapist' },
    { value: 'training', label: 'Personal Trainer' },
    { value: 'tutoring', label: 'Tutor' },
    { value: 'freelance', label: 'Freelancer/Consultant' }
  ]
}
