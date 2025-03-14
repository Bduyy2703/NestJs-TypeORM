import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "src/modules/product/entity/product.entity";

@Entity()
export class ProductDetails {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    size: string;

    @Column()
    color: string;

    @Column()
    stock: number;

    @Column({ type: "int", default: 0 })
    sold: number;

    @ManyToOne(() => Product, (product) => product.productDetails, { onDelete: "CASCADE" })
    @JoinColumn({ name: "productId" })
    product: Product;
}
