import { HttpException, HttpStatus } from '@nestjs/common';

export class BadRequestException extends HttpException {
  constructor(message?: string) {
    super(message || 'Bad Request !', HttpStatus.BAD_REQUEST);
  }
}

export class DataDeletedException extends BadRequestException {
  constructor(
    message: string = 'Data was deleted. Contact Admin to restore !',
  ) {
    super(message);
  }
}

// USER EXCEPTIONS
export class UserDeletedException extends DataDeletedException {
  constructor(
    message: string = 'User was deleted. Contact Admin to restore !',
  ) {
    super(message);
  }
}

export class userExistException extends BadRequestException {
  constructor(message: string = 'User Existed !') {
    super(message);
  }
}
