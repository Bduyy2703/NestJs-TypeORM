import { Injectable, NotFoundException } from "@nestjs/common";
import { RightObject } from "./entities/t_right_object";
import { Object_entity } from "../object/entities/object.entity";
import { Right } from "../right/entities/t_right";
import { CreateRightObjectDto } from "./dto/create-right-object.dto";
import { UpdateRightObjectDto } from "./dto/update-right-object.dto";

import { FindRightObjectDto } from "./dto/find-right-object.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Like, Repository } from "typeorm";

@Injectable()
export class RightObjectService {

  constructor(
    @InjectRepository(RightObject)
    private readonly rightObjectRepository: Repository<RightObject>,
    @InjectRepository(Object_entity)
    private readonly objectRepository: Repository<Object_entity>,
    @InjectRepository(Right)
    private readonly rightRepository: Repository<Right>,
  ) { }

  async create(
    createRightObjectDto: CreateRightObjectDto
  ): Promise<RightObject> {
    try {

      const { objectId, rightId } = createRightObjectDto;
      // Kiểm tra tồn tại Object và Right
      const object = await this.objectRepository.findOne({ where: { id: objectId } });
      const right = await this.rightRepository.findOne({ where: { id: rightId } });

      if (!object || !right) {
        throw new NotFoundException("Đối tượng hoặc quyền không tồn tại");
      }

      const newRightObject = this.rightObjectRepository.create({
        ...createRightObjectDto,
        createdDate: new Date(),
      });
      return await this.rightObjectRepository.save(newRightObject);

    } catch (error) {
      console.error("Lỗi khi tạo quan hệ quyền-đối tượng:", error);
      throw error;
    }
  }
  async findAll(
    findDto: FindRightObjectDto
  ): Promise<{ rows: RightObject[]; count: number }> {
    const { page = 1, size = 10, keyword } = findDto;

    const skip = (page - 1) * size;
    const take = size !== -1 ? size : undefined;

    // Tạo điều kiện tìm kiếm
    const where: FindOptionsWhere<RightObject> = keyword
      ? {
        object: { name: Like(`%${keyword}%`) },
        right: { name: Like(`%${keyword}%`) },
      }
      : {};

    const [rows, count] = await Promise.all([
      this.rightObjectRepository.find({
        where: [
          { object: { name: Like(`%${keyword}%`) } },
          { right: { name: Like(`%${keyword}%`) } },
        ],
        skip,
        take,
        order: { createdDate: "DESC" },
        relations: ["object", "right"], // Lấy liên kết với bảng Object và Right
      }),
      this.rightObjectRepository.count({
        where,
      }),
    ]);

    return { rows, count };
  }

  async findOne(id: number): Promise<RightObject> {
    const rightObject = await this.rightObjectRepository.findOne({
      where: { id },
      relations: ["object", "right"], // Lấy liên kết với bảng Object và Right
    });

    if (!rightObject) {
      throw new NotFoundException("Mối quan hệ quyền-đối tượng không tồn tại");
    }
    return rightObject;
  }

  async update(
    id: number,
    updateRightObjectDto: UpdateRightObjectDto
  ): Promise<RightObject> {

    const existingRightObject = await this.findOne(id); // Kiểm tra tồn tại

    const updatedRightObject = this.rightObjectRepository.merge(existingRightObject, {
      ...updateRightObjectDto,
      updatedDate: new Date(),
    });

    return await this.rightObjectRepository.save(updatedRightObject);
  }

  async remove(id: number): Promise<boolean> {
    const existingRightObject = await this.findOne(id); // Kiểm tra tồn tại
    await this.rightObjectRepository.remove(existingRightObject); // Xóa mối quan hệ
    return true;
  }
}