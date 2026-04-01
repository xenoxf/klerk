import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalChatMessage } from './entities/global-chat-message.entity';
import { CreateGlobalChatMessageDto } from './dto/create-global-chat-message.dto';

@Injectable()
export class GlobalChatService {
  constructor(
    @InjectRepository(GlobalChatMessage)
    private readonly globalChatMessageRepo: Repository<GlobalChatMessage>,
  ) {}

  async create(
    createDto: CreateGlobalChatMessageDto,
    userId: number,
  ): Promise<GlobalChatMessage> {
    try {
      const message = this.globalChatMessageRepo.create({
        ...createDto,
        userId,
      });
      return await this.globalChatMessageRepo.save(message);
    } catch (error) {
      throw new BadRequestException('Error al crear mensaje');
    }
  }

  async findAll(limit = 50, offset = 0): Promise<GlobalChatMessage[]> {
    return this.globalChatMessageRepo.find({
      relations: ['user'],
      order: { createdAt: 'ASC' }, // Old to new
      take: limit,
      skip: offset,
    });
  }

  async findByUser(userId: number, limit = 50, offset = 0): Promise<GlobalChatMessage[]> {
    return this.globalChatMessageRepo.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'ASC' }, // Old to new
      take: limit,
      skip: offset,
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const message = await this.globalChatMessageRepo.findOne({
      where: { id, userId },
    });
    if (!message) {
      throw new BadRequestException('Mensaje no encontrado o no autorizado');
    }
    await this.globalChatMessageRepo.remove(message);
  }
}
