import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionService } from "./permission.service";
import { User } from "../users/entities/user.entity";

// Thay [] bằng danh sách các entity liên quan
@Module({
  imports: [TypeOrmModule.forFeature([User])], // Tham chiếu kết nối "user"
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
