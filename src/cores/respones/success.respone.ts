import { HttpStatus, Injectable, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReasonPhrase } from '../../util/reasonPhrases';

@Injectable()
export class SuccessResponse {
  public message = String;
  public status: number;
  public reasonStatus: String;
  public metadata: {};

  constructor({
    message,
    status = HttpStatus.OK,
    reasonStatus = ReasonPhrase.OK,
    metadata,
  }) {
    this.message = message ? message : reasonStatus;
    this.status = status;
    this.reasonStatus = reasonStatus;
    this.metadata = metadata;
  }

  send(@Res() res: Response) {
    return res.status(this.status).json(this);
  }
}

export class CREATED extends SuccessResponse {
  constructor(
    message,
    status = HttpStatus.CREATED,
    reasonStatus = ReasonPhrase.CREATED,
    metadata,
  ) {
    super({ message, status, reasonStatus, metadata });
  }
}
