import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Product } from "src/modules/product/entity/product.entity";
import { Category } from "src/modules/category/entity/category.entity";

@Entity()
export class StrategySale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  discountPercent: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  discountAmount: number;

  @Column({ type: "timestamp", nullable: true })
  startDate: Date;

  @Column({ type: "timestamp", nullable: true })
  endDate: Date;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isGlobalSale: boolean;

  // Liên kết với Product và Category
  @OneToMany(() => Product, (product) => product.strategySale)
  products: Product[];

  @OneToMany(() => Category, (category) => category.strategySale)
  categories: Category[];

  @CreateDateColumn()
  createdAt: Date;
}
