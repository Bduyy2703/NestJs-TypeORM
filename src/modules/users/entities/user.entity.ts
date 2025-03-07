import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Role } from '../../role/entities/t_role'; 
import { Blog } from '../../blogs/entities/blog.entity';  
import { Profile } from '../../profile/entities/profile.entity';  
import { Token } from '../../token/entities/token.entity';  
import 'reflect-metadata';
import { Address } from 'src/modules/address/entity/address.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  username?: string;

  @Column()
  roleId: number;

  @ManyToOne(() => Role, role => role.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  tokenOTP?: string;

  @OneToMany(() => Blog, blog => blog.author)
  blogs: Blog[];

  @OneToOne(() => Profile, profile => profile.user, { cascade: true })
  profile: Profile;

  @OneToOne(() => Token, token => token.user, { cascade: true })
  token: Token;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];
}