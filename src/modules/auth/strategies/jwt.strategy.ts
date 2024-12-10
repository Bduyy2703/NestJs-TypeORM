import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    console.log( "process.env.JWT_SECRET",  process.env.JWT_SECRET);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: any) {
    return {
      ...payload,
    };
  }
}
