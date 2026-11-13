import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PostsController, VIEW_RATE_LIMIT_PER_MINUTE } from 'src/posts/posts.controller';
import { PostsService } from 'src/posts/posts.service';

// 현재 조회수 엔드포인트에만 요청 제한이 걸려 있다. 실제로 HTTP 요청에서 429가 나는지 확인한다.
describe('POST /posts/:entryId/view throttling (e2e)', () => {
  let app: INestApplication<App>;
  const mockPostsService = {
    recordView: jest.fn().mockResolvedValue(undefined),
    unbookmark: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleFixture = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }])],
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockPostsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest<{ user?: unknown }>().user = { id: 'user-1' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it(`같은 IP에서 1분에 ${VIEW_RATE_LIMIT_PER_MINUTE}번을 넘기면 429`, async () => {
    for (let i = 0; i < VIEW_RATE_LIMIT_PER_MINUTE; i += 1) {
      await request(app.getHttpServer()).post('/posts/entry-1/view').expect(204);
    }

    await request(app.getHttpServer()).post('/posts/entry-1/view').expect(429);
    expect(mockPostsService.recordView).toHaveBeenCalledTimes(VIEW_RATE_LIMIT_PER_MINUTE);
  });

  it('요청 제한은 조회수 엔드포인트에만 적용됨', async () => {
    for (let i = 0; i < VIEW_RATE_LIMIT_PER_MINUTE + 5; i += 1) {
      await request(app.getHttpServer()).delete('/posts/entry-1/bookmark').expect(204);
    }
  });
});
