import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  @Entity({ name: 'keyToken' })
  export class Token {
    @PrimaryGeneratedColumn('identity')
    id: number;
  
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({
      type: 'simple-array',
      default: '',
    })
    refreshTokenUsed: string[];
  
    @Column()
    refreshToken: string;
  
    @Column()
    accessToken: string;
  }
  