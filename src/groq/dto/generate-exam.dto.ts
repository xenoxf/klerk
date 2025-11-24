import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GenerateExamDto {
    @IsString()
    @IsNotEmpty()
    prompt: string;

    @IsOptional()
    @IsInt()
    numberOfQuestions?: number;
}