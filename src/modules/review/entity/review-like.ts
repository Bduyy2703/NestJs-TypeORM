import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';    
import { Review } from './review.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('review_likes')
export class ReviewLike {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reviewId: number;

    @ManyToOne(() => Review, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reviewId' })
    review: Review;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    createdAt: Date;
}