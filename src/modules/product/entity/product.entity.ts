import { Category } from "src/modules/category/entity/category.entity";
import { ProductDetails } from "./productDetail.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { StrategySale } from "src/modules/strategySale/entity/strategySale.entity";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  originalPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, default: null })
  priceSale: number | null; // nên xóa 

  @ManyToOne(() => Category, (category) => category.products, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @OneToMany(() => ProductDetails, (productDetails) => productDetails.product, { cascade: true })
  productDetails: ProductDetails[];

  @ManyToOne(() => StrategySale, (strategySale) => strategySale.products, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "strategySaleId" })
  strategySale: StrategySale;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


// mỗi product có nhiều detail , 1 detail có 1 hoặc kho inventory 