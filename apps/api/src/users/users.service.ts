import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import type { User } from '@repo/db';
import { FollowService } from 'src/follow/follow.service';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  ChangePasswordDto,
  MeResponseDto,
  UpdateUserProfileDto,
  UserProfileResponseDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly followService: FollowService,
  ) {}

  async getMe(user: User): Promise<MeResponseDto> {
    const { password, ...me } = user;
    const { followerCount, followingCount } = await this.followService.getCounts(user.id);
    return { ...me, hasPassword: password !== null, followerCount, followingCount };
  }

  async findProfileById(id: string, viewerId?: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    const { followerCount, followingCount } = await this.followService.getCounts(id);
    const isFollowing =
      viewerId !== undefined && viewerId !== id
        ? await this.followService.isFollowing(viewerId, id)
        : false;

    return toProfileDto(user, followerCount, followingCount, isFollowing);
  }

  async updateMyProfile(userId: string, dto: UpdateUserProfileDto): Promise<MeResponseDto> {
    if (dto.nickname !== undefined) {
      const existingNicknameUser = await this.prisma.user.findUnique({
        where: { nickname: dto.nickname },
      });
      if (existingNicknameUser && existingNicknameUser.id !== userId) {
        throw new ConflictException({
          errorCode: 'NICKNAME_ALREADY_EXISTS',
          message: '이미 사용 중인 닉네임입니다.',
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.nickname !== undefined && { nickname: dto.nickname }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.profileImage !== undefined && { profileImage: dto.profileImage }),
        ...(dto.preferredGenres !== undefined && { preferredGenres: dto.preferredGenres }),
      },
    });

    return this.getMe(user);
  }

  async changePassword(user: User, dto: ChangePasswordDto): Promise<void> {
    if (user.password === null) {
      throw new BadRequestException({
        errorCode: 'PASSWORD_NOT_SET',
        message: '비밀번호가 설정되지 않은 계정입니다.',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException({
        errorCode: 'INVALID_CURRENT_PASSWORD',
        message: '현재 비밀번호가 일치하지 않습니다.',
      });
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException({
        errorCode: 'SAME_AS_CURRENT_PASSWORD',
        message: '현재 비밀번호와 다른 비밀번호를 입력해 주세요.',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  }
}

function toProfileDto(
  user: User,
  followerCount: number,
  followingCount: number,
  isFollowing: boolean,
): UserProfileResponseDto {
  return {
    id: user.id,
    nickname: user.nickname,
    bio: user.bio,
    profileImage: user.profileImage,
    preferredGenres: user.preferredGenres,
    createdAt: user.createdAt,
    followerCount,
    followingCount,
    isFollowing,
  };
}
