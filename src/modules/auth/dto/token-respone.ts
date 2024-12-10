export class TokenResponse {
    /**
     * A JWT token include email, userId and user'roles | expired in 1d
     */
    accessToken: string;
  
    /**
     * A JWT token include email, userId and user'roles | expired in 3d
     */
    refreshToken: string;
  
    /**
     * Time expire of access token
     * @example 1731283192
     */
    expiresInAccessToken: number;
  }
  