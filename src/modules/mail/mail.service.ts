import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/entities/user.entity';
import { Product } from '../product/entity/product.entity';
import { StrategySale } from '../strategySale/entity/strategySale.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@Injectable()
export class MailService {
  constructor(

    private mailerService: MailerService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(StrategySale)
    private saleRepo: Repository<StrategySale>
  ) {}

  async sendUserConfirmation(user: any, tokenOTP: string,accessToken: string) {
    // const url = `http://35.247.185.8/api/v1/auth/confirm-email?tokenOTP=${tokenOTP}&accessToken=${accessToken}`;
    const url = `http://localhost:3000/confirm-success?tokenOTP=${tokenOTP}&accessToken=${accessToken}`;
    // dẫn link đến Fe kẹp theo các cái token như trên , xong Fe mới gọi api là cái link trên
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

  async sendSaleMail(userId: number, products: Product[], saleId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const sale = await this.saleRepo.findOne({ where: { id: saleId } });
    if (!user || !sale) return;
    const productList = products.map(p => `- ${p.name}`).join('\n');
    const subject = `Sản phẩm bạn yêu thích đang được giảm giá!`;
    const body = `Xin chào,\n\nCác sản phẩm bạn yêu thích đang được giảm giá trong chương trình "${sale.name}":\n${productList}\n\nTruy cập ngay để không bỏ lỡ!`;
    await this.mailerService.sendMail({
      to: user.email,
      subject,
      text: body,
    });
  }
}
