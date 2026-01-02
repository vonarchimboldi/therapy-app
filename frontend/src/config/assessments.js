/**
 * Assessment & Quiz Library
 *
 * Includes validated assessment tools and personality quizzes
 */

export const ASSESSMENTS = {
  'big-five': {
    id: 'big-five',
    name: 'Big Five Personality Assessment',
    description: 'Measures five major dimensions of personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism',
    category: 'personality',
    estimatedMinutes: 10,
    scales: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
    questions: [
      // Extraversion
      { id: 'bf1', text: 'I am the life of the party', scale: 'Extraversion', reverse: false },
      { id: 'bf2', text: 'I feel comfortable around people', scale: 'Extraversion', reverse: false },
      { id: 'bf3', text: 'I start conversations', scale: 'Extraversion', reverse: false },
      { id: 'bf4', text: 'I talk to a lot of different people at parties', scale: 'Extraversion', reverse: false },
      { id: 'bf5', text: 'I don\'t talk a lot', scale: 'Extraversion', reverse: true },
      { id: 'bf6', text: 'I keep in the background', scale: 'Extraversion', reverse: true },

      // Agreeableness
      { id: 'bf7', text: 'I feel others\' emotions', scale: 'Agreeableness', reverse: false },
      { id: 'bf8', text: 'I am interested in people', scale: 'Agreeableness', reverse: false },
      { id: 'bf9', text: 'I make people feel at ease', scale: 'Agreeableness', reverse: false },
      { id: 'bf10', text: 'I have a soft heart', scale: 'Agreeableness', reverse: false },
      { id: 'bf11', text: 'I am not interested in other people\'s problems', scale: 'Agreeableness', reverse: true },
      { id: 'bf12', text: 'I insult people', scale: 'Agreeableness', reverse: true },

      // Conscientiousness
      { id: 'bf13', text: 'I am always prepared', scale: 'Conscientiousness', reverse: false },
      { id: 'bf14', text: 'I pay attention to details', scale: 'Conscientiousness', reverse: false },
      { id: 'bf15', text: 'I get chores done right away', scale: 'Conscientiousness', reverse: false },
      { id: 'bf16', text: 'I like order', scale: 'Conscientiousness', reverse: false },
      { id: 'bf17', text: 'I leave my belongings around', scale: 'Conscientiousness', reverse: true },
      { id: 'bf18', text: 'I make a mess of things', scale: 'Conscientiousness', reverse: true },

      // Neuroticism
      { id: 'bf19', text: 'I get stressed out easily', scale: 'Neuroticism', reverse: false },
      { id: 'bf20', text: 'I worry about things', scale: 'Neuroticism', reverse: false },
      { id: 'bf21', text: 'I am easily disturbed', scale: 'Neuroticism', reverse: false },
      { id: 'bf22', text: 'I get upset easily', scale: 'Neuroticism', reverse: false },
      { id: 'bf23', text: 'I am relaxed most of the time', scale: 'Neuroticism', reverse: true },
      { id: 'bf24', text: 'I seldom feel blue', scale: 'Neuroticism', reverse: true },

      // Openness
      { id: 'bf25', text: 'I have a rich vocabulary', scale: 'Openness', reverse: false },
      { id: 'bf26', text: 'I have a vivid imagination', scale: 'Openness', reverse: false },
      { id: 'bf27', text: 'I have excellent ideas', scale: 'Openness', reverse: false },
      { id: 'bf28', text: 'I spend time reflecting on things', scale: 'Openness', reverse: false },
      { id: 'bf29', text: 'I have difficulty understanding abstract ideas', scale: 'Openness', reverse: true },
      { id: 'bf30', text: 'I am not interested in abstract ideas', scale: 'Openness', reverse: true }
    ],
    responseOptions: [
      { value: 1, label: 'Strongly Disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Agree' },
      { value: 5, label: 'Strongly Agree' }
    ]
  },

  'attachment-style': {
    id: 'attachment-style',
    name: 'Attachment Style Assessment',
    description: 'Identifies your attachment patterns in relationships: Secure, Anxious, Avoidant, or Fearful',
    category: 'personality',
    estimatedMinutes: 5,
    scales: ['Secure', 'Anxious', 'Avoidant', 'Fearful'],
    questions: [
      // Secure
      { id: 'as1', text: 'I find it easy to get close to others', scale: 'Secure', reverse: false },
      { id: 'as2', text: 'I am comfortable depending on others and having others depend on me', scale: 'Secure', reverse: false },
      { id: 'as3', text: 'I don\'t worry about being alone or others not accepting me', scale: 'Secure', reverse: false },
      { id: 'as4', text: 'I am comfortable expressing my needs and emotions', scale: 'Secure', reverse: false },

      // Anxious
      { id: 'as5', text: 'I worry that others don\'t really love me', scale: 'Anxious', reverse: false },
      { id: 'as6', text: 'I often worry that my partner will leave me', scale: 'Anxious', reverse: false },
      { id: 'as7', text: 'I need a lot of reassurance that I am loved', scale: 'Anxious', reverse: false },
      { id: 'as8', text: 'I find that others are reluctant to get as close as I would like', scale: 'Anxious', reverse: false },
      { id: 'as9', text: 'I worry that I want to merge completely with someone and this may scare them away', scale: 'Anxious', reverse: false },

      // Avoidant
      { id: 'as10', text: 'I am comfortable without close emotional relationships', scale: 'Avoidant', reverse: false },
      { id: 'as11', text: 'It is very important to me to feel independent and self-sufficient', scale: 'Avoidant', reverse: false },
      { id: 'as12', text: 'I prefer not to depend on others or have others depend on me', scale: 'Avoidant', reverse: false },
      { id: 'as13', text: 'I am nervous when anyone gets too close', scale: 'Avoidant', reverse: false },
      { id: 'as14', text: 'I find it difficult to trust others completely', scale: 'Avoidant', reverse: false },

      // Fearful
      { id: 'as15', text: 'I want emotionally close relationships but find it difficult to trust or depend on others', scale: 'Fearful', reverse: false },
      { id: 'as16', text: 'I worry that I will be hurt if I allow myself to become too close to others', scale: 'Fearful', reverse: false },
      { id: 'as17', text: 'I want to be close to others but I feel uncomfortable being vulnerable', scale: 'Fearful', reverse: false },
      { id: 'as18', text: 'I find myself pulling away when relationships start to get close', scale: 'Fearful', reverse: false }
    ],
    responseOptions: [
      { value: 1, label: 'Not at all like me' },
      { value: 2, label: 'Slightly like me' },
      { value: 3, label: 'Somewhat like me' },
      { value: 4, label: 'Very much like me' },
      { value: 5, label: 'Exactly like me' }
    ]
  },

  'phq-9': {
    id: 'phq-9',
    name: 'PHQ-9 Depression Screening',
    description: 'Patient Health Questionnaire - screens for depression severity',
    category: 'clinical',
    estimatedMinutes: 3,
    clinicalTool: true,
    scales: ['Depression'],
    scoringRanges: [
      { min: 0, max: 4, label: 'Minimal', severity: 'none' },
      { min: 5, max: 9, label: 'Mild', severity: 'mild' },
      { min: 10, max: 14, label: 'Moderate', severity: 'moderate' },
      { min: 15, max: 19, label: 'Moderately Severe', severity: 'moderate-severe' },
      { min: 20, max: 27, label: 'Severe', severity: 'severe' }
    ],
    instructions: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    questions: [
      { id: 'phq1', text: 'Little interest or pleasure in doing things', scale: 'Depression' },
      { id: 'phq2', text: 'Feeling down, depressed, or hopeless', scale: 'Depression' },
      { id: 'phq3', text: 'Trouble falling or staying asleep, or sleeping too much', scale: 'Depression' },
      { id: 'phq4', text: 'Feeling tired or having little energy', scale: 'Depression' },
      { id: 'phq5', text: 'Poor appetite or overeating', scale: 'Depression' },
      { id: 'phq6', text: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down', scale: 'Depression' },
      { id: 'phq7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television', scale: 'Depression' },
      { id: 'phq8', text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual', scale: 'Depression' },
      { id: 'phq9', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', scale: 'Depression' }
    ],
    responseOptions: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },

  'gad-7': {
    id: 'gad-7',
    name: 'GAD-7 Anxiety Screening',
    description: 'Generalized Anxiety Disorder - screens for anxiety severity',
    category: 'clinical',
    estimatedMinutes: 3,
    clinicalTool: true,
    scales: ['Anxiety'],
    scoringRanges: [
      { min: 0, max: 4, label: 'Minimal', severity: 'none' },
      { min: 5, max: 9, label: 'Mild', severity: 'mild' },
      { min: 10, max: 14, label: 'Moderate', severity: 'moderate' },
      { min: 15, max: 21, label: 'Severe', severity: 'severe' }
    ],
    instructions: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    questions: [
      { id: 'gad1', text: 'Feeling nervous, anxious, or on edge', scale: 'Anxiety' },
      { id: 'gad2', text: 'Not being able to stop or control worrying', scale: 'Anxiety' },
      { id: 'gad3', text: 'Worrying too much about different things', scale: 'Anxiety' },
      { id: 'gad4', text: 'Trouble relaxing', scale: 'Anxiety' },
      { id: 'gad5', text: 'Being so restless that it is hard to sit still', scale: 'Anxiety' },
      { id: 'gad6', text: 'Becoming easily annoyed or irritable', scale: 'Anxiety' },
      { id: 'gad7', text: 'Feeling afraid, as if something awful might happen', scale: 'Anxiety' }
    ],
    responseOptions: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },

  'masculine-archetypes': {
    id: 'masculine-archetypes',
    name: 'Four Masculine Archetypes',
    description: 'Assesses expression of King, Warrior, Magician, and Lover archetypes (Moore & Gillette)',
    category: 'personality',
    estimatedMinutes: 8,
    scales: ['King', 'Warrior', 'Magician', 'Lover'],
    questions: [
      // King
      { id: 'ma1', text: 'I take responsibility for creating order in my life and work', scale: 'King', reverse: false },
      { id: 'ma2', text: 'I am comfortable making important decisions', scale: 'King', reverse: false },
      { id: 'ma3', text: 'I bless and empower others to reach their potential', scale: 'King', reverse: false },
      { id: 'ma4', text: 'I see the big picture and can envision the future', scale: 'King', reverse: false },
      { id: 'ma5', text: 'I create structures and boundaries that serve the greater good', scale: 'King', reverse: false },
      { id: 'ma6', text: 'I struggle with indecision or giving my power away', scale: 'King', reverse: true },

      // Warrior
      { id: 'ma7', text: 'I set clear goals and follow through with discipline', scale: 'Warrior', reverse: false },
      { id: 'ma8', text: 'I can detach emotionally when action is needed', scale: 'Warrior', reverse: false },
      { id: 'ma9', text: 'I stand up for what I believe in, even when it\'s difficult', scale: 'Warrior', reverse: false },
      { id: 'ma10', text: 'I have strong personal boundaries', scale: 'Warrior', reverse: false },
      { id: 'ma11', text: 'I am strategic and tactical in pursuing my objectives', scale: 'Warrior', reverse: false },
      { id: 'ma12', text: 'I avoid confrontation and have difficulty saying no', scale: 'Warrior', reverse: true },

      // Magician
      { id: 'ma13', text: 'I enjoy learning and mastering new skills', scale: 'Magician', reverse: false },
      { id: 'ma14', text: 'I can see patterns and connections others miss', scale: 'Magician', reverse: false },
      { id: 'ma15', text: 'I value knowledge and understanding', scale: 'Magician', reverse: false },
      { id: 'ma16', text: 'I am comfortable with ritual, symbolism, and the unseen', scale: 'Magician', reverse: false },
      { id: 'ma17', text: 'I use knowledge to transform myself and help others', scale: 'Magician', reverse: false },
      { id: 'ma18', text: 'I avoid deep reflection or study', scale: 'Magician', reverse: true },

      // Lover
      { id: 'ma19', text: 'I am passionate about life and my pursuits', scale: 'Lover', reverse: false },
      { id: 'ma20', text: 'I deeply appreciate beauty, art, music, and nature', scale: 'Lover', reverse: false },
      { id: 'ma21', text: 'I feel emotions deeply and can connect with others\' feelings', scale: 'Lover', reverse: false },
      { id: 'ma22', text: 'I value sensory experience and being fully present', scale: 'Lover', reverse: false },
      { id: 'ma23', text: 'I connect easily with my body and physical pleasure', scale: 'Lover', reverse: false },
      { id: 'ma24', text: 'I feel disconnected from my emotions or body', scale: 'Lover', reverse: true }
    ],
    responseOptions: [
      { value: 1, label: 'Not like me' },
      { value: 2, label: 'Slightly like me' },
      { value: 3, label: 'Somewhat like me' },
      { value: 4, label: 'Very much like me' },
      { value: 5, label: 'Extremely like me' }
    ]
  }
}

/**
 * Calculate scores for an assessment
 */
export const calculateAssessmentScore = (assessmentId, responses) => {
  const assessment = ASSESSMENTS[assessmentId]
  if (!assessment) return null

  const scores = {}

  // Initialize scale scores
  assessment.scales.forEach(scale => {
    scores[scale] = { raw: 0, count: 0, average: 0 }
  })

  // Calculate scores
  assessment.questions.forEach(question => {
    const response = responses[question.id]
    if (response !== undefined && response !== null) {
      const scale = question.scale
      let value = response

      // Handle reverse scoring
      if (question.reverse) {
        const maxValue = Math.max(...assessment.responseOptions.map(opt => opt.value))
        const minValue = Math.min(...assessment.responseOptions.map(opt => opt.value))
        value = maxValue + minValue - response
      }

      scores[scale].raw += value
      scores[scale].count += 1
    }
  })

  // Calculate averages and percentages
  assessment.scales.forEach(scale => {
    if (scores[scale].count > 0) {
      scores[scale].average = scores[scale].raw / scores[scale].count

      // For clinical tools (PHQ-9, GAD-7), also provide severity interpretation
      if (assessment.clinicalTool && assessment.scoringRanges) {
        const totalScore = scores[scale].raw
        const range = assessment.scoringRanges.find(
          r => totalScore >= r.min && totalScore <= r.max
        )
        scores[scale].severity = range ? range.severity : 'unknown'
        scores[scale].label = range ? range.label : 'Unknown'
      } else {
        // For personality assessments, convert to percentage
        const maxPossible = scores[scale].count * Math.max(...assessment.responseOptions.map(opt => opt.value))
        scores[scale].percentage = Math.round((scores[scale].raw / maxPossible) * 100)
      }
    }
  })

  return {
    assessmentId,
    assessmentName: assessment.name,
    completedAt: new Date().toISOString(),
    scores,
    responses
  }
}

/**
 * Get assessment by ID
 */
export const getAssessmentById = (id) => {
  return ASSESSMENTS[id]
}

/**
 * Get all assessments by category
 */
export const getAssessmentsByCategory = (category) => {
  return Object.values(ASSESSMENTS).filter(a => a.category === category)
}

/**
 * Get all clinical screening tools
 */
export const getClinicalScreeningTools = () => {
  return Object.values(ASSESSMENTS).filter(a => a.clinicalTool === true)
}
