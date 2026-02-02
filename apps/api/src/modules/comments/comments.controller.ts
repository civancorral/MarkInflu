import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('versions/:versionId')
  @ApiOperation({ summary: 'Agregar comentario visual a versión' })
  async create(
    @Param('versionId') versionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.commentsService.create(versionId, userId, dto);
  }

  @Get('versions/:versionId')
  @ApiOperation({ summary: 'Comentarios de una versión' })
  async findByVersion(
    @Param('versionId') versionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.findByVersion(versionId, userId);
  }

  @Patch(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver comentario' })
  async resolve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.resolve(id, userId);
  }

  @Patch(':id/unresolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reabrir comentario' })
  async unresolve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.unresolve(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar comentario' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.delete(id, userId);
  }
}
