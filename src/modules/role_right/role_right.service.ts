import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { CreateRoleRightDto } from "./dto/create-role-right.dto";
import { UpdateRoleRightDto } from "./dto/update-role_right.dto";
import { FindRoleRightDto } from "./dto/find-role-right.dto";

@Injectable()
export class RoleRightService {
  constructor(private readonly prismaService: PrismaService) {}

  // Tạo mới mối quan hệ vai trò - quyền
  async create(createRoleRightDto: CreateRoleRightDto): Promise<any> {
    try {
      const createdRoleRight = await this.prismaService.roleRight.create({
        data: {
          ...createRoleRightDto,
          createdDate: new Date(), // Thêm ngày tạo
        },
      });
      return createdRoleRight;
    } catch (error) {
      console.error("Lỗi khi tạo mối quan hệ vai trò - quyền:", error);
      throw error;
    }
  }

  // Lấy tất cả mối quan hệ vai trò - quyền
  async findAllRoleRight(
    findDto: FindRoleRightDto
  ): Promise<{ rows: any[]; count: number }> {
    const { page = 1, size = 10, keyword } = findDto;
  
    const skip = (page - 1) * size;

    const [rows, count] = await Promise.all([
      this.prismaService.roleRight.findMany({
        skip,
        take: size !== -1 ? size : undefined,
        orderBy: {
          createdDate: "desc",
        },
        include: {
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          right: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      this.prismaService.roleRight.count(),
    ]);

    return { rows, count };
  }

  // Lấy một mối quan hệ vai trò - quyền
  async findOne(id: number): Promise<any> {
    const roleRight = await this.prismaService.roleRight.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        right: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!roleRight) {
      throw new NotFoundException("Mối quan hệ vai trò - quyền không tồn tại");
    }

    return roleRight;
  }

  // Cập nhật mối quan hệ vai trò - quyền
  async update(
    id: number,
    updateRoleRightDto: UpdateRoleRightDto
  ): Promise<any> {
    try {
      const existingRoleRight = await this.findOne(id);
      if (!existingRoleRight) {
        throw new NotFoundException("Mối quan hệ vai trò - quyền không tồn tại");
      }

      const updatedRoleRight = await this.prismaService.roleRight.update({
        where: { id },
        data: {
          ...updateRoleRightDto,
          updatedDate: new Date(), // Thêm ngày cập nhật
        },
      });

      return updatedRoleRight;
    } catch (error) {
      console.error("Lỗi khi cập nhật mối quan hệ vai trò - quyền:", error);
      throw error;
    }
  }

  // Xóa mối quan hệ vai trò - quyền
  async remove(id: number): Promise<boolean> {
    try {
      await this.findOne(id); // Kiểm tra xem có tồn tại không
      await this.prismaService.roleRight.delete({ where: { id } });
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa mối quan hệ vai trò - quyền:", error);
      throw error;
    }
  }
}
