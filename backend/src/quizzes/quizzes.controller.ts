import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import type {
  Quiz,
  Question,
  QuestionOption,
} from '../generated/prisma/client';

export type QuizWithQuestions = Quiz & {
  questions: (Question & { options: QuestionOption[] })[];
};

export interface QuizListItem {
  id: string;
  title: string;
  createdAt: Date;
  _count: { questions: number };
}

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateQuizDto): Promise<QuizWithQuestions> {
    return this.quizzesService.create(dto);
  }

  @Get()
  findAll(): Promise<QuizListItem[]> {
    return this.quizzesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QuizWithQuestions> {
    return this.quizzesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.quizzesService.remove(id);
  }
}
