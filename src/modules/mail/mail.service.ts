import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/entities/user.entity';
import { Product } from '../product/entity/product.entity';
import { StrategySale } from '../strategySale/entity/strategySale.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { File } from '../files/file.entity';
@Injectable()
export class MailService {
  constructor(

    private mailerService: MailerService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(StrategySale)
    private saleRepo: Repository<StrategySale>,
    @InjectRepository(File)
    private fileRepo: Repository<File>,
  ) {}

  async sendUserConfirmation(user: any, tokenOTP: string,accessToken: string) {
    // const url = `http://35.247.185.8/api/v1/auth/confirm-email?tokenOTP=${tokenOTP}&accessToken=${accessToken}`;
    // const url = `http://localhost:3000/confirm-success?tokenOTP=${tokenOTP}&accessToken=${accessToken}`;// sẽ sửa lại theo link của FE
    // https://ui-luxora-client.vercel.app/
    const url = `https://ui-luxora-clientt.vercel.app/confirm-success?tokenOTP=${tokenOTP}&accessToken=${accessToken}`;
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

  async sendSaleMail(userId: string, products: Product[], saleId: number) {
    const user = await this.userRepo.findOne({ where: { id: String(userId) } });
    const sale = await this.saleRepo.findOne({ where: { id: saleId } });
    if (!user || !sale) return;
  
    // Lấy productIds
    const productIds = products.map(p => p.id);
  
    // Lấy file ảnh cho các sản phẩm này
    const files = await this.fileRepo.find({
      where: { targetId: In(productIds), targetType: 'product' },
    });
  
    // Gắn ảnh vào từng product
    const productsWithImage = products.map(p => {
      const image = files.find(f => f.targetId === p.id)?.fileUrl || 'https://placehold.co/60x60';
      return { ...p, image };
    });
  
    await this.mailerService.sendMail({
      to: user.email,
      subject: `🎉 Sản phẩm bạn yêu thích đang được giảm giá!`,
      template: './sale-notify',
      context: {
        name: user.username,
        saleName: sale.name,
        products: productsWithImage,
        year: new Date().getFullYear(),
      },
    });
  }
}
