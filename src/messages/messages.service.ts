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

  // ==================== PROCESS MESSAGE WITH AI - OPTIMIZADO ====================

  async sendMessageWithAIResponse(
    input: { prompt: string; chatId?: number },
    userId: number,
  ) {
    if (!input.prompt) {
      throw new BadRequestException('Prompt is required');
    }

    // Generar título en paralelo (no bloquear)
    const chatTitlePromise = this.generateChatTitle(input.prompt);

    let chat: Chat;

    if (input.chatId) {
      chat = await this.chatRepo.findOne({
        where: { id: input.chatId, userId },
        select: ['id', 'title', 'userId'],
      });

      if (!chat) {
        const chatTitle = await chatTitlePromise;
        chat = await this.createChat(userId, chatTitle);
      }
    } else {
      // Create new chat if not provided
      const chatTitle = await chatTitlePromise;
      chat = await this.createChat(userId, chatTitle);
    }

    // Obtener solo últimos 5 mensajes para contexto (no todo el historial)
    let recentMessages: any[] = [];
    if (input.chatId) {
      recentMessages = await this.messageRepo
        .createQueryBuilder('message')
        .select(['message.prompt', 'message.response'])
        .where('message.chatId = :chatId', { chatId: input.chatId })
        .orderBy('message.createdAt', 'DESC')
        .limit(5) // Solo últimos 5 mensajes para contexto
        .getMany();
      
      recentMessages = recentMessages.reverse(); // Ordenar ASC para contexto
    }

    const conversationHistory = recentMessages.map((msg) => ({
      prompt: msg.prompt,
      response: msg.response,
      createdAt: msg.createdAt,
    }));

    try {
      // Get AI response con contexto limitado (más rápido)
      const response = await this.groqService.generateEducationalChatResponse(
        input.prompt,
        undefined, // No enviar contexto JSON grande
        conversationHistory.length > 0 ? conversationHistory : undefined,
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
  // Obtener todos los chats del usuario - OPTIMIZADO SIN RELACIONES
  async getUserChats(userId: number) {
    // Solo cargar datos básicos del chat, SIN mensajes
    const chats = await this.chatRepo.find({
      where: { userId },
      select: ['id', 'title', 'createdAt', 'updatedAt'],
      order: { updatedAt: 'DESC' },
      take: 50, // Limitar a últimos 50 chats
    });

    // Contar mensajes con query separada más rápida
    const chatIds = chats.map(c => c.id);
    const messageCounts = chatIds.length > 0
      ? await this.messageRepo
          .createQueryBuilder('message')
          .select('message.chatId', 'chatId')
          .addSelect('COUNT(message.id)', 'count')
          .where('message.chatId IN (:...chatIds)', { chatIds })
          .groupBy('message.chatId')
          .getRawMany()
      : [];

    const countMap = new Map(messageCounts.map(mc => [mc.chatId, parseInt(mc.count)]));

    return chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      messageCount: countMap.get(chat.id) || 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));
  }

  // Obtener mensajes de un chat - OPTIMIZADO CON PAGINACIÓN
  async getChatMessages(chatId: number, userId: number) {
    // Verificar ownership primero
    const chat = await this.chatRepo.findOne({
      where: { id: chatId, userId },
      select: ['id', 'title'],
    });

    if (!chat) return null;

    // Cargar mensajes con query builder optimizado
    const messages = await this.messageRepo
      .createQueryBuilder('message')
      .select(['message.id', 'message.prompt', 'message.response', 'message.createdAt'])
      .where('message.chatId = :chatId', { chatId })
      .orderBy('message.createdAt', 'ASC')
      .limit(100) // Últimos 100 mensajes
      .getMany();

    return {
      chatId: chat.id,
      title: chat.title,
      messages: messages.map((msg) => ({
        id: msg.id,
        prompt: msg.prompt,
        response: msg.response,
        createdAt: msg.createdAt,
      })),
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
