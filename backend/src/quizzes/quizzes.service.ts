import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { Prisma, QuestionType } from '../generated/prisma/client';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuizDto) {
    for (let i = 0; i < dto.questions.length; i++) {
      const q = dto.questions[i];
      if (q.type === QuestionType.CHECKBOX) {
        if (!q.options || q.options.length < 2) {
          throw new BadRequestException(
            `Question #${i + 1} (CHECKBOX) must have at least 2 options.`,
          );
        }
        if (q.options.length > 20) {
          throw new BadRequestException(
            `Question #${i + 1} (CHECKBOX) cannot have more than 20 options.`,
          );
        }
        if (!q.options.some((o) => o.isCorrect)) {
          throw new BadRequestException(
            `Question #${i + 1} (CHECKBOX) must have at least one correct option marked.`,
          );
        }
      } else if (q.options && q.options.length > 0) {
        throw new BadRequestException(
          `Question #${i + 1} (${q.type}) must not have options.`,
        );
      }
    }

    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        questions: {
          create: dto.questions.map((q, index) => ({
            type: q.type,
            text: q.text,
            order: index,
            options:
              q.type === QuestionType.CHECKBOX && q.options?.length
                ? {
                    create: q.options.map((o, oIndex) => ({
                      label: o.label,
                      isCorrect: o.isCorrect,
                      order: oIndex,
                    })),
                  }
                : undefined,
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: {
              orderBy: [{ order: 'asc' }, { id: 'asc' }],
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: {
              orderBy: [{ order: 'asc' }, { id: 'asc' }],
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with id "${id}" not found.`);
    }

    return quiz;
  }

  async remove(id: string) {
    try {
      await this.prisma.quiz.delete({ where: { id } });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException(`Quiz with id "${id}" not found.`);
      }
      throw err;
    }
  }
}
