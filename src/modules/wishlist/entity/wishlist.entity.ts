import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProductDetails } from 'src/modules/product-details/entity/productDetail.entity';


@Entity()
@Unique(['user', 'productDetail'])
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ProductDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productDetailId' })
  productDetail: ProductDetails;

  @CreateDateColumn()
  createdAt: Date;
}