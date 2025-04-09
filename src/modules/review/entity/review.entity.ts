import { Product } from 'src/modules/product/entity/product.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    productId: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ type: 'int' })
    rating: number; // Điểm đánh giá (1-5)

    @Column({ type: 'text' })
    comment: string; // Nội dung đánh giá

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;

    @Column({ default: false })
    isHidden: boolean;
}