import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(message?: string) {
    super(message || 'Not Found !', HttpStatus.NOT_FOUND);
  }
}

// USER EXCEPTIONS
export class UserNotFoundException extends NotFoundException {
  constructor(message: string = 'User Not Found !') {
    super(message);
  }
}
