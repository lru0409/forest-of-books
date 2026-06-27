import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

import { PrismaService } from 'src/prisma/prisma.service';
import { generateVerificationEmailHtml } from './email-verification.template';

const EMAIL_VERIFICATION_CODE_EXPIRES_IN_MS = 10 * 60 * 1000; // 10분
const EMAIL_VERIFICATION_CODE_MAX_ATTEMPTS = 5;
const EMAIL_VERIFICATION_CODE_LENGTH = 6;

@Injectable()
export class EmailVerificationService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateEmailVerificationCode() {
    return randomInt(0, 10 ** EMAIL_VERIFICATION_CODE_LENGTH)
      .toString()
      .padStart(EMAIL_VERIFICATION_CODE_LENGTH, '0');
  }

  private async sendVerificationEmail(email: string, code: string) {
    const host = this.configService.get<string>('API_SMTP_HOST');
    const port = Number(this.configService.get<string>('API_SMTP_PORT'));
    const user = this.configService.get<string>('API_SMTP_USER');
    const pass = this.configService.get<string>('API_SMTP_PASS');
    const from = this.configService.get<string>('API_EMAIL_FROM');

    if (!host || !port || !user || !pass || !from) {
      throw new InternalServerErrorException('이메일 인증 코드를 전송하지 못했습니다.');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: email,
      messageId: `<${randomUUID()}@forest-of-books>`, // TODO: @ 우측을 실제 도메인으로 변경 필요
      subject: '책의 숲 - 이메일 인증 코드',
      text: `인증 코드는 ${code}입니다. 10분 안에 입력해 주세요.`,
      html: generateVerificationEmailHtml(code),
    });
  }

  async sendCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const existingEmailUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmailUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const now = new Date();
    const code = this.generateEmailVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.emailVerificationCode.deleteMany({
      where: { email: normalizedEmail },
    });

    const emailVerificationCode = await this.prisma.emailVerificationCode.create({
      data: {
        email: normalizedEmail,
        codeHash,
        expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_CODE_EXPIRES_IN_MS),
      },
    });

    try {
      await this.sendVerificationEmail(normalizedEmail, code);
    } catch (error) {
      await this.prisma.emailVerificationCode.delete({
        where: { id: emailVerificationCode.id },
      });
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('이메일 인증 코드를 전송하지 못했습니다.');
    }
  }

  async verifyCode(email: string, code: string) {
    const now = new Date();

    // 유효한 이메일 인증 코드를 찾을 수 없는 경우
    const normalizedEmail = this.normalizeEmail(email);
    const emailVerificationCode = await this.prisma.emailVerificationCode.findFirst({
      where: { email: normalizedEmail, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!emailVerificationCode) {
      throw new BadRequestException({
        errorCode: 'EMAIL_VERIFICATION_CODE_NOT_FOUND',
        message: '이메일 인증 코드를 다시 요청해 주세요.',
      });
    }

    // 이메일 인증 코드가 만료된 경우
    if (emailVerificationCode.expiresAt <= now) {
      await this.prisma.emailVerificationCode.delete({
        where: { id: emailVerificationCode.id },
      });
      throw new GoneException('이메일 인증 코드가 만료되었습니다.');
    }

    // 인증 코드가 email로 전송한 코드와 일치하지 않는 경우
    const isCodeValid = await bcrypt.compare(code, emailVerificationCode.codeHash);
    if (!isCodeValid) {
      const nextAttemptCount = emailVerificationCode.attemptCount + 1;
      if (nextAttemptCount >= EMAIL_VERIFICATION_CODE_MAX_ATTEMPTS) {
        await this.prisma.emailVerificationCode.delete({
          where: { id: emailVerificationCode.id },
        });
      } else {
        await this.prisma.emailVerificationCode.update({
          where: { id: emailVerificationCode.id },
          data: { attemptCount: nextAttemptCount },
        });
      }
      throw new BadRequestException({
        errorCode: 'EMAIL_VERIFICATION_CODE_MISMATCH',
        message: '이메일 인증 코드가 일치하지 않습니다.',
        data: {
          attemptCount: nextAttemptCount,
          maxAttempts: EMAIL_VERIFICATION_CODE_MAX_ATTEMPTS,
        },
      });
    }

    // 인증 코드가 검증된 경우
    await this.prisma.emailVerificationCode.update({
      where: { id: emailVerificationCode.id },
      data: { verifiedAt: now },
    });
  }

  async findValidVerifiedCode(email: string) {
    return this.prisma.emailVerificationCode.findFirst({
      where: { email: this.normalizeEmail(email), verifiedAt: { not: null } },
      orderBy: { verifiedAt: 'desc' },
    });
  }

  @Cron('0 0 * * *')
  async cleanupExpiredCodes() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h 전
    await this.prisma.emailVerificationCode.deleteMany({
      where: {
        OR: [
          { verifiedAt: null, expiresAt: { lt: new Date() } },
          { verifiedAt: { not: null, lt: cutoff } },
        ],
      },
    });
  }
}
