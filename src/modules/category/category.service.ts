import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      .leftJoinAndSelect('category.children', 'children') // Lấy danh mục con
      .where('category.parent IS NULL') // Chỉ lấy danh mục cha
      .orderBy('category.id', 'ASC') // Sắp xếp theo ID
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
    // 🔹 Tìm danh mục cần cập nhật
    const existingCategory = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'], // Lấy thông tin danh mục cha nếu có
    });

    if (!existingCategory) {
      throw new NotFoundException('Danh mục không tồn tại!');
    }

    // 🔹 Kiểm tra nếu `slug` bị trùng lặp
    if (updateData.slug) {
      const slugExists = await this.categoryRepository.findOne({ where: { slug: updateData.slug } });
      if (slugExists && slugExists.id !== id) {
        throw new ConflictException('Slug đã tồn tại!');
      }
    }

    // 🔹 Xử lý quan hệ cha - con nếu `parentId` được gửi
    let newParent: Category | null = null;
    if (updateData.parentId) {
      newParent = await this.categoryRepository.findOne({ where: { id: updateData.parentId } });

      if (!newParent) {
        throw new NotFoundException('Danh mục cha không tồn tại!');
      }
      // Ngăn chặn tự làm cha của chính nó
      if (updateData.parentId === id) {
        throw new BadRequestException('Danh mục không thể là cha của chính nó!');
      }
      // Kiểm tra vòng lặp cha - con
      let parentCheck = newParent;
      while (parentCheck) {
        if (parentCheck.id === id) {
          throw new BadRequestException('Không thể cập nhật: Danh mục cha sẽ tạo vòng lặp!');
        }
        parentCheck = parentCheck.parent;
      }
    }
    // 🔹 Cập nhật danh mục (Dùng `parent` thay vì `parentId`)
    await this.categoryRepository.update(id, {
      name : updateData.name,
      slug : updateData.slug,
      parent: newParent || null, // Nếu không có `parentId`, cập nhật thành `null`
    });
    console.log(1111111111111)
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'], // Trả về đầy đủ dữ liệu quan hệ
    });
  }

  async delete(id: number): Promise<boolean> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) return false;
    await this.categoryRepository.remove(category);
    return true;
  }
  async findProductsByCategoryId(categoryId: number): Promise<Product[]> {
    const products = await this.productRepository.find({
      where: { category: { id: categoryId } },
      relations: ["category"],
    });

    for (const product of products) {
      const images = await this.fileRepository.find({
        where: { targetId: product.id, targetType: 'product' },
      });
      (product as any).images = images.map(file => file.fileUrl); 
    }

    return products;
  }
  
}