import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RightObjectService } from "./right_object.service";
import { RightObjectController } from "./right_object.controller";
import { RightObject } from "../right_object/entities/t_right_object";
import { Right } from "../right/entities/t_right";
import { Object_entity } from "../object/entities/object.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([RightObject, Right ,Object_entity])
  ],
  providers: [RightObjectService],
  controllers: [RightObjectController],
  exports: [RightObjectService],
})
export class RightObjectModule {}
