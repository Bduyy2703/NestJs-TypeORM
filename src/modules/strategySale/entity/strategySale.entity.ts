import { Category } from "src/modules/category/entity/category.entity";
import { Product } from "src/modules/product/entity/product.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class StrategySale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Tên chiến lược (vd: Sale mùa hè)

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  discountPercent: number; // Giảm giá theo %

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  discountAmount: number; // Giảm giá theo số tiền cố định

  @Column({ type: "timestamp", nullable: true })
  startDate: Date; // Ngày bắt đầu

  @Column({ type: "timestamp", nullable: true })
  endDate: Date; // Ngày kết thúc

  @Column({ default: true })
  isActive: boolean; // Trạng thái kích hoạt

  @ManyToOne(() => Category, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category: Category; // Giảm giá cho danh mục (nếu có)

  @ManyToOne(() => Product, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product; // Giảm giá cho sản phẩm cụ thể (nếu có)

  @CreateDateColumn()
  createdAt: Date;
}
