import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/user.module';
import { DatabaseModule } from './cores/database/config/postgres.config';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { MailService } from './modules/mail/mail.service';
import { TokenModule } from './modules/token/token.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt.auth.guard';
import { RolesGuard } from './modules/auth/guards/role.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BlogsModule } from './modules/blogs/blog.module';
import { ProfilesModule } from './modules/profile/profile.module';
import { CommentsModule } from './modules/comment/comment.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    BlogsModule,
    DatabaseModule,
    TokenModule,
    MailModule,
    ProfilesModule,
    CommentsModule,
    NotificationModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MailService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
