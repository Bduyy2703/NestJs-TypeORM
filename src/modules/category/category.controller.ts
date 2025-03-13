import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { CategoryService } from './category.service';
  import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
  import { ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';
  import { Public } from '../../cores/decorators/public.decorator';
  import { Actions } from 'src/cores/decorators/action.decorator';
  import { Objectcode } from 'src/cores/decorators/objectcode.decorator';
  
  @Controller('categories')
  @ApiTags('Categories')
  @ApiSecurity('JWT-auth')
  export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}
  
    // 📌 Lấy tất cả danh mục
    @Get()
    @Public()
    async getAll() {
      try {
        const categories = await this.categoryService.findAll();
        return {
          statusCode: HttpStatus.OK,
          message: 'Lấy danh sách danh mục thành công',
          data: categories,
        };
      } catch (error) {
        throw new HttpException(
          { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Lỗi hệ thống' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    // 📌 Lấy danh mục theo ID
    @Public()
    @Get(':id')
    async getById(@Param('id') id: number) {
      try {
        const category = await this.categoryService.findById(id);
        if (!category) {
          throw new HttpException(
            { statusCode: HttpStatus.NOT_FOUND, message: 'Danh mục không tồn tại' },
            HttpStatus.NOT_FOUND,
          );
        }
        return {
          statusCode: HttpStatus.OK,
          message: 'Lấy danh mục thành công',
          data: category,
        };
      } catch (error) {
        throw new HttpException(
          { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Lỗi hệ thống' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    // 📌 Tạo danh mục
    @Post()
    @Actions('create')
    @Objectcode('CATE01')
    @ApiBody({ type: CreateCategoryDto })
    async create(@Body() dto: CreateCategoryDto) {
      try {
        const newCategory = await this.categoryService.create(dto);
        return {
          statusCode: HttpStatus.CREATED,
          message: 'Tạo danh mục thành công',
          data: newCategory,
        };
      } catch (error) {
        throw new HttpException(
          { statusCode: HttpStatus.BAD_REQUEST, message: 'Không thể tạo danh mục' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  
    // 📌 Cập nhật danh mục
    @Put(':id')
    @Actions('update')
    @Objectcode('CATE01')
    @ApiBody({ type: UpdateCategoryDto })
    async update(@Param('id') id: number, @Body() dto: UpdateCategoryDto) {
      try {
        const updatedCategory = await this.categoryService.update(id, dto);
        if (!updatedCategory) {
          throw new HttpException(
            { statusCode: HttpStatus.NOT_FOUND, message: 'Danh mục không tồn tại' },
            HttpStatus.NOT_FOUND,
          );
        }
        return {
          statusCode: HttpStatus.OK,
          message: 'Cập nhật danh mục thành công',
          data: updatedCategory,
        };
      } catch (error) {
        throw new HttpException(
          { statusCode: HttpStatus.BAD_REQUEST, message: 'Không thể cập nhật danh mục' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  
    // 📌 Xóa danh mục
    @Delete(':id')
    @Actions('delete')
    @Objectcode('CATE01')
    async delete(@Param('id') id: number) {
      try {
        const result = await this.categoryService.delete(id);
        if (!result) {
          throw new HttpException(
            { statusCode: HttpStatus.NOT_FOUND, message: 'Danh mục không tồn tại' },
            HttpStatus.NOT_FOUND,
          );
        }
        return {
          statusCode: HttpStatus.OK,
          message: 'Xóa danh mục thành công',
        };
      } catch (error) {
        throw new HttpException(
          { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Lỗi hệ thống' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
  