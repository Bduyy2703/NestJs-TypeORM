import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';

export class UpdateUserDto extends PartialType(RegisterDto) {}
