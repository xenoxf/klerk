// AI_PROMPTS.ts - Prompts estructurados y robustos para generaciones con IA

export const AI_PROMPTS = {
  // ==================== EXAMS ====================
  generateExamFromTopic: (topic: string, numberOfQuestions: number, difficulty: string) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfQuestions} multiple choice questions about "${topic}"
    2. Difficulty level: ${difficulty}
    3. Each question MUST have EXACTLY 4 options
    4. EXACTLY ONE option per question must be correct
    5. Distribute question types: 60% conceptual, 30% application, 10% analysis
    6. USE MARKDOWN FORMATTING in all text content for rich formatting
    7. Include **bold**, *italic*, \`code\`, lists, and other markdown as needed
    8. Make content educational and visually clear with markdown
    9. BE CREATIVE with responses - vary question styles, use real-world examples, include scenarios
    10. Calculate estimated time dynamically based on TOPIC and DIFFICULTY:
       - Basic topics (arithmetic, vocabulary, simple concepts): ${difficulty === 'easy' ? '5-10 min' : difficulty === 'medium' ? '10-15 min' : '15-20 min'}
       - Intermediate topics (algebra, history, biology): ${difficulty === 'easy' ? '10-15 min' : difficulty === 'medium' ? '15-25 min' : '25-35 min'}
       - Advanced topics (calculus, physics, advanced chemistry): ${difficulty === 'easy' ? '15-20 min' : difficulty === 'medium' ? '25-35 min' : '40-60 min'}
    
    TOPIC ANALYSIS FOR TIME ESTIMATION:
    - Geometry/Math topics: Quick reading, calculation time needed
    - Literature/History: More reading, comprehension, recall time
    - Science/Physics: Analysis, problem-solving time
    - Technical topics: Deep understanding, complex scenarios
    
    CREATIVITY REQUIREMENTS:
    - Vary question formats: direct questions, scenario-based, analytical, practical applications
    - Include real-world examples and case studies
    - Mix question difficulty within the exam
    - Use creative distractors that test common misconceptions
    - Include "trick" questions that require careful reading
    - Create interesting scenarios and contexts
    
    MARKDOWN USAGE REQUIREMENTS:
    - **Bold** for important terms and keywords
    - *Italic* for emphasis and definitions
    - \`code\` for technical terms, formulas, or code snippets
    - > Blockquotes for important notes or tips
    - Lists with - or * for key points
    - Headers with # for section organization
    - Links [text](url) if references are needed
    - **Tables** for comparisons if applicable
    
    RETURN ONLY PURE VALID JSON with MARKDOWN in content:
    {
      "title": "**Exam: ${topic}** - ${difficulty} Level",
      "description": "Comprehensive exam covering **key aspects** of *${topic}* at ${difficulty} difficulty. Test your knowledge with **real-world scenarios** and **creative questions**.",
      "totalQuestions": ${numberOfQuestions},
      "estimatedTime": "CALCULATE BASED ON TOPIC AND DIFFICULTY - varies from 5-60 minutes",
      "topicDifficulty": {
        "topic": "${topic}",
        "difficultyLevel": "${difficulty}",
        "estimationBasis": "Calculated from topic complexity and question difficulty"
      },
      "questions": [
        {
          "id": 1,
          "question": "**What is...?** *Clear, unambiguous question ending with ?* OR **Scenario-based:** Real-world situation requiring analysis",
          "options": [
            {"id": "A", "text": "**Option A:** Creative distractor with *plausible context*", "isCorrect": false},
            {"id": "B", "text": "**Option B:** Correct answer with \`technical detail\` or *real-world application*", "isCorrect": true},
            {"id": "C", "text": "**Option C:** Common misconception - *teach through error*", "isCorrect": false},
            {"id": "D", "text": "**Option D:** Plausible but incorrect, *tests careful reading*", "isCorrect": false}
          ],
          "explanation": "**Why B is correct:** Detailed markdown explanation with **emphasis**, *italics*, \`code blocks\`, **practical examples**, and references to key concepts. Include: why this answer is correct, why others are wrong, real-world application.",
          "difficulty": "${difficulty}",
          "category": "conceptual|application|analysis",
          "creativeElement": "Includes scenario, real-world context, or unconventional approach"
        }
      ]
    }
    
    CREATIVITY GUIDELINES:
    ✓ Mix question types: direct, scenario-based, analytical, practical
    ✓ Include real-world examples and applications
    ✓ Use creative scenarios that engage students
    ✓ Create misconception-based distractors that teach
    ✓ Vary reading difficulty within appropriate level
    ✓ Include "aha moment" questions that require insight
    ✓ Use analogies and comparisons in explanations
    ✓ Reference relevant contexts and industries
    
    TIME ESTIMATION FORMULA:
    - Base time per question: 1-3 minutes
    - Easy: 1-1.5 min per question
    - Medium: 2-2.5 min per question
    - Hard: 2.5-3 min per question
    - Multiply by number of questions and add difficulty multiplier
    - Final time = (questions × time_per_question) × topic_complexity_factor
    
    The JSON must be VALID and parseable by JSON.parse().
    All content should be enriched with markdown formatting and creative scenarios.
  `,

  generateExamFromReference: (referenceText: string, numberOfQuestions: number, difficulty: string) => `
    CRITICAL INSTRUCTIONS - STRICT FORMAT REQUIREMENTS:
    1. Generate EXACTLY ${numberOfQuestions} multiple choice questions based SOLELY on this reference text
    2. Difficulty level: ${difficulty}
    3. All questions and answers MUST be directly derived from the reference text
    4. Each question: EXACTLY 4 options, ONE correct answer
    5. USE MARKDOWN FORMATTING to enhance readability and structure
    6. Include **bold** for key concepts, *italic* for emphasis, \`code\` for technical terms
    7. Use > blockquotes for important reference excerpts
    
    REFERENCE TEXT:
    ${referenceText.substring(0, 2000)} ${referenceText.length > 2000 ? '... [text truncated]' : ''}
    
    MARKDOWN FORMATTING IN RESPONSE:
    - **Bold** for key terms from the reference
    - *Italic* for emphasis and important concepts
    - \`code\` for technical terms or formulas
    - > Blockquotes for direct quotes or important excerpts
    - Links [text](url) if available
    
    RETURN ONLY PURE VALID JSON with MARKDOWN in content:
    {
      "title": "**Exam:** Based on Reference Material - ${difficulty} Level",
      "description": "**Questions derived directly** from the *provided reference text*",
      "totalQuestions": ${numberOfQuestions},
      "sourceFidelity": "high",
      "questions": [
        {
          "id": 1,
          "question": "**Question directly from reference?** *Clear and unambiguous*",
          "options": [
            {"id": "A", "text": "**Option A:** Description with *reference context*", "isCorrect": false},
            {"id": "B", "text": "**Option B:** Correct option from text", "isCorrect": true},
            {"id": "C", "text": "**Option C:** Common misinterpretation - *avoid*", "isCorrect": false},
            {"id": "D", "text": "**Option D:** Option from different context", "isCorrect": false}
          ],
          "explanation": "**Explanation:** Detailed markdown explanation with *emphasis* and references to **specific parts** of the text",
          "textReference": "> Relevant excerpt or section from reference",
          "difficulty": "${difficulty}"
        }
      ]
    }
    
    The JSON must be VALID and parseable by JSON.parse().
    Enrich all content with markdown formatting.
  `,

  // ==================== NOTES ====================
  generateNoteFromTopic: (topic: string, numberOfNotes: number, levelOfDetail: string) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfNotes} comprehensive study note(s) for "${topic}"
    2. Level of detail: ${levelOfDetail}
    3. Each note should be self-contained and educational
    4. Use hierarchical organization: main concepts -> subtopics -> details
    5. ${levelOfDetail === 'high' ? 'Include examples, analogies, and applications' : levelOfDetail === 'medium' ? 'Include key concepts and explanations' : 'Focus on essential facts only'}
    6. USE MARKDOWN FORMATTING in all text content (**bold**, *italic*, \`code\`, lists, headers, etc.)
    
    CONTENT TYPES WITH MARKDOWN:
    - "text": Paragraph with **bold**, *italic*, and markdown formatting
    - "list": Markdown lists with - or * for key items
    - "definition": **Term:** *Definition with context and emphasis*
    - "warning": > **Warning:** Important cautions with markdown
    - "tip": > **Tip:** Study tips and memory aids with markdown
    - "code": \`\`\`language code blocks\`\`\`
    
    MARKDOWN FORMATTING ENCOURAGED:
    - Use **bold** for key concepts
    - Use *italic* for emphasis
    - Use \`code\` for technical terms
    - Use # Headers, ## Subheaders
    - Use > Blockquotes for important points
    - Use - Lists for bullet points
    
    RETURN ONLY PURE VALID JSON with MARKDOWN in content:
    {
      "topic": "${topic}",
      "notes": [
        {
          "id": 1,
          "title": "# **Main Concept Title**",
          "contents": [
            {
              "type": "text",
              "content": "Comprehensive explanation with **key terms**, *emphasis*, and \`code\` where applicable..."
            },
            {
              "type": "definition",
              "content": "**Key Term:** *Clear definition with context and examples*"
            },
            {
              "type": "list",
              "content": "- Important point 1\\n- Important point 2\\n- Important point 3"
            },
            {
              "type": "example",
              "content": "**Example:** \`\`\`code\\nExample code or scenario\\n\`\`\`"
            },
            {
              "type": "warning",
              "content": "> **⚠️ Warning:** *Common mistake to avoid with emphasis*"
            },
            {
              "type": "tip",
              "content": "> **💡 Tip:** **Memory aid** with *important details*"
            }
          ],
          "tags": ["relevant", "tags", "based", "on", "content"],
          "summary": "**Brief summary** with *key emphasis* - one sentence",
          "prerequisites": ["**Basic concept 1**", "*Foundational knowledge 2*"]
        }
      ],
      "metadata": {
        "levelOfDetail": "${levelOfDetail}",
        "targetAudience": "${levelOfDetail === 'high' ? 'Advanced learners' : levelOfDetail === 'medium' ? 'Intermediate learners' : 'Beginner learners'}",
        "estimatedStudyTime": "${numberOfNotes * 10} minutes"
      }
    }
    
    The JSON must be VALID and parseable by JSON.parse().
    All text content should be enriched with markdown formatting for better readability.
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
    6. USE MARKDOWN FORMATTING for rich text (**bold**, *italic*, \`code\`, > blockquotes, etc.)
    
    STRUCTURE REQUIREMENTS:
    - Identify main themes from the text
    - Extract key concepts, definitions, and examples with markdown
    - Note relationships between concepts
    - Highlight important quotes or data points
    - Use markdown formatting for emphasis and organization
    
    MARKDOWN FORMATTING:
    - **Bold** for key terms from reference
    - *Italic* for emphasis
    - \`code\` for technical terms
    - > Blockquotes for important excerpts
    - # Headers for organization
    
    RETURN ONLY PURE VALID JSON with MARKDOWN in content:
    {
      "sourceSummary": "**Brief description** of *reference content*",
      "notes": [
        {
          "id": 1,
          "title": "## **Topic extracted from reference**",
          "contents": [
            {
              "type": "text",
              "content": "**Summary** of *key idea* from reference with markdown formatting...",
              "sourceReference": "Relevant part of original text"
            },
            {
              "type": "quote",
              "content": "> **Important quote** if applicable with *emphasis*",
              "sourceLocation": "Context of quote"
            },
            {
              "type": "list",
              "content": "- **Key finding 1**\\n- *Key finding 2*\\n- \`Key finding 3\`"
            },
            {
              "type": "connection",
              "content": "**How this connects** to *other parts* of the text"
            }
          ],
          "tags": ["extracted", "tags", "from", "reference"],
          "keyTakeaways": ["**Main point 1**", "*Main point 2*"],
          "sourceCitations": ["Specific references to original text"]
        }
      ],
      "coverageAnalysis": {
        "topicsCovered": ["List of main topics extracted"],
        "depth": "${levelOfDetail}",
        "completeness": "partial|comprehensive based on text length"
      }
    }
    
    The JSON must be VALID and parseable by JSON.parse().
    Enrich all text with markdown formatting.
  `,

  // ==================== FLASHCARDS ====================
  generateFlashcardsFromTopic: (topic: string, numberOfCards: number) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfCards} high-quality flashcard pairs about "${topic}"
    2. Difficulty distribution: 30% easy, 50% medium, 20% hard
    3. Cards should test both recall and understanding
    4. Mix card types: definitions, concepts, applications, comparisons
    5. USE MARKDOWN FORMATTING in card content (**bold**, *italic*, \`code\`, etc.)
    6. Front: Clear question with markdown if needed (max 15 words)
    7. Back: Complete answer with rich markdown formatting
    
    MARKDOWN FORMATTING:
    - Use **bold** for key terms
    - Use *italic* for emphasis
    - Use \`code\` for technical terms or formulas
    - Use > blockquotes for important notes
    - Use - lists for multiple points
    
    RETURN ONLY PURE VALID JSON with MARKDOWN in content:
    {
      "topic": "${topic}",
      "totalCards": ${numberOfCards},
      "cards": [
        {
          "id": 1,
          "front": "**Question?** *Concise key concept*",
          "back": "**Detailed answer** with *emphasis*, \`code\`, and **important points**. Include context and why it matters.",
          "difficulty": "easy|medium|hard",
          "hint": "**Hint:** Practical memory aid with *emphasis*",
          "category": "definition|concept|application|comparison",
          "tags": ["relevant", "subtopic", "tags"],
          "example": "**Example:** *Practical illustration* with \`code\` if needed",
          "commonMistakes": ["**Mistake 1:** *Common error*", "**Mistake 2:** *Another error*"]
        }
      ],
      "difficultyBreakdown": {
        "easy": ${Math.round(numberOfCards * 0.3)},
        "medium": ${Math.round(numberOfCards * 0.5)},
        "hard": ${Math.round(numberOfCards * 0.2)}
      },
      "studyTips": [
        "**Tip 1:** Spaced repetition schedule recommendation",
        "**Tip 2:** How to use these cards effectively"
      ]
    }
    
    The JSON must be VALID and parseable by JSON.parse().
    Use markdown formatting generously for better learning experience.
  `,

  generateFlashcardsFromReference: (referenceText: string, numberOfCards: number) => `
    CRITICAL INSTRUCTIONS:
    1. Generate EXACTLY ${numberOfCards} flashcard pairs based SOLELY on this reference:
    
    REFERENCE TEXT:
    ${referenceText.substring(0, 2500)} ${referenceText.length > 2500 ? '... [text truncated]' : ''}
    
    2. Extract key information for effective spaced repetition
    3. Focus on important facts, concepts, and relationships
    4. Ensure cards are testable and unambiguous
    5. USE MARKDOWN FORMATTING (**bold**, *italic*, \`code\`) for emphasis
    6. ALL CONTENT MUST BE DIRECTLY FROM THE REFERENCE TEXT
    
    EXTRACTION GUIDELINES:
    - Identify key terms and their definitions
    - Extract important facts, dates, numbers
    - Note cause-effect relationships
    - Highlight comparisons and contrasts
    - Capture sequences or processes
    
    MARKDOWN USAGE:
    - **Bold** for key terms from the reference
    - *Italic* for emphasis and important concepts
    - \`code\` for formulas, technical terms, or citations
    - > Blockquotes for direct quotes from reference
    
    RETURN ONLY PURE VALID JSON with MARKDOWN in content:
    {
      "source": "Reference-based flashcards",
      "totalCards": ${numberOfCards},
      "cards": [
        {
          "id": 1,
          "front": "**Key term or question** from text",
          "back": "**Accurate information** directly from reference with *emphasis* and \`technical terms\`",
          "difficulty": "easy|medium|hard",
          "hint": "**Hint:** Context clue from the text",
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
    
    The JSON must be VALID and parseable by JSON.parse().
    Use markdown formatting while maintaining source fidelity.
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