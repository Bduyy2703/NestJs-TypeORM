import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Role } from '../../role/entities/t_role'; 
import { Right } from '../../right/entities/t_right';  

@Entity()
export class RoleRight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roleId: number;

  @Column()
  rightId: number;

  @Column({ type: 'timestamp', nullable: true })
  createdDate?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  createdBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  updatedDate?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  updatedBy?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Role, role => role.RoleRight, { onDelete: 'CASCADE' })
  role: Role;

  @ManyToOne(() => Right, right => right.RoleRight, { onDelete: 'CASCADE' })
  right: Right;
}
