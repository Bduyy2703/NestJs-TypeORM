import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  Query,
  BadRequestException,
  Delete,
  Put,
} from '@nestjs/common';
import { BlogsService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { Request } from 'express';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../cores/decorators/public.decorator';
import { Actions } from 'src/cores/decorators/action.decorator';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';

@Controller('blogs')
@ApiTags('Blogs')
@ApiSecurity('JWT-auth')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) { }

  /**
   * [ADMIN, USER] Can find all blogs by user ID
   */
  @Get('user/:id/blogs')
  @Actions('read')
  @Objectcode('BLOG01')
  @ApiOperation({
    summary: 'Find all blogs by user ID',
    description: 'Endpoint để lấy danh sách bài viết của một user cụ thể dựa trên ID.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID của user để tìm bài viết',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async findAllByIdUser(
    @Param('id') id: string,
  ) {
    console.log('User ID:', id);
    return await this.blogsService.findAllByUserId(id);
  }

  /**
   * [ADMIN, USER] Can create blog but ADMIN must approve user'blog (done)
   */
  @Post('create')
  @Actions('execute')
  @Objectcode('BLOG01')
  async requestCreate(
    @Body() createBlogDto: CreateBlogDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;

    return await this.blogsService.requestCreate(userId, createBlogDto);
  }

  /**
   * [ADMIN , USER ] Can Update Blog and defautl pending_approve (done)
   */
  @Put(':id/blogs')
  @Objectcode('BLOG01')
  @Actions('execute')
  @ApiOperation({
    summary: 'Update a blog',
    description: 'Endpoint để cập nhật một bài viết. Chỉ USER sở hữu bài viết hoặc ADMIN có quyền thực hiện.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID của bài viết cần cập nhật',
    example: 1,
  })
  // fix 
  // async update(
  //   @Param('id') id: number,
  //   @Req() req: Request,
  //   @Body() data: UpdateBlogDto,
  // ) {
  //   const { userId, role } = req.user as any; // Lấy thông tin user từ JWT
  //   return await this.blogsService.update(id, userId, role, data);
  // }

  /**
   * [ADMIN] Approve delete request from user (done)
   */
  @Delete(':id/blogs')
  @Objectcode('BLOG01')
  @Actions('delete')
  async delete(@Param('id') id: number) {
    return await this.blogsService.delete(id);
  }
}
