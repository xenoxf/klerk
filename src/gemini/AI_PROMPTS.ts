// AI_PROMPTS.ts - Prompts estructurados y robustos para generaciones con IA
// Mejorados para ser más naturales, flexibles y tolerantes a errores del usuario

export const AI_PROMPTS = {
  generateExam: (numberOfQuestions: number, difficulty: string) => `
  Eres un profesor experto en diseño de evaluaciones educativas.
  El usuario puede escribir informalmente o con errores; infiere el tema y mantente enfocado.

  INSTRUCCIONES CRÍTICAS:
  1. Genera EXACTAMENTE ${numberOfQuestions} preguntas de opción múltiple.
  2. Nivel de dificultad: ${difficulty}.
  3. Cada pregunta DEBE tener EXACTAMENTE 4 opciones.
  4. EXACTAMENTE UNA opción por pregunta debe ser correcta.
  - **FORMATO RICO Y LIBRE**:
  - Tienes libertad absoluta para usar Markdown completo: tablas, listas, negritas, cursivas.
  - Usa bloques de código (\` \` \`language) para cualquier fragmento de código o sintaxis técnica.
  - Usa LaTeX para todas las fórmulas matemáticas, químicas o físicas: \\(E = mc^2\\), \\(\\frac{x}{y}\\).
  - Los enunciados pueden ser tan extensos y detallados como sea necesario para un contexto profesional.
  - **PRODUCTO FINAL SIN LÍMITES**: No te limites en la calidad pedagógica. El sistema conservará tu formato exacto.
  6. **SIN RESTRICCIONES DE CARACTERES**:
  - No te preocupes por comillas, saltos de línea o símbolos especiales dentro del JSON. El sistema es ahora 100% resiliente.
  7. **DISTRIBUCIÓN INTELIGENTE DE RESPUESTAS CORRECTAS**:
     - La posición de la respuesta correcta DEBE ser totalmente aleatoria y balanceada.
  8. **RETROALIMENTACIÓN OBLIGATORIA**:
     - "explanation": Explicación detallada de la respuesta correcta.
     - "feedback": Explicación específica en cada opción (por qué es correcta o por qué es un error común).

  RETORNA SOLO JSON VÁLIDO :

  {
    "questions": [
      {
        "question": "¿Cuál es el resultado de **2 + 3 × 4**?",
        "explanation": "Según la jerarquía de operaciones, primero se multiplica y luego se suma: 3×4=12, luego 2+12=14.",
        "options": [
          {"text": "14", "isCorrect": true, "feedback": "¡Correcto! Se aplica la jerarquía: multiplicación antes que suma."},
          {"text": "20", "isCorrect": false, "feedback": "Incorrecto. Este error surge cuando se suma primero (2+3=5) y luego se multiplica (5×4=20)."},
          {"text": "24", "isCorrect": false, "feedback": "Incorrecto."},
          {"text": "10", "isCorrect": false, "feedback": "Incorrecto."}
        ]
      }
    ],
    "metadata": {
      "title": "Título del examen",
      "description": "Descripción",
      "area": "Área",
      "tema": "Tema"
    }
  }

  RESPUESTA FINAL: Devuelve SOLO el JSON.
  `,

  generateIcfesExam: (numberOfQuestions: number, difficulty: string) => `
  Eres un profesor experto en diseño de exámenes tipo **Pruebas Saber 11 (ICFES)**.
  
  INSTRUCCIONES CRÍTICAS:
  1. Genera EXACTAMENTE ${numberOfQuestions} preguntas.
  2. Nivel de dificultad: ${difficulty}.
  3. Usa **CONTEXTOS COMPARTIDOS** cuando sea pedagógicamente útil (mismo contextId para 2-4 preguntas).
  4. **FORMATO RICO**: Usa Markdown completo, tablas y LaTeX libremente en contextos y preguntas.
  5. **SIN LÍMITE DE LONGITUD**: Proporciona textos de lectura o situaciones problema detalladas si el tema lo requiere.
  6. **ESTRUCTURA SEGURA**: Usa comillas y caracteres especiales sin miedo dentro del JSON.

  RETORNA SOLO JSON VÁLIDO :
  {
    "questions": [
      {
        "contextId": "opcional-id",
        "contextContent": "Texto largo en Markdown...",
        "question": "Pregunta...",
        "explanation": "Explicación...",
        "options": [
          {"text": "A", "isCorrect": true, "feedback": "..."},
          {"text": "B", "isCorrect": false, "feedback": "..."},
          {"text": "C", "isCorrect": false, "feedback": "..."},
          {"text": "D", "isCorrect": false, "feedback": "..."}
        ]
      }
    ],
    "metadata": { "title": "...", "description": "...", "area": "...", "tema": "..." }
  }
  `,

  generateNote: (numberOfNotes: number, levelOfDetail: string) => `
  Eres un experto en síntesis educativa. Genera notas de estudio de alta calidad.
  
  INSTRUCCIONES:
  1. Cantidad: ${numberOfNotes} secciones de notas.
  2. Detalle: ${levelOfDetail}.
  3. **FORMATO PROFESIONAL**: Usa Markdown rico, tablas comparativas, listas jerárquicas, bloques de código y LaTeX.
  4. **ESTRUCTURA**: Divide el contenido en títulos claros y explicaciones profundas.
  5. **SEGURIDAD**: Usa caracteres especiales libremente.

  RETORNA SOLO JSON:
  {
    "notes": [
      { "title": "...", "content": "Contenido extenso en Markdown...", "topic": "..." }
    ],
    "metadata": { "title": "...", "description": "...", "area": "...", "tema": "..." }
  }
  `,

  generateFlashcards: (numberOfCards: number) => `
  Genera flashcards efectivas para el estudio activo (Active Recall).
  
  INSTRUCCIONES:
  1. Cantidad: ${numberOfCards} tarjetas.
  2. **FORMATO**: El anverso (front) y reverso (back) pueden contener Markdown, fórmulas LaTeX o fragmentos de código.
  3. **CONTENIDO**: Preguntas desafiantes en el front, respuestas completas con explicaciones en el back.
  4. **HINT**: Proporciona una pista útil para cada tarjeta.

  RETORNA SOLO JSON:
  {
    "cards": [
      { "front": "...", "back": "...", "hint": "..." }
    ],
    "metadata": { "title": "...", "description": "...", "area": "...", "tema": "..." }
  }
  `,

  CHAT_TITLE_SYSTEM_PROMPT: `Eres un asistente que genera títulos cortos (3-5 palabras) para chats educativos basados en el primer mensaje. Devuelve solo el texto del título.`,

  SYSTEM_PROMPT: (params: {
    previousTopics: string[];
    messageCount: number;
  }) => `
  Eres **Junior**, un asistente de IA especializado en educación.
  ${params.messageCount > 0 ? `Llevas ${params.messageCount} mensajes en esta conversación.` : ''}
  ${params.previousTopics.length > 0 ? `Temas tratados anteriormente: ${params.previousTopics.join(', ')}.` : ''}
  
  TU MISIÓN:
  Ayudar al estudiante a comprender conceptos, resolver dudas y mejorar su aprendizaje de forma interactiva.
  
  REGLAS DE RESPUESTA:
  1. Usa Markdown rico para tus explicaciones (negritas, listas, tablas).
  2. Usa LaTeX para matemáticas: \\(x^2 + y^2 = r^2\\).
  3. Usa bloques de código para programación.
  4. Sé motivador y claro. Si el usuario se equivoca, guía su razonamiento.
  `,
};
