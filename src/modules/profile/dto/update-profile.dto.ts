import { PartialType } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  phoneNumber?: string;
  socialMedia?: string;
}
