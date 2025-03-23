import { Entity, Column, CreateDateColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { StrategySaleCategory } from "./strategy-category";
import { StrategySaleProduct } from "./strategy-product";

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

  @Column({ default: false })
  isGlobalSale: boolean;

  // Liên kết đến các bảng trung gian
  @OneToMany(() => StrategySaleCategory, (saleCate) => saleCate.strategySale, { cascade: true })
  saleCategories: StrategySaleCategory[];

  @OneToMany(() => StrategySaleProduct, (saleProd) => saleProd.strategySale, { cascade: true })
  saleProducts: StrategySaleProduct[];

  @CreateDateColumn()
  createdAt: Date;
}
