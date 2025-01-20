import { Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "./entities/t_role";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) { }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {

      createRoleDto.createdAt = new Date();
      const newRole = this.roleRepository.create(createRoleDto);
      return await this.roleRepository.save(newRole);
    } catch (error) {
      console.log("Error creating role:", error);
      throw error;
    }
  }

  async findByName(roleName: string) {
    const role = await this.roleRepository.findOne({ where: { code: roleName } });
    return role;
  }

  async findOne(id: number): Promise<Role> {
    try {

      const role = await this.roleRepository.findOne({ where: { id } });

      if (!role) {
        throw new NotFoundException("Vai trò không tồn tại");
      }

      return role;
    } catch (error) {
      console.log(`Error finding role with ID ${id}:`, error);
      throw error;
    }
  }


  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {

      const existingRole = await this.findOne(id);

      updateRoleDto.updateddate = new Date();

      const updatedRole = this.roleRepository.merge(existingRole, updateRoleDto);
      return await this.roleRepository.save(updatedRole);
    } catch (error) {
      console.error(`Error updating role with ID ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number): Promise<boolean> {
    try {
      const existingRole = await this.findOne(id); 

      await this.roleRepository.remove(existingRole); 
      return true;
    } catch (error) {
      console.error(`Lỗi khi xóa vai trò với ID ${id}:`, error);
      throw error;
    }
  }
}
