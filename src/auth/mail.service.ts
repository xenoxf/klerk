import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Usar configuración de variables de ambiente
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_PASS');
    const mailHost = this.configService.get<string>(
      'MAIL_HOST',
      'smtp.gmail.com',
    );
    const mailPort = this.configService.get<number>('MAIL_PORT', 587);

    // Validar que existan las credenciales
    if (!mailUser || !mailPass) {
      console.warn(
        '⚠️  Variables MAIL_USER o MAIL_PASS no configuradas. ' +
          'El servicio de correos no funcionará. ' +
          'Configura estas variables en .env',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailPort === 465, // true para puerto 465, false para otros puertos
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });
  }

  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    userName: string,
  ): Promise<boolean> {
    try {
      if (
        !this.configService.get<string>('MAIL_USER') ||
        !this.configService.get<string>('MAIL_PASS')
      ) {
        console.error('❌ Credenciales de correo no configuradas');
        throw new BadRequestException(
          'El servicio de correos no está configurado correctamente',
        );
      }

      // URL base del frontend
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );
      const verificationUrl = `${frontendUrl}/auth?token=${verificationToken}`;

      const mailOptions = {
        from:
          this.configService.get<string>('MAIL_FROM') ||
          this.configService.get<string>('MAIL_USER'),
        to: to,
        subject: '🎓 Verifica tu email - LearnyOS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1>¡Bienvenido a LearnyOS! 🎓</h1>
            </div>
            
            <div style="padding: 40px; background-color: #f8f9fa; border-radius: 0 0 10px 10px;">
              <p>Hola <strong>${userName}</strong>,</p>
              
              <p>Gracias por registrarte en LearnyOS. Para completar tu registro, necesitas verificar tu dirección de correo electrónico.</p>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  ✓ Verificar Email
                </a>
              </div>
              
              <p style="font-size: 12px; color: #666;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="font-size: 12px; color: #666; word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              
              <p style="font-size: 12px; color: #999;">
                Este enlace expirará en 24 horas por seguridad.
              </p>
              
              <p style="font-size: 12px; color: #999;">
                Si no solicitaste esta verificación, ignora este correo.
              </p>
            </div>
          </div>
        `,
        text: `Verifica tu email en: ${verificationUrl}`,
      };

      // Enviar correo
      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ Correo de verificación enviado a:', to);
      console.log('📧 Message ID:', info.messageId);

      return true;
    } catch (error) {
      console.error('❌ Error al enviar correo de verificación:', error);
      throw new BadRequestException(`Error al enviar correo: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada');
      return true;
    } catch (error) {
      console.error('❌ Error en conexión SMTP:', error);
      throw new BadRequestException(
        `Error en configuración SMTP: ${error.message}`,
      );
    }
  }
}
