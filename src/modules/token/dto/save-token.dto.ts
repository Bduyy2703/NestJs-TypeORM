import { UUID } from 'crypto';

export class SaveTokenDto {
  refreshTokenUsed?: string[];

  refreshToken: string;

  accessToken: string;
}
