import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';

type PrismaClientType = typeof prisma;

@Injectable()
export class PrismaService {
  readonly user: PrismaClientType['user'] = prisma.user;
  readonly emailVerificationCode: PrismaClientType['emailVerificationCode'] =
    prisma.emailVerificationCode;
  readonly book: PrismaClientType['book'] = prisma.book;
  readonly libraryEntry: PrismaClientType['libraryEntry'] = prisma.libraryEntry;
  readonly follow: PrismaClientType['follow'] = prisma.follow;
  readonly like: PrismaClientType['like'] = prisma.like;
  readonly bookmark: PrismaClientType['bookmark'] = prisma.bookmark;
  readonly entryView: PrismaClientType['entryView'] = prisma.entryView;
  readonly $transaction: PrismaClientType['$transaction'] = prisma.$transaction.bind(prisma);
}
