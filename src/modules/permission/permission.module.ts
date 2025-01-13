import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionService } from "./permission.service";

// Thay [] bằng danh sách các entity liên quan
@Module({
  imports: [TypeOrmModule.forFeature([], "user")], // Tham chiếu kết nối "user"
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
