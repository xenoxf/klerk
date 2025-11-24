import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}
  create(createUserDto: CreateUserDto) {
    const user = this.userRepo.create(createUserDto);
    return user;
  }

  findAll() {
    this.userRepo.find();
  }

  findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  findOne(id: number) {
    const user = this.userRepo.findOne({ where: { id } });
    return user;
  }

  async update(id: number, data: Partial<User>) {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const updated = Object.assign(user, data);

    return await this.userRepo.save(updated);
  }
}
