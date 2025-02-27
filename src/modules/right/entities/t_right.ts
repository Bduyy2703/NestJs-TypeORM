import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RoleRight } from '../../role_right/entities/t_role_right';  // Import model RoleRight
import { RightObject } from '../../right_object/entities/t_right_object';  // Import model RightObject

@Entity()
export class Right {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  code?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  name?: string;

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

  // Quan hệ với bảng RoleRight
  @OneToMany(() => RoleRight, roleRight => roleRight.right)
  RoleRight: RoleRight[];

  // Quan hệ với bảng RightObject
  @OneToMany(() => RightObject, rightObject => rightObject.right)
  RightObject: RightObject[];
}
