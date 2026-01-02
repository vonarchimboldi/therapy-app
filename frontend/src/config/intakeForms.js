/**
 * Intake Form Templates by Practice Type
 *
 * QUICK INTAKE: Used for initial client onboarding (who/what/why)
 * COMPREHENSIVE: Optional deep-dive form therapists can send later
 */

export const INTAKE_FORMS = {
  // QUICK INTAKE FORMS (Initial Onboarding)
  therapy_quick: {
    name: 'Therapy Intake Form',
    description: 'Quick intake to get started',
    type: 'quick',
    sections: [
      {
        id: 'basic_info',
        title: 'Basic Information',
        fields: [
          { id: 'preferred_name', label: 'Preferred Name', type: 'text', required: true },
          { id: 'pronouns', label: 'Pronouns', type: 'select', options: ['he/him', 'she/her', 'they/them', 'other', 'prefer not to say'], required: false },
          { id: 'age', label: 'Age', type: 'text', required: true },
          { id: 'occupation', label: 'Occupation', type: 'text', required: false },
          { id: 'phone', label: 'Phone Number', type: 'text', required: false },
        ]
      },
      {
        id: 'presenting_concerns',
        title: 'What Brings You Here',
        fields: [
          { id: 'primary_concern', label: 'What is the main reason you are seeking therapy?', type: 'textarea', required: true, placeholder: 'Please describe in your own words...' },
          { id: 'concern_duration', label: 'How long have you been experiencing this?', type: 'select', options: ['Less than a month', '1-3 months', '3-6 months', '6-12 months', '1-2 years', 'More than 2 years', 'As long as I can remember'], required: true },
          { id: 'therapy_goals', label: 'What would you like to achieve in therapy?', type: 'textarea', required: true, placeholder: 'What would success look like for you?' },
          { id: 'previous_therapy', label: 'Have you been in therapy before?', type: 'radio', options: ['Yes', 'No'], required: false },
          { id: 'urgent_concerns', label: 'Are you currently in crisis or experiencing urgent safety concerns?', type: 'radio', options: ['Yes', 'No'], required: true },
          { id: 'urgent_details', label: 'Please describe', type: 'textarea', required: false, conditional: { field: 'urgent_concerns', value: 'Yes' } }
        ]
      },
      {
        id: 'practical_info',
        title: 'Practical Information',
        fields: [
          { id: 'session_frequency', label: 'How often would you like to meet?', type: 'select', options: ['Weekly', 'Every 2 weeks', 'Monthly', 'Not sure'], required: false },
          { id: 'preferred_times', label: 'Preferred times for sessions', type: 'checkbox', options: ['Mornings', 'Midday', 'Afternoons', 'Evenings', 'Weekends'], required: false },
          { id: 'additional_info', label: 'Anything else you want your therapist to know?', type: 'textarea', required: false }
        ]
      }
    ]
  },

  training_quick: {
    name: 'Training Intake Form',
    description: 'Quick fitness intake',
    type: 'quick',
    sections: [
      {
        id: 'basic_info',
        title: 'Basic Information',
        fields: [
          { id: 'preferred_name', label: 'Preferred Name', type: 'text', required: true },
          { id: 'age', label: 'Age', type: 'text', required: true },
          { id: 'phone', label: 'Phone Number', type: 'text', required: true },
        ]
      },
      {
        id: 'fitness_goals',
        title: 'Your Goals',
        fields: [
          { id: 'primary_goal', label: 'What is your primary fitness goal?', type: 'textarea', required: true },
          { id: 'timeline', label: 'What is your timeline?', type: 'select', options: ['1-3 months', '3-6 months', '6-12 months', 'Ongoing'], required: false },
          { id: 'current_activity', label: 'Current activity level', type: 'select', options: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'], required: true },
          { id: 'injuries', label: 'Any current or past injuries?', type: 'textarea', required: false },
          { id: 'doctor_clearance', label: 'Has your doctor cleared you for exercise?', type: 'radio', options: ['Yes', 'No', 'N/A - no restrictions'], required: true },
        ]
      },
      {
        id: 'schedule',
        title: 'Schedule',
        fields: [
          { id: 'available_days', label: 'Days available for training', type: 'checkbox', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: false },
          { id: 'session_frequency', label: 'Desired training frequency', type: 'select', options: ['1x per week', '2x per week', '3x per week', '4+ per week'], required: false },
        ]
      }
    ]
  },

  tutoring_quick: {
    name: 'Tutoring Intake Form',
    description: 'Quick academic intake',
    type: 'quick',
    sections: [
      {
        id: 'basic_info',
        title: 'Basic Information',
        fields: [
          { id: 'student_name', label: 'Student Name', type: 'text', required: true },
          { id: 'grade_level', label: 'Current Grade Level', type: 'select', options: ['Elementary (K-5)', 'Middle School (6-8)', 'High School (9-12)', 'College'], required: true },
          { id: 'parent_name', label: 'Parent/Guardian Name', type: 'text', required: false },
          { id: 'parent_contact', label: 'Parent/Guardian Phone', type: 'text', required: false }
        ]
      },
      {
        id: 'academic_needs',
        title: 'Academic Needs',
        fields: [
          { id: 'subjects', label: 'Which subjects need support?', type: 'checkbox', options: ['Math', 'Science', 'English', 'History', 'Foreign Language', 'Test Prep', 'Other'], required: true },
          { id: 'specific_topics', label: 'Specific topics or areas of difficulty', type: 'textarea', required: true },
          { id: 'goals', label: 'What are your academic goals?', type: 'textarea', required: true },
          { id: 'upcoming_tests', label: 'Any upcoming tests or deadlines?', type: 'textarea', required: false }
        ]
      },
      {
        id: 'schedule',
        title: 'Schedule',
        fields: [
          { id: 'available_days', label: 'Available days', type: 'checkbox', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: false },
          { id: 'session_frequency', label: 'Desired frequency', type: 'select', options: ['1x per week', '2x per week', '3+ per week'], required: false },
        ]
      }
    ]
  },

  freelance_quick: {
    name: 'Project Intake Form',
    description: 'Quick project intake',
    type: 'quick',
    sections: [
      {
        id: 'basic_info',
        title: 'Basic Information',
        fields: [
          { id: 'company_name', label: 'Company/Organization Name', type: 'text', required: true },
          { id: 'contact_person', label: 'Primary Contact Person', type: 'text', required: true },
          { id: 'email', label: 'Email', type: 'text', required: true },
          { id: 'website', label: 'Website', type: 'text', required: false }
        ]
      },
      {
        id: 'project_details',
        title: 'Project Overview',
        fields: [
          { id: 'project_type', label: 'Type of project', type: 'text', required: true, placeholder: 'Website, app, consulting, design...' },
          { id: 'project_description', label: 'Describe your project', type: 'textarea', required: true },
          { id: 'goals', label: 'What are your goals for this project?', type: 'textarea', required: true },
          { id: 'timeline', label: 'Desired timeline', type: 'select', options: ['ASAP', '2-4 weeks', '1-2 months', '2-3 months', 'Flexible'], required: true },
          { id: 'budget', label: 'Budget range', type: 'select', options: ['< $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000+', 'Not sure'], required: false }
        ]
      }
    ]
  },

  // COMPREHENSIVE FORMS (Optional deep-dive - kept for reference but not used in initial intake)
  therapy_comprehensive: {
    name: 'Comprehensive Therapy Assessment',
    description: 'In-depth clinical history and background',
    type: 'comprehensive',
    sections: [
      {
        id: 'mental_health_history',
        title: 'Mental Health History',
        fields: [
          { id: 'previous_diagnoses', label: 'Have you been diagnosed with any mental health conditions?', type: 'textarea', required: false },
          { id: 'current_medications', label: 'Current medications', type: 'textarea', required: false },
          { id: 'hospitalizations', label: 'Any psychiatric hospitalizations?', type: 'radio', options: ['Yes', 'No'], required: false },
          { id: 'substance_use', label: 'Do you use alcohol or other substances?', type: 'select', options: ['Never', 'Occasionally', 'Regularly', 'Daily'], required: false },
          { id: 'self_harm', label: 'History of self-harm?', type: 'radio', options: ['Yes', 'No', 'Prefer not to say'], required: false },
          { id: 'suicidal_thoughts', label: 'Have you experienced thoughts of ending your life?', type: 'radio', options: ['Never', 'In the past', 'Recently', 'Currently'], required: false },
          { id: 'family_mental_health', label: 'Family history of mental health issues?', type: 'textarea', required: false }
        ]
      },
      {
        id: 'life_history',
        title: 'Life History & Background',
        fields: [
          { id: 'childhood', label: 'Tell us about your childhood and family', type: 'textarea', required: false },
          { id: 'trauma_history', label: 'Have you experienced trauma?', type: 'textarea', required: false },
          { id: 'relationship_history', label: 'Relationship history', type: 'textarea', required: false },
          { id: 'significant_events', label: 'Major life events or transitions', type: 'textarea', required: false }
        ]
      },
      {
        id: 'current_life',
        title: 'Current Life Situation',
        fields: [
          { id: 'support_system', label: 'Who do you have for support?', type: 'textarea', required: false },
          { id: 'coping_strategies', label: 'What do you do to cope with stress?', type: 'textarea', required: false },
          { id: 'strengths', label: 'What are your strengths?', type: 'textarea', required: false },
          { id: 'sleep_patterns', label: 'How would you describe your sleep?', type: 'select', options: ['Good', 'Fair', 'Poor', 'Very poor'], required: false }
        ]
      }
    ]
  }
}

export const getIntakeFormByPracticeType = (practiceType, formType = 'quick') => {
  const key = `${practiceType}_${formType}`
  return INTAKE_FORMS[key] || INTAKE_FORMS[`${practiceType}_quick`] || INTAKE_FORMS.therapy_quick
}

// Helper to get quick intake form
export const getQuickIntakeForm = (practiceType) => {
  return getIntakeFormByPracticeType(practiceType, 'quick')
}

// Helper to get comprehensive form
export const getComprehensiveForm = (practiceType) => {
  return getIntakeFormByPracticeType(practiceType, 'comprehensive')
}
