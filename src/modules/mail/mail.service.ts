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
}
