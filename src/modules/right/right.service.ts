import { Injectable, NotFoundException } from "@nestjs/common";
import { Right } from "./entities/t_right";
import { CreateRightDto } from "./dto/create-right.dto";
import { UpdateRightDto } from "./dto/update-right.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
@Injectable()
export class RightService {
  constructor(
    @InjectRepository(Right)
    private readonly rightRepository: Repository<Right>,
  ) { }

  async create(createRightDto: CreateRightDto): Promise<Right> {
    try {
      createRightDto.createdDate = new Date();
      const newRight = this.rightRepository.create(createRightDto);
      return await this.rightRepository.save(newRight);
    } catch (error) {
      console.error("Error creating right:", error);
      throw error;
    }
  }

  async findOne(id: number): Promise<Right> {
    const right = await this.rightRepository.findOne({ where: { id } });

    if (!right) {
      throw new NotFoundException("Quyền không tồn tại");
    }
    return right;
  }

  async update(id: number, updateRightDto: UpdateRightDto): Promise<Right> {
    const existingRight = await this.findOne(id); 
    updateRightDto.updatedDate = new Date();
    const updatedRight = this.rightRepository.merge(existingRight, updateRightDto); // Gộp dữ liệu mới vào đối tượng hiện có
    return await this.rightRepository.save(updatedRight); 
  }

  async remove(id: number): Promise<boolean> {
    const existingRight = await this.findOne(id);
    await this.rightRepository.remove(existingRight);
    return true;
  }
}
