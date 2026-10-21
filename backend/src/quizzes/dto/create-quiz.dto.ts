import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { QuestionType } from '../../generated/prisma/client';

export function IsValidQuestionOptions(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidQuestionOptions',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const question = args.object as QuestionDto;

          if (question.type === QuestionType.CHECKBOX) {
            if (!Array.isArray(value)) return false;
            if (value.length < 2 || value.length > 20) return false;
            return value.some(
              (opt: unknown) =>
                typeof opt === 'object' &&
                opt !== null &&
                (opt as { isCorrect?: unknown }).isCorrect === true,
            );
          }

          if (value !== undefined && value !== null) {
            if (Array.isArray(value) && value.length > 0) return false;
            if (!Array.isArray(value)) return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const question = args.object as QuestionDto;
          if (question.type === QuestionType.CHECKBOX) {
            const value = (question as { options?: unknown }).options;
            if (!Array.isArray(value) || value.length < 2) {
              return 'Checkbox questions must have at least 2 options.';
            }
            if (value.length > 20) {
              return 'Checkbox questions cannot have more than 20 options.';
            }
            return 'Checkbox questions must have at least one correct option marked.';
          }
          return `Options are not allowed for ${question.type ?? 'this'} question type.`;
        },
      },
    });
  };
}

export class QuestionOptionDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  label!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class QuestionDto {
  @IsEnum(QuestionType)
  type!: QuestionType;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text!: string;

  @ValidateIf(
    (q: QuestionDto) =>
      q.type === QuestionType.CHECKBOX || q.options !== undefined,
  )
  @IsValidQuestionOptions()
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

export class CreateQuizDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions!: QuestionDto[];
}
