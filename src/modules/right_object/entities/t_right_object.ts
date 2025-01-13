import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Object_entity } from '../../object/entities/object.entity';  // Import model Object
import { Right } from '../../right/entities/t_right';    // Import model Right

@Entity()
export class RightObject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rightId: number;

  @Column()
  objectId: number;

  @Column({ type: 'boolean', default: true })
  createYn: boolean;

  @Column({ type: 'boolean', default: true })
  readYn: boolean;

  @Column({ type: 'boolean', default: false })
  updateYn: boolean;

  @Column({ type: 'boolean', default: true })
  deleteYn: boolean;

  @Column({ type: 'boolean', default: true })
  executeYn: boolean;

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

  // Quan hệ với bảng Right
  @ManyToOne(() => Right, right => right.RightObject, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  right: Right;

  // Quan hệ với bảng Object
  @ManyToOne(() => Object_entity, object => object.RightObject, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  object: Object;
}
