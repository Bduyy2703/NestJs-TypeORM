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
import { StatusDto } from './dto/status.dto';
import { Public } from '../../cores/decorators/public.decorator';
import { BlogActionsDto } from './dto/actions.dto';
import { Actions } from 'src/cores/decorators/action.decorator';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';

@Controller('blogs')
@ApiTags('Blogs')
@ApiSecurity('JWT-auth')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) { }

  /**
   * [VIEWER] Can see all blogs that is approved (done)
   */
  @Public()
  @Get('/viewer/all')
  @ApiOkResponse({
    schema: {
      example: {
        title: 'string',
        content: 'string',
        createAt: '2024-03-19T19:12:29.894Z',
        author: {
          username: 'string',
        },
        comments: [
          {
            author: 'string',
            content: 'string',
            createAt: '2024-03-19T19:15:21.395Z',
          },
        ],
      },
    },
  })
  async findApprovedBlogs() {
    return await this.blogsService.findApprovedBlogs();
  }

  /**
   * [ADMIN] Can find all blogs with query ?status (done)
   */
  @Get('admin/all')
  @Actions('read')
  @Objectcode('BLOG01')
  async findAllByStatus(@Query() query: StatusDto) {
    console.log("query", query)
    return await this.blogsService.findAllByStatus(query.status);
  }

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
   * [EVERYONE] Can see blog and comments of this blog
   */
  @Public()
  @Get(':id/comments')
  async findAllCommentsOfBlog(@Param('id') id: number) {
    return await this.blogsService.allCommentsOfBlog(id);
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
   * [ADMIN, USER] Can comment a blog (done)
   */
  @Post(':id/comment')
  @Objectcode('BLOG01')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
        },
      },
    },
  })
  async commentOnBlog(
    @Param('id') id: number,
    @Req() req: Request,
    @Body('content') content: string,
  ) {
    if (!content) throw new BadRequestException('Comment do not empty !');

    const { userId } = req.user as any;

    return await this.blogsService.commentOnBlog({
      id,
      authorId: userId,
      content,
    });
  }

  /**
   * [ADMIN] approve or delete blogs (done)
   */
  @Patch(':id/create/approve-blog')
  @Actions('update')
  @Objectcode('BLOG01')
  async blogActions(@Query() query: BlogActionsDto, @Param('id') id: number) {
    return await this.blogsService.blogActions(id, query.action);
  }

  /**
   * [ADMIN, USER] Can delete blog but ADMIN must approve user'blog (done)
   */
  @Patch(':id/requestDelete')
  @Actions('execute')
  @Objectcode('BLOG01')
  async requestDelete(@Param('id') id: number, @Req() req: Request) {
    const { userId } = req.user as any;

    return await this.blogsService.requestDelete(id, userId);
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
