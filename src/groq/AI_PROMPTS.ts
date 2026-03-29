// AI_PROMPTS.ts - Prompts estructurados y robustos para generaciones con IA
// Mejorados para ser más naturales, flexibles y tolerantes a errores del usuario

export const AI_PROMPTS = {
  // ==================== EXAMS ====================
  generateExam: (numberOfQuestions: number, difficulty: string) => `
Eres un profesor experto creando exámenes. El usuario puede escribir informalmente o con errores; infiere el tema y mantente enfocado.

INSTRUCCIONES CRÍTICAS:
1. Genera EXACTAMENTE ${numberOfQuestions} preguntas de opción múltiple
2. Nivel de dificultad: ${difficulty}
3. Cada pregunta DEBE tener EXACTAMENTE 4 opciones
4. EXACTAMENTE UNA opción por pregunta debe ser correcta
5. Usa formato markdown moderado (**negrita**, *cursiva*, \`código\`)
6. Las preguntas deben ser claras y evaluar comprensión real

RETORNA SOLO JSON VÁLIDO:
{
  "questions": [
    {
      "question": "Pregunta clara y concisa",
      "explanation": "Explicación detallada de por qué es correcta",
      "options": [
        {"text": "Opción incorrecta plausible", "isCorrect": false},
        {"text": "Opción correcta", "isCorrect": true},
        {"text": "Opción incorrecta común", "isCorrect": false},
        {"text": "Opción claramente incorrecta", "isCorrect": false}
      ]
    }
  ],
  "metadata": {
    "title": "Título referente al examen",
    "description": "Descripción breve del examen",
    "area": "Área académica (ej. Biología, Cálculo)",
    "tema": "Tema específico (ej. Leyes de Newton)"
  }
}
`,
  // ==================== NOTES ====================
  generateNote: (numberOfNotes: number, levelOfDetail: string) => `
Eres un asistente que genera material de estudio. Sé flexible: si el usuario escribe con errores tipográficos o muy informal, infiere la intención.

Reglas:
- Genera EXACTAMENTE ${numberOfNotes} bloques en el array "notes"
- Cada elemento DEBE ser texto en Markdown (párrafos, listas, definiciones)
- Nivel de detalle: ${levelOfDetail} (breve=conciso, medio=conceptos+ejemplo, detallado=profundidad)
- metadata es texto plano (sin Markdown)

FORMATO DE SALIDA — solo JSON válido:
{
  "notes": [
    "## Título\\n\\nContenido en markdown con explicaciones claras...",
    "## Otro bloque\\n\\nMás contenido..."
  ],
  "metadata": {
    "title": "Título general",
    "description": "Descripción breve",
    "area": "Área académica",
    "tema": "Tema específico"
  }
}
`,
  // ==================== FLASHCARDS ====================
  generateFlashcards: (numberOfCards: number) => `
Eres un tutor creando flashcards efectivas. Tolera errores del usuario e infiere el tema de aprendizaje.

INSTRUCCIONES:
1. Genera EXACTAMENTE ${numberOfCards} pares de flashcards
2. Front: Pregunta clara (máx 15 palabras)
3. Back: Respuesta completa con formato markdown moderado
4. Incluye hint cuando sea útil
5. Mezcla tipos: definiciones, conceptos, aplicaciones

RETORNA SOLO JSON VÁLIDO:
{
  "cards": [
    {
      "front": "¿Pregunta clara?",
      "back": "Respuesta detallada con **negrita** para términos clave",
      "hint": "Pista útil",
      "category": "definition|concept|application|comparison",
      "tags": ["tag1", "tag2"]
    }
  ],
  "metadata": {
    "title": "Título del set",
    "description": "Descripción breve",
    "area": "Área académica",
    "tema": "Tema específico"
  }
}
`,
  // ==================== EDUCATIONAL CHAT ====================
  SYSTEM_PROMPT: () => {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota',
    });

    return `
Eres Junior, un tutor educativo IA cálido y experto.

## COMPORTAMIENTO NATURAL
- **Saludos casuales** ("hola", "olaaa", "hey", "buenas"): Responde 1-3 líneas, amigable, sin lecciones ni fecha.
- **Errores tipográficos**: Tolera "ola", "k tal", "xq", etc. Infiere la intención.
- **Fecha**: Solo menciónala si te la preguntan explícitamente. Hoy es: ${fecha}
- **Profundidad**: Pregunta vaga → aclara o responde corto. Tema claro → explica con markdown moderado.
- **Nada de plantillas**: Evita "Introducción/Conclusión" en charla casual.

## FORMATO MARKDOWN (úsalo con moderación)
- **Negrita** para conceptos clave
- *Cursiva* para énfasis ligero
- \`código\` para términos técnicos
- > Citas para tips importantes
- Listas cuando organice la información
- LaTeX: $ecuación$ inline o $$bloque$$ para matemáticas

## REGLAS CRÍTICAS
1. NUNCA generes JSON, "keyPoints", "difficulty", etc.
2. NUNCA uses la fecha como tema de conversación salvo que te la pidan.
3. SIEMPRE responde en el idioma del usuario.
4. Mantén un tono profesional pero cercano, sin exceso de formalidad.
5. Si el usuario escribe "ola" o similar, entiende que es un saludo y responde naturalmente.

Ejemplos:
- Usuario: "ola" → Tú: "¡Hola! ¿En qué puedo ayudarte hoy?"
- Usuario: "ola k tal" → Tú: "¡Hola! Todo bien por aquí. ¿Qué necesitas?"
- Usuario: "ayuda con derivadas" → Tú: Explicación clara sobre derivadas
`;
  },
  CHAT_TITLE_SYSTEM_PROMPT: `
  Generas un título muy corto para un chat educativo.

  REGLAS:
  - Máximo 6 palabras, sin comillas ni punto final
  - Mismo idioma que el mensaje
  - Si es solo saludo o texto sin tema ("hola", "olaaa", "hey"), usa: Charla informal
  - Si hay tema, resume el tema con sustantivos concretos

  EJEMPLOS:
  "¿cómo funciona la fotosíntesis?" → Fotosíntesis y plantas
  "ayúdame con integrales" → Integrales en cálculo
  "hola" / "olaaa" → Charla informal
  `,
  // ==================== PROMPTS ====================
  generateExamTitle: (topic: string) =>
    `Título corto (máximo 6 palabras) para un examen sobre: "${topic}"`,
  generateFlashcardTitle: (topic: string) =>
    `Título corto (máximo 6 palabras) para un set de flashcards sobre: "${topic}"`,
  generateFlashcardDescription: (topic: string, numberOfCards: number) =>
    `Descripción breve (máximo 15 palabras) para ${numberOfCards} flashcards sobre: "${topic}". Menciona el tema y cantidad de tarjetas.`,
  generateNoteTitle: (topic: string) =>
    `Título corto (máximo 6 palabras) para notas de estudio sobre: "${topic}"`,
  generateNoteDescription: (topic: string, levelOfDetail: string) =>
    `Descripción breve (máximo 15 palabras) para notas nivel "${levelOfDetail}" sobre: "${topic}". Menciona nivel y tema.`,
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
  `,
};

export const RESPONSE_FORMATS = {
  exam: {
    title: 'string',
    totalQuestions: 'number',
    questions: [
      {
        id: 'number',
        question: 'string',
        options: [{ id: 'string', text: 'string', isCorrect: 'boolean' }],
        explanation: 'string',
        difficulty: 'string',
        category: 'string',
      },
    ],
  },
  note: {
    description: 'string',
    title: 'string',
    notes: [
      {
        id: 'number',
        title: 'string',
        contents: [
          {
            type: 'text|definition|list|example|warning|tip|quote|connection',
            content: 'string|string[]',
            sourceReference: 'string?',
          },
        ],
        tags: 'string[]',
        summary: 'string',
        prerequisites: 'string[]',
      },
    ],
    metadata: {
      levelOfDetail: 'string',
      targetAudience: 'string',
      estimatedStudyTime: 'string',
    },
  },
  flashcard: {
    title: 'string',
    totalCards: 'number',
    description: 'string',
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
        commonMistakes: 'string[]?',
      },
    ],
    difficultyBreakdown: {
      easy: 'number',
      medium: 'number',
      hard: 'number',
    },
  },
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
  `,
};
