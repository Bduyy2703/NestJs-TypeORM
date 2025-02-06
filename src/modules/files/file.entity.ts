import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid') // UUID tự động sinh
  fileId: string;

  @Column()
  bucketName: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;
}
