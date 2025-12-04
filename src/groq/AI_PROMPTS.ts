// AI_PROMPTS.ts - Prompts estructurados para todas las generaciones con IA

export const AI_PROMPTS = {
  // ==================== EXAMS ====================
  generateExamFromTopic: (topic: string, numberOfQuestions: number, difficulty: string) => `
    Generate exactly ${numberOfQuestions} multiple choice questions about "${topic}" with ${difficulty} difficulty level.
    Return ONLY valid JSON with this exact format (no markdown, no code blocks):
    {
      "title": "Exam Title",
      "description": "Short description of what this exam covers",
      "totalQuestions": ${numberOfQuestions},
      "questions": [
        {
          "question": "Question text here?",
          "options": [
            {"text": "Option A", "isCorrect": false},
            {"text": "Option B", "isCorrect": true},
            {"text": "Option C", "isCorrect": false},
            {"text": "Option D", "isCorrect": false}
          ],
          "explanation": "Why this is correct"
        }
      ]
    }
  `,

  generateExamFromReference: (referenceText: string, numberOfQuestions: number, difficulty: string) => `
    Based on this reference text, generate exactly ${numberOfQuestions} multiple choice questions with ${difficulty} difficulty level:
    
    "${referenceText}"
    
    Return ONLY valid JSON with this exact format (no markdown):
    {
      "title": "Exam Title based on content",
      "description": "Description of what this exam tests",
      "totalQuestions": ${numberOfQuestions},
      "questions": [
        {
          "question": "Question text?",
          "options": [
            {"text": "Option A", "isCorrect": false},
            {"text": "Option B", "isCorrect": true},
            {"text": "Option C", "isCorrect": false},
            {"text": "Option D", "isCorrect": false}
          ],
          "explanation": "Explanation"
        }
      ]
    }
  `,

  // ==================== FLASHCARDS ====================
  generateFlashcardsFromTopic: (topic: string, numberOfCards: number) => `
    Generate exactly ${numberOfCards} flashcard pairs about "${topic}".
    Each card should have varying difficulty levels distributed across easy, medium, and hard.
    Include helpful hints for each card.
    Return ONLY valid JSON with this exact format (no markdown, no code blocks):
    {
      "cards": [
        {"question": "...", "answer": "...", "difficulty": "easy", "hint": "..."},
        {"question": "...", "answer": "...", "difficulty": "medium", "hint": "..."}
      ]
    }
  `,

  generateFlashcardsFromReference: (referenceText: string, numberOfCards: number) => `
    Based on this reference text, generate exactly ${numberOfCards} flashcard pairs with varying difficulty:
    "${referenceText}"
    
    Return ONLY valid JSON with this exact format:
    {
      "cards": [
        {"question": "...", "answer": "...", "difficulty": "easy|medium|hard", "hint": "..."}
      ]
    }
  `,

  // ==================== NOTES ====================
  generateNoteFromTopic: (topic: string) => `
    Create comprehensive study notes for the topic "${topic}". 
    Return ONLY valid JSON with this exact format (no markdown, no code blocks):
    {
      "title": "Topic Title",
      "content": "Detailed notes with structure using line breaks. Include key concepts, explanations, and examples.",
      "tags": ["tag1", "tag2", "tag3"]
    }
  `,

  generateNoteFromReference: (referenceText: string) => `
    Based on this reference text, create organized study notes:
    
    "${referenceText}"
    
    Return ONLY valid JSON with this exact format:
    {
      "title": "Note Title based on content",
      "content": "Organized and summarized study notes",
      "tags": ["tag1", "tag2"]
    }
  `,
};

export const RESPONSE_FORMATS = {
  exam: {
    title: 'string',
    description: 'string',
    totalQuestions: 'number',
    questions: [
      {
        question: 'string',
        options: [
          { text: 'string', isCorrect: 'boolean' }
        ],
        explanation: 'string'
      }
    ]
  },
  flashcard: {
    cards: [
      {
        question: 'string',
        answer: 'string',
        difficulty: 'easy | medium | hard',
        hint: 'string'
      }
    ]
  },
  note: {
    title: 'string',
    content: 'string',
    tags: ['string']
  }
};