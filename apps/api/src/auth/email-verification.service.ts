import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import nodemailer from 'nodemailer';

import { prisma } from '@repo/db';

const EMAIL_VERIFICATION_CODE_EXPIRES_IN_MS = 10 * 60 * 1000; // 10분
const EMAIL_VERIFICATION_CODE_MAX_ATTEMPTS = 5;
const EMAIL_VERIFICATION_CODE_LENGTH = 6;

@Injectable()
export class EmailVerificationService {
  constructor(private configService: ConfigService) {}

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
      subject: '책의 숲 이메일 인증 코드',
      text: `인증 코드는 ${code}입니다. 10분 안에 입력해 주세요.`,
    });
  }

  async sendCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmailUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const now = new Date();
    const code = this.generateEmailVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);

    await prisma.emailVerificationCode.updateMany({
      where: {
        email: normalizedEmail,
        consumedAt: null,
      },
      data: { consumedAt: now },
    });

    const emailVerificationCode = await prisma.emailVerificationCode.create({
      data: {
        email: normalizedEmail,
        codeHash,
        expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_CODE_EXPIRES_IN_MS),
      },
    });

    try {
      await this.sendVerificationEmail(normalizedEmail, code);
    } catch (error) {
      await prisma.emailVerificationCode.update({
        where: { id: emailVerificationCode.id },
        data: { consumedAt: new Date() },
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
    const emailVerificationCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        consumedAt: null,
        verifiedAt: null,
      },
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
      await prisma.emailVerificationCode.update({
        where: { id: emailVerificationCode.id },
        data: { consumedAt: now },
      });
      throw new GoneException('이메일 인증 코드가 만료되었습니다.');
    }

    // 인증 코드가 email로 전송한 코드와 일치하지 않는 경우
    const isCodeValid = await bcrypt.compare(code, emailVerificationCode.codeHash);
    if (!isCodeValid) {
      const nextAttemptCount = emailVerificationCode.attemptCount + 1;
      await prisma.emailVerificationCode.update({
        where: { id: emailVerificationCode.id },
        data: {
          attemptCount: nextAttemptCount,
          ...(nextAttemptCount >= EMAIL_VERIFICATION_CODE_MAX_ATTEMPTS ? { consumedAt: now } : {}),
        },
      });
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
    await prisma.emailVerificationCode.update({
      where: { id: emailVerificationCode.id },
      data: { verifiedAt: now },
    });
  }

  async findValidVerifiedCode(email: string) {
    return prisma.emailVerificationCode.findFirst({
      where: {
        email: this.normalizeEmail(email),
        verifiedAt: { not: null },
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { verifiedAt: 'desc' },
    });
  }
}
