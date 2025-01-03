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
  } from '@nestjs/common';
  import { BlogsService } from './blog.service';
  import { CreateBlogDto } from './dto/create-blog.dto';
  import { Request } from 'express';
  import { ApiBody, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
  import { Roles } from '../../cores/decorators/roles.decorator';
  import { Role } from '../../common/enums/env.enum';
  import { StatusDto } from './dto/status.dto';
  import { Public } from '../../cores/decorators/public.decorator';
  import { BlogActionsDto } from './dto/actions.dto';
  
  @Controller('blogs')
  @ApiTags('Blogs')
  @ApiSecurity('JWT-auth')
  export class BlogsController {
    constructor(private readonly blogsService: BlogsService) {}
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
    @Roles(Role.ADMIN)
    async findAllByStatus(@Query() query: StatusDto) {
      console.log("query",query)
      return await this.blogsService.findAllByStatus(query.status);
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
    @Roles(Role.ADMIN, Role.USER)
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'A Sample Blog Title' },
          content: { type: 'string', example: 'This is the content of the blog.' },
        },
        required: ['title', 'content'],
      },
    })
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
    @Roles(Role.ADMIN, Role.USER)
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
    @Roles(Role.ADMIN)
    async blogActions(@Query() query: BlogActionsDto, @Param('id') id: number) {
      return await this.blogsService.blogActions(id, query.action);
    }
  
    /**
     * [ADMIN, USER] Can delete blog but ADMIN must approve user'blog (done)
     */
    @Patch(':id/requestDelete')
    @Roles(Role.ADMIN, Role.USER)
    async requestDelete(@Param('id') id: number, @Req() req: Request) {
      const { userId } = req.user as any;
  
      return await this.blogsService.requestDelete(id, userId);
    }
  
    /**
     * [ADMIN] Approve delete request from user (done)
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    async delete(@Param('id') id: number) {
      return await this.blogsService.delete(id);
    }
  }
  