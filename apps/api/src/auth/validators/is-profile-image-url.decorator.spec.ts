import { validate } from 'class-validator';

const originalNodeEnv = process.env.NODE_ENV;

describe('IsProfileImageUrl', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  it('allows localhost URLs only when NODE_ENV is development', async () => {
    const TestDto = await createTestDto('development');
    const dto = createDto(TestDto, 'http://localhost:3000/profile.png');

    await expect(validate(dto)).resolves.not.toContainEqual(
      expect.objectContaining({ property: 'profileImageUrl' }),
    );
  });

  it('rejects localhost URLs when NODE_ENV is production', async () => {
    const TestDto = await createTestDto('production');
    const dto = createDto(TestDto, 'http://localhost:3000/profile.png');

    await expect(validate(dto)).resolves.toContainEqual(
      expect.objectContaining({ property: 'profileImageUrl' }),
    );
  });

  it('rejects localhost URLs when NODE_ENV is test', async () => {
    const TestDto = await createTestDto('test');
    const dto = createDto(TestDto, 'http://localhost:3000/profile.png');

    await expect(validate(dto)).resolves.toContainEqual(
      expect.objectContaining({ property: 'profileImageUrl' }),
    );
  });

  it('allows public HTTPS URLs in production', async () => {
    const TestDto = await createTestDto('production');
    const dto = createDto(TestDto, 'https://example.com/profile.png');

    await expect(validate(dto)).resolves.not.toContainEqual(
      expect.objectContaining({ property: 'profileImageUrl' }),
    );
  });
});

async function createTestDto(nodeEnv: string) {
  process.env.NODE_ENV = nodeEnv;
  jest.resetModules();

  const { IsProfileImageUrl } = await import('./is-profile-image-url.decorator');

  class TestDto {
    @IsProfileImageUrl()
    profileImageUrl!: string;
  }

  return TestDto;
}

function createDto(Dto: new () => { profileImageUrl: string }, profileImageUrl: string) {
  const dto = new Dto();
  dto.profileImageUrl = profileImageUrl;

  return dto;
}
