import { UserInfo } from '../../users/entities/userinfo.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from '../../comment/entities/comment.entity';

enum BlogStatus {
  APPROVING = 'approving',
  APPROVED = 'approved',
  DELETING = 'deleting',
}

@Entity()
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserInfo, (userInfo) => userInfo.blogs)
  @JoinColumn({ name: 'userInfo_id' })
  userInfo: UserInfo;

  @ManyToMany(() => Comment)
  @JoinTable({
    name: 'blog_comment',
    joinColumn: { name: 'blog_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'comment_id', referencedColumnName: 'id' },
  })
  comments: Comment[];

  @Column()
  title: string;

  @Column()
  paragraph: string;

  @Column({
    type: 'enum',
    enum: BlogStatus,
    default: BlogStatus.APPROVING,
  })
  status: BlogStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
