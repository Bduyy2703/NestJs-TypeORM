import { Controller, Get, Param, Delete, Req } from '@nestjs/common';
import { CommentsService } from './comment.service';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';

@Controller('comments')
@ApiTags('Comments')
@ApiSecurity('JWT-auth')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}
  /**
   * [ADMIN, USER] can delete its own comment
   */
  @Delete(':id')
  @Objectcode('COMMENT')
  async delete(@Param('id') id: number, @Req() req: Request) {
    const { userId } = req.user as any;

    return await this.commentsService.delete(userId, id);
  }
}
