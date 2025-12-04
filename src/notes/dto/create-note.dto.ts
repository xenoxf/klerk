import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateNoteDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    numberOfNotes?: number;

    @IsOptional()
    @IsString()
    levelOfDetail?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    tema?: string;

    @IsOptional()
    @IsString()
    textoReferencia?: string;
}

export class GenerateNoteDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  referenceText?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
