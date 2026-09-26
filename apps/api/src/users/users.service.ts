import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type { User } from '@repo/db';
import { FollowService } from 'src/follow/follow.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { MeResponseDto, UpdateUserProfileDto, UserProfileResponseDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly followService: FollowService,
  ) {}

  async getMe(user: User): Promise<MeResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...me } = user;
    const { followerCount, followingCount } = await this.followService.getCounts(user.id);
    return { ...me, followerCount, followingCount };
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
