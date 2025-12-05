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

  // ==================== NOTES ====================
  generateNoteFromTopic: (topic: string, numberOfNotes: number, levelOfDetail: string) => `
    Generate exactly ${numberOfNotes} comprehensive study note(s) for the topic "${topic}" with ${levelOfDetail} level of detail.
    Return ONLY valid JSON with this exact format (no markdown, no code blocks):
    {
      "notes": [
        {
          "title": "Note Title",
          "contents": [
            {"type": "text", "content": "Detailed paragraph text..."},
            {"type": "list", "content": ["item 1", "item 2", "item 3"]},
            {"type": "text", "content": "More detailed explanation..."}
          ],
          "tags": ["tag1", "tag2", "tag3"]
        }
      ]
    }
  `,

  generateNoteFromReference: (referenceText: string, numberOfNotes: number, levelOfDetail: string) => `
    Based on this reference text, generate exactly ${numberOfNotes} organized study note(s) with ${levelOfDetail} level of detail:
    
    "${referenceText}"
    
    Return ONLY valid JSON with this exact format (no markdown):
    {
      "notes": [
        {
          "title": "Note Title based on content",
          "contents": [
            {"type": "text", "content": "Key concept explanation..."},
            {"type": "list", "content": ["important point 1", "important point 2"]},
            {"type": "text", "content": "Additional details..."}
          ],
          "tags": ["tag1", "tag2"]
        }
      ]
    }
  `,

  // ==================== FLASHCARDS ====================
  generateFlashcardsFromTopic: (topic: string, numberOfCards: number) => `
    Generate exactly ${numberOfCards} flashcard pairs about "${topic}".
    Each card should have varying difficulty levels distributed across easy, medium, and hard.
    Return ONLY valid JSON with this exact format (no markdown, no code blocks):
    {
      "cards": [
        {
          "front": "Question or concept (max 15 words)",
          "back": "Detailed answer (min 50 characters)",
          "difficulty": "easy",
          "hint": "Helpful hint"
        },
        {
          "front": "Another question",
          "back": "Complete answer with explanation",
          "difficulty": "medium",
          "hint": "Hint for this card"
        }
      ]
    }
  `,

  generateFlashcardsFromReference: (referenceText: string, numberOfCards: number) => `
    Based on this reference text, generate exactly ${numberOfCards} flashcard pairs with varying difficulty:
    
    "${referenceText}"
    
    Return ONLY valid JSON with this exact format (no markdown):
    {
      "cards": [
        {
          "front": "Key concept from text",
          "back": "Detailed explanation from the text",
          "difficulty": "easy|medium|hard",
          "hint": "Memory aid based on the text"
        }
      ]
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