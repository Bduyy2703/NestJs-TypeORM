import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from './entity/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Product } from '../product/entity/product.entity';
import { File } from '../files/file.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) { }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children') 
      .where('category.parent IS NULL') 
      .orderBy('category.id', 'ASC')
      .getMany();
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
  
  async updateCategory(id: number, updateData: UpdateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'], 
    });

    if (!existingCategory) {
      throw new NotFoundException('Danh mục không tồn tại!');
    }

    if (updateData.slug) {
      const slugExists = await this.categoryRepository.findOne({ where: { slug: updateData.slug } });
      if (slugExists && slugExists.id !== id) {
        throw new ConflictException('Slug đã tồn tại!');
      }
    }

    let newParent: Category | null = null;
    if (updateData.parentId) {
      newParent = await this.categoryRepository.findOne({ where: { id: updateData.parentId } });

      if (!newParent) {
        throw new NotFoundException('Danh mục cha không tồn tại!');
      }

      if (updateData.parentId === id) {
        throw new BadRequestException('Danh mục không thể là cha của chính nó!');
      }

      let parentCheck = newParent;
      while (parentCheck) {
        if (parentCheck.id === id) {
          throw new BadRequestException('Không thể cập nhật: Danh mục cha sẽ tạo vòng lặp!');
        }
        parentCheck = parentCheck.parent;
      }
    }

    await this.categoryRepository.update(id, {
      name : updateData.name,
      slug : updateData.slug,
      parent: newParent || null, 
    });
    console.log(1111111111111)
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'], 
    });
  }

  async delete(id: number): Promise<boolean> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) return false;
    await this.categoryRepository.remove(category);
    return true;
  }

  async findProductsByCategoryId(categoryId: number): Promise<Product[]> {
    const childCategories = await this.categoryRepository.find({
      where: { parent: { id: categoryId } },
    });
  
    const categoryIds = [categoryId, ...childCategories.map(c => c.id)];
    const products = await this.productRepository.find({
      where: { category: { id: In(categoryIds) } },
      relations: ["category"],
    });
  
    for (const product of products) {
      const images = await this.fileRepository.find({
        where: { targetId: product.id, targetType: "product" },
      });
      (product as any).images = images.map((file) => file.fileUrl);
    }
  
    return products;
  }  
  
}