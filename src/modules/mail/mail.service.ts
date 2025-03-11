import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: any, tokenOTP: string,accessToken: string) {
    const url = `http://localhost:3000/api-docs/v1/auth/confirm-email?tokenOTP=${tokenOTP}&accessToken=${accessToken}`;
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Register! Confirm your Email',
      template: './confirmation',
      context: {
        name: user.username,
        url,
      },
    });
  }

  async sendMail(to: string, subject: string, template: string, context: any) {
    try {
      console.log(context)
      await this.mailerService.sendMail({
        to,
        template,
        subject,
        context: {
          name: context.name,
          newPassword : context.otp
        },
      });
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, message: 'Failed to send email' };
    }
  }
  async sendForgotPasswordOTP(user: any, otp: string) {
    return this.sendMail(user.email, 'Reset Your Password', './forgotPass', {
      name: user.username,
      otp,
    });
  }
}
