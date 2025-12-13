import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
import { GroqService } from '../groq/groq.service';
import { title } from 'process';

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
    const instruction = `Genera un título corto (máximo 8 palabras) y descriptivo para un chat educativo basado en esta pregunta: "${prompt}". Responde SOLO con el título, sin comillas ni explicación adicional.`;
    const title = await this.groqService.chat(instruction);
    return title.trim();
  }

  // ==================== PROCESS MESSAGE WITH AI ====================

  async sendMessageWithAIResponse(
    input: { prompt: string; chatId?: number },
    userId: number,
  ) {
    if (!input.prompt) {
      throw new BadRequestException('Prompt is required');
    }

    let chat: Chat;

    if (input.chatId) {
      chat = await this.chatRepo.findOne({
        where: { id: input.chatId, userId },
      });

      if (!chat) {
        chat = await this.createChat(userId, title);
      }
    } else {
      // Create new chat if not provided
      chat = await this.createChat(userId, title);
    }

    try {
      // Get AI response
      const aiResponse = await this.groqService.chatMessage(input.prompt);

      if (!aiResponse || typeof aiResponse !== 'object') {
        throw new BadRequestException('Invalid AI response');
      }
      const createdAt = new Date().toISOString();

      const responseText =
        typeof aiResponse === 'object'
          ? JSON.stringify(aiResponse)
          : String(aiResponse);

      // Save user message
      const userMessage = this.messageRepo.create({
        prompt: input.prompt,
        response: responseText,
        chat,
        userId,
        chatId: chat.id,
        createdAt,
      });
      await this.messageRepo.save(userMessage);

      // Save AI response message
      const aiMessage = this.messageRepo.create({
        prompt: input.prompt,
        response: `[AI]: ${responseText}`,
        chat,
        userId,
        createdAt,
      });
      await this.messageRepo.save(aiMessage);

      return userMessage;
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

  async createChat(userId: number, title: string) {
    const chat = this.chatRepo.create({
      title,
      userId,
      createdAt: new Date().toISOString(),
    });
    return this.chatRepo.save(chat);
  }

  // Obtener mensajes de un chat
  async getChatMessages(chatId: number, userId: number) {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId, userId },
      relations: ['messages'],
    });

    if (!chat) return null;

    return {
      chatId: (chat as any).id,
      title: chat.title,
      messages:
        (chat as any).messages?.map((msg) => ({
          id: (msg as any).id,
          prompt: msg.mensaje,
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
