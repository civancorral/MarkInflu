import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private fromAddress: string;
  private appUrl: string;

  constructor(private configService: ConfigService) {
    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') || 'MarkInflu <noreply@markinflu.com>';
    this.appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'localhost',
      port: this.configService.get<number>('SMTP_PORT') || 1025,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      ...(this.configService.get<string>('SMTP_USER')
        ? {
            auth: {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASS'),
            },
          }
        : {}),
    });
  }

  async sendVerificationEmail(email: string, userId: string): Promise<void> {
    const verifyUrl = `${this.appUrl}/api/auth/verify?userId=${userId}`;

    await this.send({
      to: email,
      subject: 'Verifica tu cuenta — MarkInflu',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenido a MarkInflu</h2>
          <p>Gracias por registrarte. Haz clic en el siguiente enlace para verificar tu cuenta:</p>
          <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none;">Verificar mi cuenta</a></p>
          <p style="color: #666; font-size: 14px;">Si no creaste esta cuenta, ignora este correo.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${resetToken}`;

    await this.send({
      to: email,
      subject: 'Restablecer contraseña — MarkInflu',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Restablecer contraseña</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none;">Restablecer contraseña</a></p>
          <p style="color: #666; font-size: 14px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    });
  }

  async sendNotificationEmail(
    email: string,
    subject: string,
    title: string,
    body: string,
    actionUrl?: string,
  ): Promise<void> {
    const actionButton = actionUrl
      ? `<p><a href="${this.appUrl}${actionUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none;">Ver detalle</a></p>`
      : '';

    await this.send({
      to: email,
      subject: `${subject} — MarkInflu`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${title}</h2>
          <p>${body}</p>
          ${actionButton}
          <p style="color: #666; font-size: 14px;">— El equipo de MarkInflu</p>
        </div>
      `,
    });
  }

  private async send(options: { to: string; subject: string; html: string }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        ...options,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error}`);
    }
  }
}
