import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
import { GroqService } from '../groq/groq.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
    private readonly groqService: GroqService,
  ) {}

  // Obtener o crear un chat para el usuario
  private async getOrCreateChat(userId: number): Promise<Chat> {
    let chat = await this.chatRepo.findOne({ where: { userId } });

    if (!chat) {
      chat = this.chatRepo.create({ userId, title: 'Nuevo Chat' });
      await this.chatRepo.save(chat);
    }

    return chat;
  }

  // Generar título del chat basado en el primer mensaje
  private async generateChatTitle(prompt: string): Promise<string> {
    return await this.groqService.generateChatTitleFromMessage(prompt);
  }

  // Create a new chat with custom title (public method for controller)
  async createChat(userId: number, title?: string): Promise<Chat> {
    const chat = this.chatRepo.create({
      userId,
      title: title || 'Nuevo Chat',
    });
    await this.chatRepo.save(chat);
    return chat;
  }

  // ==================== PROCESS MESSAGE WITH AI ====================

  async sendMessageWithAIResponse(
    input: { prompt: string; chatId?: number },
    userId: number,
  ) {
    if (!input.prompt) {
      throw new BadRequestException('Prompt is required');
    }

    const chatTitle = await this.generateChatTitle(input.prompt);

    let chat: Chat;

    if (input.chatId) {
      chat = await this.chatRepo.findOne({
        where: { id: input.chatId, userId },
      });

      if (!chat) {
        chat = await this.createChat(userId, chatTitle);
      }
    } else {
      // Create new chat if not provided
      chat = await this.createChat(userId, chatTitle);
    }

    // Obtener historial completo del chat para contexto
    let conversationHistory: any[] = [];
    if (input.chatId) {
      const chatWithMessages = await this.chatRepo.findOne({
        where: { id: input.chatId, userId },
        relations: ['messages'],
        order: {
          messages: {
            createdAt: 'ASC',
          },
        },
      });

      if (chatWithMessages && chatWithMessages.messages) {
        conversationHistory = chatWithMessages.messages.map((msg) => ({
          prompt: msg.prompt,
          response: msg.response,
          createdAt: msg.createdAt,
        }));
      }
    }

    const contexto = JSON.stringify(conversationHistory);

    try {
      // Get AI response using educational chat method con contexto completo
      const response = await this.groqService.generateEducationalChatResponse(
        input.prompt,
        contexto,
        conversationHistory,
      );

      if (!response) {
        throw new BadRequestException('Invalid AI response');
      }

      const createdAt = new Date().toISOString();

      // Save user message
      const userMessage = this.messageRepo.create({
        prompt: input.prompt,
        response: response.response,
        chat,
        userId,
        chatId: chat.id,
        createdAt,
      });
      return await this.messageRepo.save(userMessage);
    } catch (error) {
      throw new BadRequestException(
        `Failed to process message: ${error.message}`,
      );
    }
  }
  // Obtener todos los chats del usuario
  async getUserChats(userId: number) {
    const chats = await this.chatRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      relations: ['messages'],
    });

    return chats.map((chat) => ({
      id: (chat as any).id,
      title: chat.title,
      messageCount: (chat as any).messages?.length || 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));
  }

  // Obtener mensajes de un chat
  async getChatMessages(chatId: number, userId: number) {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId, userId },
      relations: ['messages'],
      order: {
        messages: {
          createdAt: 'ASC', // Old to new ordering
        },
      },
    });

    if (!chat) return null;

    return {
      chatId: (chat as any).id,
      title: chat.title,
      messages:
        (chat as any).messages?.map((msg) => ({
          id: (msg as any).id,
          prompt: msg.prompt,
          response: msg.response,
          createdAt: msg.createdAt,
        })) || [],
    };
  }

  // Eliminar un chat y sus mensajes
  async deleteChat(chatId: number, userId: number) {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId, userId },
    });

    if (!chat) return null;

    await this.messageRepo.delete({ chat });
    await this.chatRepo.delete(chatId);

    return { success: true, deletedChatId: chatId };
  }
}
