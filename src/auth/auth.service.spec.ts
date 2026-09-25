import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService - verificación por email (sin contraseña en claro en JWT)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const jwtService = new JwtService({ secret: 'test-secret' });

  let usersService: {
    findByEmail: jest.Mock;
    createLocal: jest.Mock;
  };
  let mailService: { sendVerificationEmail: jest.Mock };
  let service: AuthService;

  const dto = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'SuperSecreta123',
  };

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      createLocal: jest.fn().mockImplementation(async (data) => ({
        id: 1,
        email: data.email,
        name: data.name,
        picture: null,
        provider: 'local',
        password: data.passwordHash ?? 'hashed',
      })),
    };
    mailService = { sendVerificationEmail: jest.fn().mockResolvedValue(true) };
    service = new AuthService(usersService as any, jwtService, mailService as any);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('preRegister NO incluye la contraseña en claro en el JWT', async () => {
    const res = await service.preRegister(dto);

    expect(res.token).toBeDefined();
    const payload = jwtService.verify(res.token);

    expect(payload.password).toBeUndefined();
    expect(typeof payload.passwordHash).toBe('string');
    await expect(
      bcrypt.compare(dto.password, payload.passwordHash),
    ).resolves.toBe(true);

    // Ni siquiera decodificando el token sin la firma aparece la contraseña
    expect(JSON.stringify(jwtService.decode(res.token))).not.toContain(
      dto.password,
    );
  });

  it('preRegister envía el email de verificación', async () => {
    await service.preRegister(dto);
    expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
      dto.email,
      expect.any(String),
      dto.name,
    );
  });

  it('registerWithVerifiedData crea el usuario sin re-hashear (login funciona)', async () => {
    const { token } = await service.preRegister(dto);
    await service.registerWithVerifiedData(token);

    expect(usersService.createLocal).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        passwordHash: expect.any(String),
      }),
    );
    const storedHash = usersService.createLocal.mock.calls[0][0].passwordHash;
    expect(storedHash).not.toContain(dto.password);
    // El hash guardado valida contra la contraseña original (sin doble hash)
    await expect(bcrypt.compare(dto.password, storedHash)).resolves.toBe(
      true,
    );
  });

  it('rechaza tokens legacy con password en claro', async () => {
    const legacyToken = jwtService.sign(
      {
        email: dto.email,
        name: dto.name,
        password: dto.password,
        purpose: 'email-verification',
      },
      { expiresIn: '15m' },
    );

    await expect(
      service.registerWithVerifiedData(legacyToken),
    ).rejects.toThrow();
    expect(usersService.createLocal).not.toHaveBeenCalled();
  });

  it('en producción NO expone el token en la respuesta', async () => {
    process.env.NODE_ENV = 'production';
    const res = await service.preRegister(dto);

    expect(res.emailSent).toBe(true);
    expect(res).not.toHaveProperty('token');
  });
});
