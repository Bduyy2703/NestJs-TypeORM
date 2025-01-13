import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RightObjectService } from "./right_object.service";
import { RightObjectController } from "./right_object.controller";
import { RightObject } from "../right_object/entities/t_right_object";
import { Right } from "../right/entities/t_right";
import { PrismaModule } from "prisma/prisma.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([RightObject, Right]),PrismaModule
  ],
  providers: [RightObjectService],
  controllers: [RightObjectController],
  exports: [RightObjectService],
})
export class RightObjectModule {}
