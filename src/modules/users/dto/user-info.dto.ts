import { IsPhoneNumber } from 'class-validator';

export class RegisterUserDto {
  fistName: string;

  lastName: string;

  @IsPhoneNumber()
  phoneNumber: string;
}
