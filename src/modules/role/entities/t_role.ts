import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';  // Import model User
import { RoleRight } from '../../role_right/entities/t_role_right';  // Import model RoleRight

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true ,default : "USER"})
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @Column({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => User, user => user.role)
  users: User[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  updatedBy?: string;

  @OneToMany(() => RoleRight, roleRight => roleRight.role)
  RoleRight: RoleRight[];
}
