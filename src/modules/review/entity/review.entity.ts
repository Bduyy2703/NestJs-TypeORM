import { Product } from 'src/modules/product/entity/product.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ReviewReply } from './review-reply';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    productId: number;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text' })
    comment: string;

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;

    @Column({ default: false })
    isHidden: boolean;

    @OneToOne(() => ReviewReply, reply => reply.review)
    reply: ReviewReply;
}