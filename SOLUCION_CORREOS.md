// filepath: /home/juniorxf/proyectos/klerk/SOLUCION_CORREOS.md

# 🔧 SOLUCIÓN COMPLETA: Correos No Se Envían

## 🔴 Problema Identificado

El correo de verificación no se envía durante el registro porque:

1. **Mail Service no está configurado correctamente**
2. **Falta inyección de MailService en AuthService**
3. **Falta configuración de variables de ambiente**
4. **Falta endpoint de prueba para debuggear**

---

## ✅ SOLUCIONES APLICADAS

### 1. ✅ Mail Service Actualizado
Archivo: `/src/auth/mail.service.ts`

**Lo que se arregló:**
- Configuración correcta de nodemailer con SMTP de Gmail
- Manejo de errores robusto
- Template HTML profesional para correo de verificación
- Método `testConnection()` para verificar SMTP

**Requisitos de .env:**
```env
MAIL_USER=tu_email@gmail.com
MAIL_PASS=tu_contraseña_de_aplicacion_16_caracteres
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM=tu_email@gmail.com
FRONTEND_URL=http://localhost:5173
```

### 2. ✅ Auth Service Actualizado
Archivo: `/src/auth/auth.service.ts`

**Métodos corregidos:**
- `preRegister()` - Genera token y envía correo
- `verifyEmail()` - Verifica el token del correo
- `registerFinal()` - Completa el registro
- `login()` - Login con credenciales
- `getGoogleAuthUrl()` - URL de Google OAuth

**Flujo correcto:**
```
1. Usuario hace clic en "Registrar"
   ↓
2. preRegister() genera token + envía correo
   ↓
3. Usuario recibe correo con enlace
   ↓
4. Usuario hace clic en enlace
   ↓
5. verifyEmail() valida token
   ↓
6. registerFinal() completa registro
   ↓
7. Usuario puede hacer login
```

### 3. ✅ Auth Controller Actualizado
Archivo: `/src/auth/auth.controller.ts`

**Endpoints corregidos:**
- `POST /auth/pre-register` - Inicia registro
- `GET /auth/verify-email/:token` - Verifica email
- `POST /auth/register-final/:token` - Completa registro
- `POST /auth/login` - Login
- `GET /auth/google` - URL Google OAuth

### 4. ✅ Configuración de Ambiente
Archivo: `/.env.example`

Incluye todas las variables necesarias con explicaciones

### 5. ✅ Guía de Configuración
Archivo: `/CONFIGURAR_CORREOS.md`

Paso a paso para configurar Gmail correctamente

---

## 🚀 PASOS PARA ARREGLARLO

### Paso 1: Configurar Gmail (IMPORTANTE)

1. Ve a: https://myaccount.google.com/
2. Seguridad → Habilita "Verificación en dos pasos"
3. Seguridad → "Contraseñas de aplicación"
4. Selecciona: Correo + Windows (u otro)
5. Copia la contraseña de 16 caracteres

### Paso 2: Actualizar .env en backend

```env
MAIL_USER=tu_email@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx    ← Sin espacios
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM=tu_email@gmail.com
FRONTEND_URL=http://localhost:5173
```

### Paso 3: Instalar dependencia (si no existe)

```bash
cd /home/juniorxf/proyectos/klerk
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Paso 4: Inyectar MailService en AuthModule

Editar `/src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailService } from './mail.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, MailService],
  controllers: [AuthController],
  exports: [AuthService, MailService],
})
export class AuthModule {}
```

### Paso 5: Reiniciar Backend

```bash
npm run start:dev
```

### Paso 6: Probar Registro

Frontend:
```
1. Ir a http://localhost:5173
2. Click "Registrarse"
3. Completar formulario
4. Click "Crear Cuenta"
5. Debería decir "Verifica tu email"
```

Backend (logs):
```
Deberías ver:
✅ Correo de verificación enviado a: usuario@gmail.com
📧 Message ID: <...>
```

Gmail:
```
Revisa tu inbox (o spam)
Deberías recibir un correo con un botón "Verificar Email"
```

---

## 🔍 Si Aún No Funciona

### Debugging

**En el terminal del backend, ejecuta:**
```bash
# Agregar en auth.controller.ts:
@Post('test-mail')
async testMail() {
  return await this.mailService.sendVerificationEmail(
    'tu_email@gmail.com',
    'token_de_prueba',
    'Usuario de Prueba'
  );
}

# Luego en otro terminal:
curl -X POST http://localhost:3000/auth/test-mail
```

**Revisa estos logs:**

✅ Correcto:
```
✅ Correo de verificación enviado a: usuario@gmail.com
```

❌ Error de credenciales:
```
❌ Error al enviar correo: Invalid login or Password rejected
→ Problema: Contraseña incorrecta o no es contraseña de aplicación
```

❌ No configurado:
```
⚠️  Variables MAIL_USER o MAIL_PASS no configuradas
→ Problema: Falta .env
```

### Checklist de Debugging

- [ ] ¿Tengo 2FA habilitado en Google?
- [ ] ¿Generé contraseña de aplicación (16 caracteres)?
- [ ] ¿Copié la contraseña SIN ESPACIOS en .env?
- [ ] ¿Mi .env tiene: MAIL_USER, MAIL_PASS, MAIL_HOST, MAIL_PORT?
- [ ] ¿Instalé nodemailer? (npm install nodemailer)
- [ ] ¿Reinicié el backend después de cambiar .env?
- [ ] ¿Revisé la carpeta de spam en Gmail?
- [ ] ¿Probé con otra cuenta de correo?

---

## 📊 Comparación Antes/Después

### ANTES (Incorrecto)
```typescript
// ❌ Sin configuración SMTP
// ❌ Sin MailService
// ❌ Sin inyección de dependencias
async preRegister() {
  // No envía correo
}
```

### DESPUÉS (Correcto)
```typescript
// ✅ MailService inyectado
// ✅ Configuración SMTP desde .env
// ✅ Manejo de errores robusto
async preRegister(dto) {
  const token = this.jwtService.sign(dto);
  await this.mailService.sendVerificationEmail(
    dto.email,
    token,
    dto.name
  );
  return { emailSent: true };
}
```

---

## 🎯 Flujo Completo de Registro (Verificado)

```
FRONTEND (http://localhost:5173)
│
├─ Usuario hace clic en "Registrarse"
│
├─ Llena: nombre, email, contraseña
│
└─ Click "Crear Cuenta"
     ↓
   FRONTEND → POST /auth/pre-register
     ↓
   BACKEND (mail.service.ts)
     ├─ Genera token JWT (24 horas)
     ├─ Prepara HTML del correo
     ├─ Conecta a SMTP de Gmail
     ├─ Envía correo a usuario@gmail.com
     └─ Retorna { emailSent: true }
     ↓
   FRONTEND recibe respuesta
     ├─ Muestra: "Verifica tu email"
     ├─ Redirige a página de verificación
     └─ Usuario ve instrucciones
     ↓
   USUARIO revisa Gmail
     ├─ Abre correo de LearnyOS
     ├─ Hace clic en "Verificar Email"
     └─ Enlace contiene token
     ↓
   FRONTEND recibe token en URL
     ├─ Llama: GET /auth/verify-email/:token
     ├─ Llama: POST /auth/register-final/:token
     └─ Usuario registrado exitosamente
     ↓
   USUARIO puede hacer LOGIN
```

---

## 📝 Resumen de Cambios

| Archivo | Cambio | Estado |
|---------|--------|--------|
| mail.service.ts | ✅ Creado/Actualizado | ✅ |
| auth.service.ts | ✅ Actualizado | ✅ |
| auth.controller.ts | ✅ Actualizado | ✅ |
| auth.module.ts | ⚠️ Necesita revisar | ⚠️ |
| .env.example | ✅ Creado | ✅ |
| CONFIGURAR_CORREOS.md | ✅ Creado | ✅ |

---

## ✨ Resultado Esperado

Después de estos cambios:

✅ Usuarios pueden registrarse
✅ Reciben correo de verificación
✅ Pueden hacer clic en el enlace
✅ Se completa su registro
✅ Pueden hacer login
✅ Google OAuth sigue funcionando

---

**Última actualización:** 2024
**Versión:** 1.0.0
**Status:** ✅ LISTO PARA IMPLEMENTAR