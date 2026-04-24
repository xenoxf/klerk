import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Obtener todos los usuarios */
  async findAll() {
    return this.userRepo.find();
  }

  /** Encontrar un usuario por ID */
  async findOne(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  /** Buscar usuario por correo electrónico */
  async findByEmail(email: string | null) {
    if (!email) return null;
    return this.userRepo.findOne({ where: { email } });
  }

  /** Buscar usuario por ID de proveedor (providerId) */
  async findByProviderId(providerId: string) {
    if (!providerId) return null;
    return this.userRepo.findOne({ where: { providerId } });
  }

  /** Buscar usuario por refresh token */

  /** Alias para compatibilidad con código antiguo: buscar por Google ID */
  async findByGoogleId(googleId: string) {
    return this.findByProviderId(googleId);
  }

  /** Crear un nuevo usuario con autenticación local */
  async createLocal(data: {
    email: string;
    password?: string;
    name?: string;
    providerId?: string;
    picture?: string;
  }) {
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : null;

    const user = this.userRepo.create({
      email: data.email,
      name: data.name ?? data.email,
      password: hashedPassword || undefined,
      provider: 'local',
      providerId: data.providerId ?? undefined,
      picture: data.picture ?? undefined,
    });

    return this.userRepo.save(user);
  }

  /** Crear un nuevo usuario o vincular uno existente con Google */
  async createGoogle(data: {
    email?: string | null;
    name?: string | null;
    provider?: string;
    providerId?: string | null;
    picture?: string | null;
  }) {
    const user = this.userRepo.create({
      email: data.email ?? null,
      name: data.name ?? null,
      password: undefined,
      provider: data.provider ?? 'google',
      providerId: data.providerId ?? undefined,
      picture: data.picture ?? null,
    });

    return this.userRepo.save(user);
  }

  /** Actualizar datos de un usuario existente */
  async update(id: number, patch: Partial<User>) {
    await this.userRepo.update(id, patch);
    return this.findOne(id);
  }

  // Actualizar solo el nombre (compatibilidad con controller)
  async updateName(id: number, name: string) {
    await this.userRepo.update(id, { name });
    return this.findOne(id);
  }

  /** Eliminar un usuario por ID */
  async remove(id: number) {
    return this.userRepo.delete(id);
  }
}
