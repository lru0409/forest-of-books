import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';

type PrismaClientType = typeof prisma;

@Injectable()
export class PrismaService {
  readonly user: PrismaClientType['user'] = prisma.user;
  readonly emailVerificationCode: PrismaClientType['emailVerificationCode'] =
    prisma.emailVerificationCode;
  readonly $transaction: PrismaClientType['$transaction'] = prisma.$transaction.bind(prisma);
}
