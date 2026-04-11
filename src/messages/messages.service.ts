import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
import { GeminiService } from '../gemini/gemini.service';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);
  
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
    private readonly geminiService: GeminiService,
    private readonly creditsService: CreditsService,
  ) {}

  // Generar título del chat basado en el primer mensaje
  private async generateChatTitle(prompt: string): Promise<string> {
    return await this.geminiService.generateChatTitleFromMessage(prompt);
  }

  // Streaming SSE endpoint for chat
  async *sendMessageStream(
    input: { prompt: string; chatId?: number },
    userId: number,
  ): AsyncIterableIterator<string> {
    if (!input.prompt) {
      throw new BadRequestException('Prompt is required');
    }

    // Check credits BEFORE consuming - return early if insufficient
    const creditStatus = await this.creditsService.consumeCredits(
      userId,
      'CHAT_MESSAGE',
    );

    // Only create a new chat when NO chatId is provided
    // If chatId IS provided, reuse that chat (don't create a new one)
    let chat: Chat | null = null;

    if (input.chatId) {
      // User is sending to an existing chat - reuse it, don't create new
      chat = await this.chatRepo.findOne({
        where: { id: input.chatId, userId },
        select: ['id', 'title', 'userId'],
      });
      // If the chat doesn't exist, we'll create one with the provided ID as reference
      // This handles the case where the user deleted the chat on frontend but it exists on backend
      if (!chat) {
        chat = await this.chatRepo.findOne({
          where: { id: input.chatId },
          select: ['id', 'title', 'userId'],
        });
        // If chat belongs to another user, create a new one for this user
        if (chat && chat.userId !== userId) {
          const chatTitle = await this.generateChatTitle(input.prompt).catch(
            () => 'Nuevo Chat',
          );
          chat = await this.createChat(userId, chatTitle);
        } else if (!chat) {
          // Chat doesn't exist at all - create a new one
          const chatTitle = await this.generateChatTitle(input.prompt).catch(
            () => 'Nuevo Chat',
          );
          chat = await this.createChat(userId, chatTitle);
        }
      }
    } else {
      // No chatId - this is a new conversation
      const chatTitle = await this.generateChatTitle(input.prompt).catch(
        () => 'Nuevo Chat',
      );
      chat = await this.createChat(userId, chatTitle);
    }

    // Get conversation context from the ACTUAL chat being used
    let recentMessages: any[] = [];
    if (chat) {
      recentMessages = await this.messageRepo
        .createQueryBuilder('message')
        .select(['message.prompt', 'message.response'])
        .where('message.chatId = :chatId', { chatId: chat.id })
        .orderBy('message.createdAt', 'DESC')
        .limit(5)
        .getMany();
      recentMessages = recentMessages.reverse();
    }

    const conversationHistory = recentMessages.map((msg) => ({
      prompt: msg.prompt,
      response: msg.response,
      createdAt: msg.createdAt,
    }));

    // Yield credits info first
    yield `data: ${JSON.stringify({ type: 'credits', remaining: creditStatus.remaining, total: creditStatus.total })}\n\n`;

    let fullResponse = '';
    let aiError: Error | null = null;

    try {
      const aiStream =
        this.geminiService.generateEducationalChatResponseStream(
          input.prompt,
          conversationHistory.length > 0 ? conversationHistory : undefined,
        );

      for await (const chunk of aiStream) {
        fullResponse += chunk;
        yield `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`;
      }
    } catch (error) {
      aiError = error as Error;
      this.logger.error(`AI stream failed: ${aiError?.message}`);
      // Don't rethrow - we'll save whatever response we have
    }

    // If AI failed completely, provide a friendly fallback
    if (!fullResponse.trim()) {
      fullResponse =
        aiError?.message ||
        'Lo siento, estoy teniendo dificultades técnicas en este momento. Por favor, intenta de nuevo en unos segundos.';
      yield `data: ${JSON.stringify({ type: 'chunk', content: fullResponse })}\n\n`;
    }

    // Save the message (even if it's a fallback response)
    const createdAt = new Date().toISOString();
    const userMessage = this.messageRepo.create({
      prompt: input.prompt,
      response: fullResponse,
      chat,
      userId,
      chatId: chat!.id,
      createdAt,
    });
    await this.messageRepo.save(userMessage);

    yield `data: ${JSON.stringify({ type: 'done', messageId: userMessage.id, chatId: chat!.id })}\n\n`;
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

    // Verificar y consumir créditos
    const creditStatus = await this.creditsService.consumeCredits(
      userId,
      'CHAT_MESSAGE',
    );

    // Only create a new chat when NO chatId is provided
    let chat: Chat | null = null;

    if (input.chatId) {
      chat = await this.chatRepo.findOne({
        where: { id: input.chatId, userId },
        select: ['id', 'title', 'userId'],
      });
      if (!chat) {
        chat = await this.chatRepo.findOne({
          where: { id: input.chatId },
          select: ['id', 'title', 'userId'],
        });
        if (chat && chat.userId !== userId) {
          const chatTitle = await this.generateChatTitle(input.prompt).catch(
            () => 'Nuevo Chat',
          );
          chat = await this.createChat(userId, chatTitle);
        } else if (!chat) {
          const chatTitle = await this.generateChatTitle(input.prompt).catch(
            () => 'Nuevo Chat',
          );
          chat = await this.createChat(userId, chatTitle);
        }
      }
    } else {
      const chatTitle = await this.generateChatTitle(input.prompt).catch(
        () => 'Nuevo Chat',
      );
      chat = await this.createChat(userId, chatTitle);
    }

    // Obtener solo últimos 5 mensajes para contexto (no todo el historial)
    let recentMessages: any[] = [];
    if (chat) {
      recentMessages = await this.messageRepo
        .createQueryBuilder('message')
        .select(['message.prompt', 'message.response'])
        .where('message.chatId = :chatId', { chatId: chat.id })
        .orderBy('message.createdAt', 'DESC')
        .limit(5)
        .getMany();

      recentMessages = recentMessages.reverse();
    }

    const conversationHistory = recentMessages.map((msg) => ({
      prompt: msg.prompt,
      response: msg.response,
      createdAt: msg.createdAt,
    }));

    let aiResponse = '';

    try {
      const response = await this.geminiService.generateEducationalChatResponse(
        input.prompt,
        undefined,
        conversationHistory.length > 0 ? conversationHistory : undefined,
      );
      aiResponse = response.response;
    } catch (error) {
      Logger.error(
        `AI response failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      aiResponse =
        'Lo siento, estoy teniendo dificultades técnicas en este momento. Por favor, intenta de nuevo en unos segundos.';
    }

    const createdAt = new Date().toISOString();

    const userMessage = this.messageRepo.create({
      prompt: input.prompt,
      response: aiResponse,
      chat,
      userId,
      chatId: chat!.id,
      createdAt,
    });
    const savedMessage = await this.messageRepo.save(userMessage);

    return {
      ...savedMessage,
      creditsRemaining: creditStatus.remaining,
      creditsTotal: creditStatus.total,
    };
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
