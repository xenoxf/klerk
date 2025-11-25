import { Injectable } from '@nestjs/common';
import { GroqService } from 'src/groq/groq.service';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MessagesService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Chat) private readonly chatRepo: Repository<Chat>,
  ) {}

  async sendMessage(prompt: string, userId: number, chatId?: number) {
    // generar respuesta de la IA
    const response = await this.groqService.chat(prompt);

    // buscar chat existente para el usuario
    let chat = await this.chatRepo.findOne({ where: {id: chatId, userId} });

    // si no existe, crear nuevo chat y pedirle a la IA que genere un título
    if (!chat) {
      const title = await this.groqService.chat(
        `Genera un título corto y descriptivo para un chat cuya primera interacción es: "${prompt}"`,
      );
      chat = this.chatRepo.create({ title, userId });
      await this.chatRepo.save(chat);
    }

    // crear y guardar el mensaje asociado al chat
    const newMessage = this.messageRepo.create({
      mensaje: prompt,
      response: response,
      userId: userId,
      chat: chat,
      chatId: chat.id,
      numberMessageOfChat: (await this.messageRepo.count({ where: { chatId: chat.id } })) + 1,
    });
    await this.messageRepo.save(newMessage);

    return { response, chatId: (chat as any).id, message: newMessage };
  }

  getChatById(userId: number, id: number) {
    return this.chatRepo.find({ where: { userId, id } });
  }

  getAllChats(userId: number) {
    return this.chatRepo.find({ where: { userId } });
  }

  removeChat(chatId: number, userId: number) {
    return this.chatRepo.delete({ id: chatId, userId } as any);
  }
}
