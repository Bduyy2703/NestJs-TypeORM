import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Review } from './review.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('review_replies')
export class ReviewReply {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reviewId: number;

    @ManyToOne(() => Review, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reviewId' })
    review: Review;

    @Column()
    adminId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'adminId' })
    admin: User;

    @Column({ type: 'text' })
    content: string;

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;
}