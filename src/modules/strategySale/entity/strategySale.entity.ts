import { Category } from "src/modules/category/entity/category.entity";
import { Product } from "src/modules/product/entity/product.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

  @Column({ default: true })
  isActive: boolean; 

  @ManyToOne(() => Category, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category: Category; 

  @ManyToOne(() => Product, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product; 

  @CreateDateColumn()
  createdAt: Date;
}
