import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  import { Role } from '../../../common/enums/env.enum';
  
  @Entity({ name: 'userInfo' })
  export class UserInfo {
    @PrimaryGeneratedColumn()
    id: number;
  
    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({ default: '' })
    fistName: string;
  
    @Column({ default: '' })
    lastName: string;
  
    @Column({ default: '' })
    phoneNumber: string;
  
    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role[];
  
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  