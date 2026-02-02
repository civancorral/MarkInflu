import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
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
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Mis conversaciones' })
  async getMyChats(@CurrentUser('id') userId: string) {
    return this.chatService.findUserChats(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Total de mensajes no leídos' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.chatService.getTotalUnreadCount(userId);
  }

  @Post('direct')
  @ApiOperation({ summary: 'Iniciar chat directo' })
  async createDirectChat(
    @CurrentUser('id') userId: string,
    @Body('recipientUserId') recipientUserId: string,
  ) {
    return this.chatService.createDirectChat(userId, { recipientUserId });
  }

  @Post('contract')
  @ApiOperation({ summary: 'Iniciar chat de contrato' })
  async createContractChat(
    @CurrentUser('id') userId: string,
    @Body('contractId') contractId: string,
  ) {
    return this.chatService.createContractChat(userId, { contractId });
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Detalle de chat' })
  async getChatById(
    @Param('chatId') chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.findById(chatId, userId);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Mensajes de un chat' })
  async getMessages(
    @Param('chatId') chatId: string,
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(chatId, userId, { cursor, limit });
  }

  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Enviar mensaje' })
  async sendMessage(
    @Param('chatId') chatId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { content: string; contentType?: string; attachments?: any; replyToMessageId?: string },
  ) {
    return this.chatService.sendMessage(chatId, userId, dto as any);
  }

  @Patch(':chatId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar chat como leído' })
  async markAsRead(
    @Param('chatId') chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.markAsRead(chatId, userId);
  }
}
