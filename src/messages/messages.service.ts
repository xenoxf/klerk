import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
import { GroqService } from 'src/groq/groq.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    @InjectRepository(Chat) private readonly chatRepo: Repository<Chat>,
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

  // Enviar mensaje y obtener respuesta de IA
  async sendMessage(prompt: string, userId: number, chatId: number) {
    // Obtener o crear el chat
    let chat = await this.chatRepo.findOne({ where: { userId, id: chatId } });
    let isNewChat = false;

    if (!chat) {
      isNewChat = true;
      const title = await this.generateChatTitle(prompt);
      chat = this.chatRepo.create({ userId, title });
      await this.chatRepo.save(chat);
    }

    // Obtener historial de mensajes del chat
    const history = await this.messageRepo.find({
      where: { chat },
      order: { createdAt: 'ASC' },
    });

    // Construir historial de conversación
    const conversationHistory = history.map((msg) => [
      { role: 'user' as const, content: (msg as any).message || (msg as any).prompt || '' },
      { role: 'assistant' as const, content: (msg as any).response || '' },
    ]).flat();

    // Obtener respuesta de IA
    const systemPrompt =
      'Eres un asistente educativo experto. Proporciona respuestas claras, precisas y educativas. Sé conciso pero detallado cuando sea necesario.';

    const response = await this.groqService.chatWithHistory(
      [...conversationHistory, { role: 'user', content: prompt }],
      systemPrompt,
    );

    // Crear y guardar el mensaje
    const newMessage = this.messageRepo.create({
      message: prompt,
      response,
      userId,
      chat,
    } as any);
    await this.messageRepo.save(newMessage);

    return {
      success: true,
      isNewChat,
      chat: {
        id: (chat as any).id,
        title: chat.title,
      },
      message: {
        id: (newMessage as any).id,
        prompt,
        response,
        createdAt: (newMessage as any).createdAt,
      },
    };
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
    });

    if (!chat) return null;

    return {
      chatId: (chat as any).id,
      title: chat.title,
      messages: (chat as any).messages?.map((msg) => ({
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
