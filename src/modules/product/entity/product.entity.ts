import { Category } from "src/modules/category/entity/category.entity";
import { ProductDetails } from "../../product-details/entity/productDetail.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { StrategySale } from "src/modules/strategySale/entity/strategySale.entity";
import { ProductStrategySale } from "src/modules/strategySale/entity/productSale.entity";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  originalPrice: number;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @OneToMany(() => ProductDetails, (productDetails) => productDetails.product, { cascade: true })
  productDetails: ProductDetails[];

  @OneToMany(() => ProductStrategySale, (productStrategySale) => productStrategySale.product)
  productStrategySales: ProductStrategySale[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
