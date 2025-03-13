import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entity/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({ relations: ['children'] });
  }

  async findById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(dto);
    if (dto.parentId) {
      category.parent = await this.categoryRepository.findOne({ where: { id: dto.parentId } });
    }
    return this.categoryRepository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    Object.assign(category, dto);
    if (dto.parentId) {
      category.parent = await this.categoryRepository.findOne({ where: { id: dto.parentId } });
    }
    return this.categoryRepository.save(category);
  }

  async delete(id: number): Promise<boolean> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) return false; 
    await this.categoryRepository.remove(category);
    return true;
  }
}