import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/pre-register?token=${token}`;

    const html = `
      <p>Hola,</p>
      <p>Haz clic en el enlace para verificar tu correo:</p>
      <a href="${url}">Verificar email</a>
      <p>Este enlace expira en 15 minutos.</p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@tuapp.com',
        to: email,
        subject: 'Verifica tu correo',
        html,
      });

      return true;
    } catch (err) {
      throw new InternalServerErrorException('Error enviando correo: ' + err.message);
    }
  }
}
