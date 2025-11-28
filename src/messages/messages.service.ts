import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private messagesRepo: Repository<Message>,
  ) {}

  async sendMessage(content: string, userId: number): Promise<{ message: Message; response: { content: string; role: 'bot' } }> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Content is required');
    }

    const userMessage = this.messagesRepo.create({
      prompt: content,
      response: '',
      userId,
    });

    const savedMessage = await this.messagesRepo.save(userMessage);

    const botResponse = `Response to: ${content}`;
    const botMessage = this.messagesRepo.create({
      prompt: content,
      response: botResponse,
      userId,
    });

    const savedBotMessage = await this.messagesRepo.save(botMessage);

    return {
      message: savedMessage,
      response: { content: botResponse, role: 'bot' },
    };
  }

  async getMessages(
    filters: { chatId?: number; role?: 'user' | 'bot'; search?: string; page?: number; limit?: number },
    userId: number
  ): Promise<Message[]> {
    const query = this.messagesRepo.createQueryBuilder('msg').where('msg.userId = :userId', { userId });

    if (filters.search) {
      const q = `%${filters.search.toLowerCase()}%`;
      query.andWhere('(LOWER(msg.prompt) LIKE :search OR LOWER(msg.response) LIKE :search)', { search: q });
    }

    query.orderBy('msg.createdAt', 'ASC');

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    return query.skip(skip).take(limit).getMany();
  }

  async deleteMessage(id: number, userId: number): Promise<{ message: string }> {
    const msg = await this.messagesRepo.findOne({
      where: { id, userId },
    });

    if (!msg) {
      throw new NotFoundException('Message not found');
    }

    await this.messagesRepo.delete(id);
    return { message: 'Message deleted' };
  }

  async deleteChat(chatId: number, userId: number): Promise<{ message: string }> {
    const result = await this.messagesRepo.delete({ chatId, userId } as any);

    if (result.affected === 0) {
      throw new NotFoundException('Chat not found');
    }

    return { message: 'Chat deleted' };
  }

  async searchMessages(
    query: string,
    filters?: { chatId?: number; role?: 'user' | 'bot' },
    userId?: number
  ): Promise<Message[]> {
    const queryBuilder = this.messagesRepo.createQueryBuilder('msg');

    if (userId) {
      queryBuilder.where('msg.userId = :userId', { userId });
    }

    const q = `%${query.toLowerCase()}%`;
    queryBuilder.andWhere('(LOWER(msg.prompt) LIKE :search OR LOWER(msg.response) LIKE :search)', { search: q });

    if (filters?.chatId) {
      queryBuilder.andWhere('msg.chatId = :chatId', { chatId: filters.chatId });
    }

    return queryBuilder.getMany();
  }
}
