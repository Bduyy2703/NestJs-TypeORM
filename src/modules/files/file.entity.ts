import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  fileId: string;

  @Column()
  bucketName: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'int' }) 
  targetId: number;

  @Column({ type: 'varchar' }) 
  targetType: string;
}
