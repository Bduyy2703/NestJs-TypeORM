import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleRight } from "../role_right/entities/t_role_right";
import { Role } from "../role/entities/t_role";
import { Right } from "../right/entities/t_right";
import { RoleRightService } from "./role_right.service";
import { RoleRightController } from "./role_right.controller";
import { Module } from "@nestjs/common";
import { PrismaModule } from "prisma/prisma.module";

@Module({
  imports: [TypeOrmModule.forFeature([RoleRight, Role, Right],),PrismaModule],
  providers: [RoleRightService],
  controllers: [RoleRightController],
  exports: [RoleRightService],
})
export class RoleRightModule {}
