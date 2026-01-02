/**
 * Extended data models for AI-assisted session summaries
 */

/**
 * @typedef {Object} EmotionEntry
 * @property {string} id - Unique identifier
 * @property {string} name - Emotion name (e.g., "anxiety", "joy")
 * @property {'high'|'medium'|'low'} intensity - Intensity level
 * @property {string} quote - Supporting quote from transcript
 * @property {string} timestamp - When this was mentioned (e.g., "12:45")
 */

/**
 * @typedef {Object} LifeDomainEntry
 * @property {string} id - Unique identifier
 * @property {string} domain - Domain name (e.g., "relationships", "career")
 * @property {string} notes - Brief note on what was discussed
 * @property {number} mentionCount - Number of times mentioned
 * @property {boolean} isPrimary - Whether this was a primary focus
 */

/**
 * @typedef {Object} InterventionEntry
 * @property {string} id - Unique identifier
 * @property {string} type - Intervention type (e.g., "CBT", "Mindfulness")
 * @property {string} evidence - What in transcript suggests this was used
 * @property {'high'|'medium'|'uncertain'} confidence - Confidence level
 * @property {boolean|null} confirmed - Therapist confirmation (null if not answered)
 */

/**
 * @typedef {Object} ClarifyingQuestion
 * @property {string} id - Unique identifier
 * @property {string} question - The question text
 * @property {'context'|'clinical'|'categorization'} category - Question category
 * @property {string|null} response - Therapist's response (null if not answered)
 */

/**
 * @typedef {Object} TherapistNote
 * @property {string} id - Unique identifier
 * @property {string} questionId - Related question ID
 * @property {string} note - The therapist's note
 * @property {string} timestamp - When the note was added
 */

/**
 * @typedef {Object} AIAssistedSessionData
 * @property {EmotionEntry[]} emotions - Extracted emotions with context
 * @property {LifeDomainEntry[]} lifeDomains - Life domains discussed
 * @property {InterventionEntry[]} interventions - Interventions used
 * @property {ClarifyingQuestion[]} clarifyingQuestions - Questions for therapist
 * @property {string} draftSummary - AI-generated draft summary
 * @property {TherapistNote[]} therapistNotes - Notes from answered questions
 * @property {string|null} transcript - Session transcript
 * @property {boolean} isFinalized - Whether summary is finalized
 */

export const EmotionIntensity = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

export const InterventionConfidence = {
  HIGH: 'high',
  MEDIUM: 'medium',
  UNCERTAIN: 'uncertain'
}

export const QuestionCategory = {
  CONTEXT: 'context',
  CLINICAL: 'clinical',
  CATEGORIZATION: 'categorization'
}

/**
 * Create a new emotion entry
 */
export const createEmotionEntry = (name, intensity, quote, timestamp) => ({
  id: `emotion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name,
  intensity,
  quote,
  timestamp
})

/**
 * Create a new life domain entry
 */
export const createLifeDomainEntry = (domain, notes, mentionCount, isPrimary = false) => ({
  id: `domain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  domain,
  notes,
  mentionCount,
  isPrimary
})

/**
 * Create a new intervention entry
 */
export const createInterventionEntry = (type, evidence, confidence) => ({
  id: `intervention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  evidence,
  confidence,
  confirmed: confidence === InterventionConfidence.UNCERTAIN ? null : true
})

/**
 * Create a new clarifying question
 */
export const createClarifyingQuestion = (question, category) => ({
  id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  question,
  category,
  response: null
})

/**
 * Create a new therapist note
 */
export const createTherapistNote = (questionId, note) => ({
  id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  questionId,
  note,
  timestamp: new Date().toISOString()
})
