import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateVoiceProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  toneName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  toneDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  sampleContent?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  platforms?: string[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
