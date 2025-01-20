import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RightService } from "./right.service";
import { RightController } from "./right.controller";
import { Right } from "../right/entities/t_right";

@Module({
  imports: [TypeOrmModule.forFeature([Right])],
  providers: [RightService],
  controllers: [RightController],
  exports: [RightService],
})
export class RightModule {}
