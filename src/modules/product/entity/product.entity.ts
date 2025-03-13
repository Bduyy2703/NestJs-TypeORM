import { Category } from "src/modules/category/entity/category.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Tên sản phẩm

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number; // Giá sản phẩm

  @ManyToOne(() => Category, category => category.products, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @CreateDateColumn()
  createdAt: Date;
}
