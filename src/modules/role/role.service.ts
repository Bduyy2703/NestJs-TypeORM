import { Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "prisma/prisma-client";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {

      createRoleDto.createdAt = new Date();

      const role = await this.prismaService.role.create({
        data: createRoleDto,
      });

      return role;
    } catch (error) {
      console.error("Error creating role:", error);
      throw error;
    }
  }

  async findByName(roleName: string) {
    return await this.prismaService.role.findUnique({
      where: { code: roleName },
    });
  }
  async findOne(id: number): Promise<Role> {
    try {

      const role = await this.prismaService.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException("Vai trò không tồn tại");
      }

      return role;
    } catch (error) {
      console.error(`Error finding role with ID ${id}:`, error);
      throw error;
    }
  }


  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {

      await this.findOne(id);

      updateRoleDto.updateddate = new Date();

      const updatedRole = await this.prismaService.role.update({
        where: { id },
        data: updateRoleDto,
      });

      return updatedRole;
    } catch (error) {
      console.error(`Error updating role with ID ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number): Promise<boolean> {
    try {
      await this.findOne(id);

      await this.prismaService.role.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      console.error(`Error removing role with ID ${id}:`, error);
      throw error;
    }
  }
}
