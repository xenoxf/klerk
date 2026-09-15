import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, randomBytes } from 'crypto';
import { UserAiConfig } from './entities/user-ai-config.entity';
import { UpdateAiConfigDto, TestAiConfigDto } from './dto/update-ai-config.dto';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(UserAiConfig)
    private readonly configRepo: Repository<UserAiConfig>,
    private readonly groqProvider: GroqProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly configService: ConfigService,
  ) {}

  async getConfig(userId: number): Promise<Omit<UserAiConfig, 'byokEncryptedKey'>> {
    let cfg = await this.configRepo.findOne({ where: { userId } });
    if (!cfg) {
      cfg = this.configRepo.create({
        userId,
        provider: 'auto',
        mode: 'ahorro',
        fallbackEnabled: true,
      });
      cfg = await this.configRepo.save(cfg);
    }
    // Nunca exponer la llave cifrada al cliente
    const { byokEncryptedKey, ...safe } = cfg;
    return safe;
  }

  async updateConfig(
    userId: number,
    dto: UpdateAiConfigDto,
  ): Promise<Omit<UserAiConfig, 'byokEncryptedKey'>> {
    const cfg = (await this.getConfig(userId)) as UserAiConfig;

    if (dto.provider) {
      if (!['auto', 'groq', 'gemini'].includes(dto.provider)) {
        throw new BadRequestException('Provider inválido');
      }
      cfg.provider = dto.provider;
    }
    if (dto.chatModel !== undefined) cfg.chatModel = dto.chatModel;
    if (dto.genModel !== undefined) cfg.genModel = dto.genModel;
    if (dto.visionModel !== undefined) cfg.visionModel = dto.visionModel;
    if (dto.mode) cfg.mode = 'ahorro'; // siempre ahorro por decisión de producto
    if (dto.fallbackEnabled !== undefined)
      cfg.fallbackEnabled = dto.fallbackEnabled;
    if (dto.byokProvider !== undefined) cfg.byokProvider = dto.byokProvider;
    if (dto.byokKey) {
      const encKey =
        this.configService.get<string>('APP_ENCRYPTION_KEY') ||
        'fallback-key-change-me-0123456789';
      const key = Buffer.from(encKey.padEnd(32, '0').slice(0, 32));
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(dto.byokKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      cfg.byokEncryptedKey = iv.toString('hex') + ':' + encrypted;
      if (dto.byokProvider) cfg.byokProvider = dto.byokProvider;
    }

    cfg.updatedAt = new Date();
    const saved = await this.configRepo.save(cfg);
    const { byokEncryptedKey, ...safe } = saved;
    return safe;
  }

  async getProviders() {
    return [
      {
        id: 'groq',
        label: 'Groq',
        models: [
          {
            id: 'openai/gpt-oss-20b',
            label: 'GPT-OSS 20B (ahorro)',
            tier: 'CHEAP',
          },
          {
            id: 'openai/gpt-oss-120b',
            label: 'GPT-OSS 120B (calidad)',
            tier: 'QUALITY',
          },
        ],
        supportsVision: true,
        defaultModel: 'openai/gpt-oss-20b',
      },
      {
        id: 'gemini',
        label: 'Gemini',
        models: [
          {
            id: 'gemini-2.5-flash-lite',
            label: 'Gemini 2.5 Flash Lite (ahorro)',
            tier: 'CHEAP',
          },
          {
            id: 'gemini-2.5-flash',
            label: 'Gemini 2.5 Flash (calidad)',
            tier: 'QUALITY',
          },
        ],
        supportsVision: true,
        defaultModel: 'gemini-2.5-flash-lite',
      },
    ];
  }

  async testConnection(dto: TestAiConfigDto): Promise<{
    ok: boolean;
    latencyMs: number;
    model: string;
    provider: string;
    error?: string;
  }> {
    const start = Date.now();
    try {
      const provider =
        dto.provider === 'gemini' ? this.geminiProvider : this.groqProvider;
      await provider.generateTitle('Hola, prueba de conexión');
      return {
        ok: true,
        latencyMs: Date.now() - start,
        model: provider.modelName,
        provider: dto.provider,
      };
    } catch (e: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        model: '',
        provider: dto.provider,
        error: e?.message || 'Error desconocido',
      };
    }
  }
}
