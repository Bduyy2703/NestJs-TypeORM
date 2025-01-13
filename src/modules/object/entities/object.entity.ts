import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RightObject } from '../../right_object/entities/t_right_object'; // Giả sử bạn đã có model RightObject

@Entity()
export class Object_entity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, nullable: true, unique: true })
  code?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
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

  @OneToMany(() => RightObject, rightObject => rightObject.object) // Giả sử RightObject có mối quan hệ với Object
  RightObject: RightObject[];
}
