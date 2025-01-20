import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateObjectDto } from "./dto/create-object.dto";
import { UpdateObjectDto } from "./dto/update-object.dto";
import { Object_entity } from "../object/entities/object.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
@Injectable()
export class ObjectService {
  constructor(
    @InjectRepository(Object_entity)
    private readonly objectRepository: Repository<Object_entity>,
  ) { }

  async create(createObjectDto: CreateObjectDto): Promise<Object_entity> {
    try {
      const object = this.objectRepository.create({
        ...createObjectDto,
        createdDate: new Date(),
      });
      return await this.objectRepository.save(object);
    } catch (error) {
      console.error("Error creating object:", error);
      throw error;
    }
  }

  // Lấy thông tin 1 Object
  async findOne(id: number): Promise<Object_entity> {
    const object = await this.objectRepository.findOneBy({ id });
    if (!object) {
      throw new NotFoundException("Object không tồn tại");
    }
    return object;
  }

  // Cập nhật Object
  async update(id: number, updateObjectDto: UpdateObjectDto): Promise<Object_entity> {
    const existingObject = await this.findOne(id);
    const updatedObject = {
      ...existingObject,
      ...updateObjectDto,
      updatedDate: new Date(), // Gán ngày cập nhật
    };
    return await this.objectRepository.save(updatedObject);
  }

  // Xóa Object
  async remove(id: number): Promise<boolean> {
    const existingObject = await this.findOne(id); // Kiểm tra Object có tồn tại
    await this.objectRepository.remove(existingObject);
    return true;
  }
}
