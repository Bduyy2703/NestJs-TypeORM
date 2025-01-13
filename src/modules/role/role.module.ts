import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoleService } from "./role.service";
import { RoleController } from "./role.controller";
import { Role } from "./entities/t_role";
import { PrismaModule } from "prisma/prisma.module";

@Module({
  imports: [TypeOrmModule.forFeature([Role] ) , PrismaModule],
  providers: [RoleService],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
