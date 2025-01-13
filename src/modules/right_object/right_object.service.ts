import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, RightObject } from "prisma/prisma-client";
import { CreateRightObjectDto } from "./dto/create-right-object.dto";
import { UpdateRightObjectDto } from "./dto/update-right-object.dto";

import { FindRightObjectDto } from "./dto/find-right-object.dto";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class RightObjectService {
  constructor(
    private readonly prismaService: PrismaService
  ) {}

  async create(
    createRightObjectDto: CreateRightObjectDto
  ): Promise<RightObject> {
    try {
      createRightObjectDto.createdDate = new Date();
      const rightObject = await this.prismaService.rightObject.create(
        {
          data: createRightObjectDto
        } 
      );
      return rightObject;
    } catch (error) {
      console.error("Lỗi khi tạo quan hệ quyền-đối tượng:", error);
      throw error;
    }
  }

  async findAll(
    findDto: FindRightObjectDto
  ): Promise<{ rows: RightObject[]; count: number }> {
    const { page = 1, size = 10, ...filter } = findDto;

    const skip = (page - 1) * size;
    const take = size !== -1 ? size : undefined;

    const [rows, count] = await this.prismaService.$transaction([
      this.prismaService.rightObject.findMany({
        where: filter as Prisma.RightObjectWhereInput,
        skip,
        take,
        orderBy: { createdDate: "desc" },
        include: {
          object: { select: { id: true, code: true, name: true } },
          right: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prismaService.rightObject.count({
        where: filter as Prisma.RightObjectWhereInput,
      }),
    ]);

    return { rows, count };
  }

  async findOne(id: number): Promise<RightObject> {
    const rightObject = await this.prismaService.rightObject.findUnique({
      where: { id },
      include: {
        object: { select: { id: true, code: true, name: true } },
        right: { select: { id: true, code: true, name: true } },
      },
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
    await this.findOne(id); // Kiểm tra tồn tại

    const rightObject = await this.prismaService.rightObject.update({
      where: { id },
      data: {
        ...updateRightObjectDto,
        updatedDate: new Date(),
      },
    });

    return rightObject;
  }

  async remove(id: number): Promise<boolean> {
    await this.findOne(id); // Kiểm tra tồn tại

    await this.prismaService.rightObject.delete({ where: { id } });
    return true;
  }
}