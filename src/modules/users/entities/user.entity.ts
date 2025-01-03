import { ApiProperty } from '@nestjs/swagger';
import { Column, PrimaryGeneratedColumn } from 'typeorm';
import { Entity } from 'typeorm';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column({ unique: true ,default : false})
  isVerified: boolean;

  @ApiProperty()
  @Column({ unique: true })
  tokenOTP: string;

  @ApiProperty({ example: '123', description: 'The age of the Cat' })
  @Column()
  password: string;
}
