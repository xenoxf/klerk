#!/bin/bash

echo "=== Corrigiendo imports rotos ==="

# Función para reemplazar rutas
fix() {
  FILE=$1
  PATTERN=$2
  REPLACEMENT=$3

  if grep -q "$PATTERN" "$FILE"; then
    echo "→ Corrigiendo $FILE"
    sed -i "s|$PATTERN|$REPLACEMENT|g" "$FILE"
  fi
}

# NOTES
fix src/notes/notes.service.ts "src/groq/groq.service" "../groq/groq.service"
fix src/notes/notes.module.ts "src/groq/groq.module" "../groq/groq.module"
fix src/notes/notes.module.ts "src/auth/auth.module" "../auth/auth.module"
fix src/notes/entities/note.entity.ts "src/users/entities/user.entity" "../../users/entities/user.entity"

# FLASH CARDS
fix src/flash-cards/flash-cards.module.ts "src/auth/auth.module" "../auth/auth.module"
fix src/flash-cards/flash-cards.module.ts "src/groq/groq.service" "../groq/groq.service"
fix src/flash-cards/flash-cards.module.ts "src/groq/groq.module" "../groq/groq.module"
fix src/flash-cards/entities/card.entity.ts "src/users/entities/user.entity" "../../users/entities/user.entity"
fix src/flash-cards/flash-cards.service.ts "src/groq/groq.service" "../groq/groq.service"

# AUTH
fix src/auth/auth.service.ts "src/users/users.service" "../users/users.service"
fix src/auth/auth.module.ts "src/users/users.service" "../users/users.service"
fix src/auth/auth.module.ts "src/users/users.module" "../users/users.module"
fix src/auth/strategies/google.strategy.ts "src/users/users.service" "../../users/users.service"

# GROQ
fix src/groq/groq.service.ts "src/exams/dto/create-exam.dto" "../exams/dto/create-exam.dto"

# EXAMS
fix src/exams/entities/exam.entity.ts "src/users/entities/user.entity" "../../users/entities/user.entity"
fix src/exams/exams.module.ts "src/auth/auth.module" "../auth/auth.module"

# MESSAGES
fix src/messages/messages.module.ts "src/groq/groq.module" "../groq/groq.module"
fix src/messages/messages.module.ts "src/auth/auth.module" "../auth/auth.module"
fix src/messages/entities/chat.entity.ts "src/users/entities/user.entity" "../../users/entities/user.entity"

# USERS
fix src/users/entities/user.entity.ts "src/exams/entities/exam.entity" "../../exams/entities/exam.entity"
fix src/users/entities/user.entity.ts "src/messages/entities/chat.entity" "../../messages/entities/chat.entity"
fix src/users/entities/user.entity.ts "src/flash-cards/entities/card.entity" "../../flash-cards/entities/card.entity"

echo "=== Importaciones corregidas ==="
