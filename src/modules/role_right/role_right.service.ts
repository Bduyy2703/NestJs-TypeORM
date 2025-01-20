import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateRoleRightDto } from "./dto/create-role-right.dto";
import { UpdateRoleRightDto } from "./dto/update-role_right.dto";
import { FindRoleRightDto } from "./dto/find-role-right.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RoleRight } from "./entities/t_role_right";
import { Role } from "../role/entities/t_role";
import { Right } from "../right/entities/t_right";
@Injectable()
export class RoleRightService {
  constructor(
    @InjectRepository(RoleRight)
    private readonly roleRightRepository: Repository<RoleRight>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Right)
    private readonly rightRepository: Repository<Right>
  ) { }

  // Tạo mới mối quan hệ vai trò - quyền
  async create(createRoleRightDto: CreateRoleRightDto): Promise<RoleRight> {
    try {
      const newRoleRight = this.roleRightRepository.create({
        ...createRoleRightDto,
        createdDate: new Date(), // Thêm ngày tạo
      });
      return await this.roleRightRepository.save(newRoleRight);
    } catch (error) {
      console.error("Lỗi khi tạo mối quan hệ vai trò - quyền:", error);
      throw error;
    }
  }

  // Lấy tất cả mối quan hệ vai trò - quyền
  async findAllRoleRight(
    findDto: FindRoleRightDto
  ): Promise<{ rows: RoleRight[]; count: number }> {
    const { page = 1, size = 10 } = findDto;

    const skip = (page - 1) * size;

    const [rows, count] = await Promise.all([
      this.roleRightRepository.find({
        skip,
        take: size !== -1 ? size : undefined,
        order: { createdDate: "DESC" },
        relations: ["role", "right"],
      }),
      this.roleRightRepository.count(),
    ]);
    return { rows, count };
  }

  // Lấy một mối quan hệ vai trò - quyền
  async findOne(id: number): Promise<RoleRight> {
    const roleRight = await this.roleRightRepository.findOne({
      where: { id },
      relations: ["role", "right"],
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
  ): Promise<RoleRight> {
    try {
      const existingRoleRight = await this.findOne(id);
      if (!existingRoleRight) {
        throw new NotFoundException("Mối quan hệ vai trò - quyền không tồn tại");
      }

      const updatedRoleRight = await this.roleRightRepository.merge(
        existingRoleRight,
        updateRoleRightDto,
        { updatedDate: new Date() } // Thêm ngày cập nhật
      );

      return await this.roleRightRepository.save(updatedRoleRight);
    } catch (error) {
      console.error("Lỗi khi cập nhật mối quan hệ vai trò - quyền:", error);
      throw error;
    }
  }

  // Xóa mối quan hệ vai trò - quyền
  async remove(id: number): Promise<boolean> {
    try {
      const existingRoleRight = await this.findOne(id);
      await this.roleRightRepository.remove(existingRoleRight);
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa mối quan hệ vai trò - quyền:", error);
      throw error;
    }
  }
}
