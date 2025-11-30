import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  // -------------------------
  // LOGIN LOCAL
  // -------------------------
  async createLocal(dto: CreateUserDto) {
    const user = this.userRepo.create({
      provider: 'local',
      ...dto,
    });

    return await this.userRepo.save(user);
  }

  // -------------------------
  // LOGIN CON GOOGLE
  // -------------------------
  async createGoogle(dto: CreateGoogleUserDto) {
    // 1. Buscar si ya existe por providerId
    let user = await this.userRepo.findOne({
      where: { provider: 'google', providerId: dto.providerId },
    });

    if (user) {
      return user; // ya registrado
    }

    // 2. Buscar si existe por email (si antes se registró con local)
    user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (user) {
      // Actualizar para marcar que ahora también usa Google
      user.provider = 'google';
      user.providerId = dto.providerId;
      user.picture = dto.picture;
      user.name = dto.name;
      user.emailVerified = true;

      return await this.userRepo.save(user);
    }

    // 3. Crear un nuevo usuario desde Google
    const newUser = this.userRepo.create({
      ...dto,
      password: null, // Google no da contraseña
    });

    return await this.userRepo.save(newUser);
  }

  // -------------------------
  // UTILIDADES
  // -------------------------
  findAll() {
    return this.userRepo.find();
  }

  findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  findOne(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<User>) {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) throw new NotFoundException('Usuario no encontrado.');

    Object.assign(user, data);

    return await this.userRepo.save(user);
  }

  async updateName(id: number, name: string) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException("Usuario no existe");
    Object.assign(user, name);
    await this.userRepo.update({ id }, { name });
    return user;
  }
}
