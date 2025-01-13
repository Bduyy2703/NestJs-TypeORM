import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { Right } from "@prisma/client";
import { CreateRightDto } from "./dto/create-right.dto";
import { UpdateRightDto } from "./dto/update-right.dto";

@Injectable()
export class RightService {
  constructor(private readonly prismaService: PrismaService) { }
  async create(createRightDto: CreateRightDto): Promise<Right> {
    try {
      createRightDto.createdDate = new Date();
      const right = await this.prismaService.right.create({
        data: createRightDto,
      });
      return right;
    } catch (error) {
      console.error("Error creating right:", error);
      throw error;
    }
  }

  async findOne(id: number): Promise<Right> {
    const right = await this.prismaService.right.findUnique({where  : { id }},);
    if (!right) {
      throw new NotFoundException("Quyền không tồn tại");
    }
    return right;
  }

  async update(id: number, updateRightDto: UpdateRightDto): Promise<Right> {
    const existingRight = await this.findOne(id);
    updateRightDto.updateddate = new Date();
    const updatedRight = await this.prismaService.right.update({
      where: { id },
      data: updateRightDto,
    });
    return updatedRight;
  }

  async remove(id: number): Promise<boolean> {
    await this.findOne(id);
    await this.prismaService.right.delete({
      where: { id },
    });
    return true;
  }
}
