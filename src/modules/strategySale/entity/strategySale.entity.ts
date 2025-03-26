import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, OneToMany, RelationId } from "typeorm";
import { Product } from "src/modules/product/entity/product.entity";
import { CategoryStrategySale } from "./categorySale.entity";
import { ProductStrategySale } from "./productSale.entity";

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
  @OneToMany(() => ProductStrategySale, (productStrategySale) => productStrategySale.strategySale)
  productStrategySales: ProductStrategySale[];
  
  @OneToMany(() => CategoryStrategySale, (categoryStrategySale) => categoryStrategySale.strategySale)
  categoryStrategySales: CategoryStrategySale[];

  @RelationId((strategySale: StrategySale) => strategySale.productStrategySales)
  productIds: number[];

  @RelationId((strategySale: StrategySale) => strategySale.categoryStrategySales)
  categoryIds: number[];

  @CreateDateColumn()
  createdAt: Date;
}
