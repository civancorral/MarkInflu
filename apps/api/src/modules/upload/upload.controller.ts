import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Obtener URL presignada para subida' })
  async getPresignedUrl(
    @CurrentUser('id') userId: string,
    @Body() dto: { fileName: string; contentType: string; folder: string },
  ) {
    return this.uploadService.getPresignedUploadUrl(userId, {
      fileName: dto.fileName,
      contentType: dto.contentType,
      folder: dto.folder || 'uploads',
    });
  }

  @Delete(':key(*)')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar archivo' })
  async deleteFile(@Param('key') key: string) {
    await this.uploadService.deleteFile(key);
    return { deleted: true };
  }
}
