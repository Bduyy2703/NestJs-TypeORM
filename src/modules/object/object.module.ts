import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ObjectService } from "./object.service";
import { ObjectController } from "./object.controller";
import { Object_entity } from "./entities/object.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Object_entity])],
  providers: [ObjectService],
  controllers: [ObjectController],
  exports: [ObjectService],
})
export class ObjectModule {}
