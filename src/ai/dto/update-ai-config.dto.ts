import { IsOptional, IsString, IsEnum, IsBoolean, IsIn } from 'class-validator';

export class UpdateAiConfigDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  chatModel?: string;

  @IsOptional()
  @IsString()
  genModel?: string;

  @IsOptional()
  @IsString()
  visionModel?: string;

  @IsOptional()
  @IsEnum(['ahorro', 'equilibrado', 'calidad'])
  mode?: string;

  @IsOptional()
  @IsBoolean()
  fallbackEnabled?: boolean;

  @IsOptional()
  @IsString()
  byokProvider?: string;

  @IsOptional()
  @IsString()
  byokKey?: string;
}

export class TestAiConfigDto {
  @IsString()
  provider: string;

  @IsString()
  model: string;
}
