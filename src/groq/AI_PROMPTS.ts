// AI_PROMPTS.ts - Prompts estructurados y robustos para generaciones con IA

export const AI_PROMPTS = {
  // ==================== EXAMS ====================
  generateExamFromTopic: (topic: string, numberOfQuestions: number, difficulty: string) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfQuestions} multiple choice questions about "${topic}"
    2. Difficulty level: ${difficulty}
    3. Each question MUST have EXACTLY 4 options
    4. EXACTLY ONE option per question must be correct
    5. Questions should test genuine understanding, not just memorization
    6. Distribute question types: 60% conceptual, 30% application, 10% analysis
    
    VALIDATION RULES:
    - "question" field: Clear, unambiguous question ending with "?"
    - "options" array: Exactly 4 objects, each with "text" and "isCorrect"
    - "isCorrect": Boolean, only ONE true per question
    - "explanation": 1-2 sentences explaining why correct answer is right
    
    RETURN ONLY PURE VALID JSON with this EXACT structure:
    {
      "title": "Relevant exam title about ${topic}",
      "description": "Comprehensive exam covering key aspects of ${topic} at ${difficulty} level",
      "totalQuestions": ${numberOfQuestions},
      "estimatedTime": "30-45 minutes",
      "questions": [
        {
          "id": 1,
          "question": "Clear question text?",
          "options": [
            {"id": "A", "text": "Plausible but incorrect option", "isCorrect": false},
            {"id": "B", "text": "Correct option", "isCorrect": true},
            {"id": "C", "text": "Common misconception", "isCorrect": false},
            {"id": "D", "text": "Plausible but incorrect option", "isCorrect": false}
          ],
          "explanation": "Concise explanation of why B is correct",
          "difficulty": "${difficulty}",
          "category": "conceptual|application|analysis"
        }
      ]
    }
    
    DO NOT include markdown, code blocks, or any text outside the JSON.
    The JSON must be parseable by JSON.parse().
  `,

  generateExamFromReference: (referenceText: string, numberOfQuestions: number, difficulty: string) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfQuestions} multiple choice questions based SOLELY on this reference text:
    
    REFERENCE TEXT:
    ${referenceText.substring(0, 2000)} ${referenceText.length > 2000 ? '... [text truncated]' : ''}
    
    2. Difficulty level: ${difficulty}
    3. All questions and answers MUST be directly derived from the reference text
    4. Each question: EXACTLY 4 options, ONE correct answer
    5. Include page/section numbers if reference has them
    
    VALIDATION RULES:
    - Questions must be factually accurate per reference text
    - No external knowledge or assumptions
    - Options should include plausible distractors from the text
    - Explanations should cite the reference text
    
    RETURN ONLY PURE VALID JSON with this EXACT structure:
    {
      "title": "Exam based on provided reference",
      "description": "Questions derived directly from the reference material",
      "totalQuestions": ${numberOfQuestions},
      "sourceFidelity": "high",
      "questions": [
        {
          "id": 1,
          "question": "Question directly from reference?",
          "options": [
            {"id": "A", "text": "Option from text", "isCorrect": false},
            {"id": "B", "text": "Correct option from text", "isCorrect": true},
            {"id": "C", "text": "Misinterpretation of text", "isCorrect": false},
            {"id": "D", "text": "Option from different context", "isCorrect": false}
          ],
          "explanation": "Explanation referencing specific parts of the text",
          "textReference": "Relevant excerpt or section from reference",
          "difficulty": "${difficulty}"
        }
      ]
    }
    
    DO NOT include markdown, code blocks, or any text outside the JSON.
    The JSON must be parseable by JSON.parse().
  `,

  // ==================== NOTES ====================
  generateNoteFromTopic: (topic: string, numberOfNotes: number, levelOfDetail: string) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfNotes} comprehensive study note(s) for "${topic}"
    2. Level of detail: ${levelOfDetail}
    3. Each note should be self-contained and educational
    4. Use hierarchical organization: main concepts → subtopics → details
    5. ${levelOfDetail === 'high' ? 'Include examples, analogies, and applications' : levelOfDetail === 'medium' ? 'Include key concepts and explanations' : 'Focus on essential facts only'}
    
    CONTENT TYPES TO INCLUDE:
    - "text": Paragraph explanations (2-5 sentences)
    - "list": Bullet points for key items, steps, or examples
    - "definition": Key terms with clear definitions
    - "warning": Common mistakes or misconceptions
    - "tip": Study tips or memory aids
    
    RETURN ONLY PURE VALID JSON with this EXACT structure:
    {
      "topic": "${topic}",
      "notes": [
        {
          "id": 1,
          "title": "Clear, descriptive title for this note",
          "contents": [
            {
              "type": "text",
              "content": "Comprehensive explanation of a key concept..."
            },
            {
              "type": "definition",
              "content": "Key term: Definition with context"
            },
            {
              "type": "list",
              "content": ["Important point 1", "Important point 2", "Important point 3"]
            },
            {
              "type": "example",
              "content": "Practical example illustrating the concept"
            },
            {
              "type": "warning",
              "content": "Common misunderstanding to avoid"
            }
          ],
          "tags": ["relevant", "tags", "based", "on", "content"],
          "summary": "One-sentence summary of this note",
          "prerequisites": ["basic concepts needed to understand this note"]
        }
      ],
      "metadata": {
        "levelOfDetail": "${levelOfDetail}",
        "targetAudience": "${levelOfDetail === 'high' ? 'Advanced learners' : levelOfDetail === 'medium' ? 'Intermediate learners' : 'Beginner learners'}",
        "estimatedStudyTime": "${numberOfNotes * 10} minutes"
      }
    }
    
    DO NOT include markdown, code blocks, or any text outside the JSON.
    The JSON must be parseable by JSON.parse().
  `,

  generateNoteFromReference: (referenceText: string, numberOfNotes: number, levelOfDetail: string) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfNotes} organized study note(s) based SOLELY on this reference:
    
    REFERENCE TEXT:
    ${referenceText.substring(0, 3000)} ${referenceText.length > 3000 ? '... [text truncated for processing]' : ''}
    
    2. Level of detail: ${levelOfDetail}
    3. Extract and organize information from the reference text
    4. Preserve the original meaning and context
    5. Group related concepts together logically
    
    STRUCTURE REQUIREMENTS:
    - Identify main themes from the text
    - Extract key concepts, definitions, and examples
    - Note relationships between concepts
    - Highlight important quotes or data points
    
    RETURN ONLY PURE VALID JSON with this EXACT structure:
    {
      "sourceSummary": "Brief description of reference content",
      "notes": [
        {
          "id": 1,
          "title": "Topic extracted from reference",
          "contents": [
            {
              "type": "text",
              "content": "Summary of key idea from reference...",
              "sourceReference": "Relevant part of original text"
            },
            {
              "type": "quote",
              "content": "Important direct quote if applicable",
              "sourceLocation": "Context of quote"
            },
            {
              "type": "list",
              "content": ["Key finding 1", "Key finding 2", "Key finding 3"]
            },
            {
              "type": "connection",
              "content": "How this connects to other parts of the text"
            }
          ],
          "tags": ["extracted", "tags", "from", "reference"],
          "keyTakeaways": ["Main point 1", "Main point 2"],
          "sourceCitations": ["Specific references to original text"]
        }
      ],
      "coverageAnalysis": {
        "topicsCovered": ["List of main topics extracted"],
        "depth": "${levelOfDetail}",
        "completeness": "partial|comprehensive based on text length"
      }
    }
    
    DO NOT include markdown, code blocks, or any text outside the JSON.
    The JSON must be parseable by JSON.parse().
  `,

  // ==================== FLASHCARDS ====================
  generateFlashcardsFromTopic: (topic: string, numberOfCards: number) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfCards} high-quality flashcard pairs about "${topic}"
    2. Difficulty distribution: 30% easy, 50% medium, 20% hard
    3. Cards should test both recall and understanding
    4. Mix card types: definitions, concepts, applications, comparisons
    
    CARD REQUIREMENTS:
    - Front: Clear question or term (max 15 words)
    - Back: Complete, educational answer (50-200 characters)
    - Hint: Genuine memory aid, not just repetition
    - Difficulty: Appropriate for content complexity
    
    RETURN ONLY PURE VALID JSON with this EXACT structure:
    {
      "topic": "${topic}",
      "totalCards": ${numberOfCards},
      "cards": [
        {
          "id": 1,
          "front": "Concise question or concept",
          "back": "Detailed answer that explains, not just states. Include context and why it matters.",
          "difficulty": "easy|medium|hard",
          "hint": "Practical hint that helps recall without giving answer away",
          "category": "definition|concept|application|comparison",
          "tags": ["relevant", "subtopic", "tags"],
          "example": "Optional clarifying example",
          "commonMistakes": ["Typical error 1", "Typical error 2"]
        }
      ],
      "difficultyBreakdown": {
        "easy": Math.round(${numberOfCards} * 0.3),
        "medium": Math.round(${numberOfCards} * 0.5),
        "hard": Math.round(${numberOfCards} * 0.2)
      },
      "studyTips": [
        "Spaced repetition schedule recommendation",
        "How to use these cards effectively"
      ]
    }
    
    DO NOT include markdown, code blocks, or any text outside the JSON.
    The JSON must be parseable by JSON.parse().
  `,

  generateFlashcardsFromReference: (referenceText: string, numberOfCards: number) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfCards} flashcard pairs based SOLELY on this reference:
    
    REFERENCE TEXT:
    ${referenceText.substring(0, 2500)} ${referenceText.length > 2500 ? '... [text truncated]' : ''}
    
    2. Extract key information for effective spaced repetition
    3. Focus on important facts, concepts, and relationships
    4. Ensure cards are testable and unambiguous
    
    EXTRACTION GUIDELINES:
    - Identify key terms and their definitions
    - Extract important facts, dates, numbers
    - Note cause-effect relationships
    - Highlight comparisons and contrasts
    - Capture sequences or processes
    
    RETURN ONLY PURE VALID JSON with this EXACT structure:
    {
      "source": "Reference-based flashcards",
      "totalCards": ${numberOfCards},
      "cards": [
        {
          "id": 1,
          "front": "Key term or question from text",
          "back": "Accurate information directly from reference",
          "difficulty": "easy|medium|hard",
          "hint": "Context clue from the text",
          "textReference": "Specific location in source material",
          "cardType": "fact|definition|relationship|sequence",
          "importance": "high|medium|low based on text emphasis",
          "verification": "Directly verifiable in reference text"
        }
      ],
      "coverage": {
        "keyConceptsCovered": ["List of main concepts"],
        "factualAccuracy": "All cards must be verifiable in source",
        "comprehensiveness": "Coverage of important reference content"
      },
      "sourceIntegrity": {
        "faithfulToSource": true,
        "noExternalKnowledge": true,
        "directQuotes": ["Important quotes if applicable"]
      }
    }
    
    DO NOT include markdown, code blocks, or any text outside the JSON.
    The JSON must be parseable by JSON.parse().
  `,

  // ==================== EDUCATIONAL CHAT ====================
  generateEducationalChatResponse: (userMessage: string, conversationContext?: string) => `
    EDUCATIONAL ASSISTANT INSTRUCTIONS:
    You are an expert educational tutor responding to a student question in an educational chat.
    
    User's question: "${userMessage}"
    
    ${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}
    
    RESPONSE REQUIREMENTS:
    1. Provide clear, accurate, and educational explanations
    2. Use analogies and examples when helpful
    3. Break complex concepts into digestible parts
    4. Encourage critical thinking and deeper understanding
    5. Be supportive and motivating
    6. Correct misconceptions gently
    7. Suggest related topics if relevant
    
    RESPONSE FORMAT - Return as JSON:
    {
      "response": "Your detailed educational response here",
      "keyPoints": ["Important concept 1", "Important concept 2", "Important concept 3"],
      "suggestedFollowUp": "A follow-up question or topic to deepen understanding",
      "difficulty": "beginner|intermediate|advanced based on detected level",
      "relevantTopics": ["Related topic 1", "Related topic 2"]
    }
    
    IMPORTANT: Return ONLY valid JSON, no markdown or additional text.
  `,

  generateChatTitle: (firstMessage: string) => `
    Generate a short, descriptive title (maximum 8 words) for an educational chat based on this first question: "${firstMessage}"
    
    Title requirements:
    - Must be concise and clear
    - Should summarize the main topic
    - Should be engaging for students
    
    Return ONLY the title text, without quotes or additional explanation.
  `,

  // ==================== VALIDATION PROMPT ====================
  validateResponse: (expectedType: 'exam' | 'note' | 'flashcard') => `
    VALIDATION REQUEST:
    I received a response that should be a ${expectedType} in JSON format.
    
    Please validate if this response:
    1. Is valid JSON (parseable by JSON.parse())
    2. Matches the expected structure for ${expectedType}
    3. Contains all required fields
    4. Has correct data types
    5. Meets minimum quality standards
    
    If invalid, provide specific error messages and suggestions for fixing.
    If valid, confirm it meets all requirements.
  `
};

export const RESPONSE_FORMATS = {
  exam: {
    title: 'string',
    description: 'string',
    totalQuestions: 'number',
    questions: [
      {
        id: 'number',
        question: 'string',
        options: [
          { id: 'string', text: 'string', isCorrect: 'boolean' }
        ],
        explanation: 'string',
        difficulty: 'string',
        category: 'string'
      }
    ]
  },
  
  note: {
    topic: 'string',
    notes: [
      {
        id: 'number',
        title: 'string',
        contents: [
          {
            type: 'text|definition|list|example|warning|tip|quote|connection',
            content: 'string|string[]',
            sourceReference: 'string?'
          }
        ],
        tags: 'string[]',
        summary: 'string',
        prerequisites: 'string[]'
      }
    ],
    metadata: {
      levelOfDetail: 'string',
      targetAudience: 'string',
      estimatedStudyTime: 'string'
    }
  },
  
  flashcard: {
    topic: 'string',
    totalCards: 'number',
    cards: [
      {
        id: 'number',
        front: 'string',
        back: 'string',
        difficulty: 'easy|medium|hard',
        hint: 'string',
        category: 'string',
        tags: 'string[]',
        example: 'string?',
        commonMistakes: 'string[]?'
      }
    ],
    difficultyBreakdown: {
      easy: 'number',
      medium: 'number',
      hard: 'number'
    }
  }
};

// Helper para manejo de errores y retry
export const PROMPT_ERROR_HANDLING = {
  retryInstructions: (error: string, originalPrompt: string) => `
    PREVIOUS RESPONSE ERROR: ${error}
    
    PLEASE RETRY with these corrections:
    1. Ensure output is ONLY valid JSON, no markdown
    2. Follow the exact structure specified
    3. Include all required fields
    4. Validate data types are correct
    
    ORIGINAL REQUEST:
    ${originalPrompt.substring(0, 500)}...
    
    Return ONLY the corrected JSON response.
  `,
  
  fallbackPrompt: (type: string) => `
    Simplified ${type} generation request:
    Return minimal valid JSON with basic structure.
    Focus on correctness over completeness if errors persist.
  `
};