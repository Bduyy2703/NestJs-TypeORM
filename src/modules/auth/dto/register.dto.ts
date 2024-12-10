import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/env.enum';

export class RegisterDto {
  /**
   * email of the user
   * @example 'sample1@gmail.com'
   */
  @IsEmail()
  email: string;

  /**
   * Password of the user
   * @example '123456'
   */
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  /**
   * User of the user
   */
  username?: string;
}
