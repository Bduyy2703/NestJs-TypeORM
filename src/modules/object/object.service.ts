import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateObjectDto } from "./dto/create-object.dto";
import { UpdateObjectDto } from "./dto/update-object.dto";
import { PrismaService } from 'prisma/prisma.service'
import { Object } from "@prisma/client";
@Injectable()
export class ObjectService {
  constructor(private readonly prismaService: PrismaService) { }

  async create(createObjectDto: CreateObjectDto): Promise<Object> {
    try {
      createObjectDto.createdDate = new Date();
      const object = await this.prismaService.object.create({
        data: createObjectDto,
      });
      return object;
    } catch (error) {
      console.error("Error creating object:", error);
      throw error;
    }
  }

  // Lấy thông tin 1 Object
  async findOne(id: number): Promise<Object> {
    const object = await this.prismaService.object.findUnique({
      where: { id },
    });
    if (!object) {
      throw new NotFoundException("Object không tồn tại");
    }
    return object;
  }
  // Cập nhật Object
  async update(id: number, updateObjectDto: UpdateObjectDto): Promise<Object> {
    const existingObject = await this.findOne(id);
    updateObjectDto.updateddate = new Date(); // Gán ngày cập nhật
    const updatedObject = await this.prismaService.object.update({
      where: { id },
      data: updateObjectDto,
    });
    return updatedObject;
  }

  // Xóa Object
  async remove(id: number): Promise<boolean> {
    await this.findOne(id); // Kiểm tra Object tồn tại
    await this.prismaService.object.delete({
      where: { id },
    });
    return true;
  }
}
