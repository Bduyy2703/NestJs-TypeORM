import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, Column } from "typeorm";
import { Product } from "src/modules/product/entity/product.entity";
import { StrategySale } from "src/modules/strategySale/entity/strategySale.entity";

@Entity()
@Unique(["product", "strategySale"]) 
export class ProductStrategySale {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.productStrategySales, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @Column()
  productId: number; // ✅ Thêm productId

  @ManyToOne(() => StrategySale, (sale) => sale.productStrategySales, { onDelete: "CASCADE" })
  @JoinColumn({ name: "strategySaleId" })
  strategySale: StrategySale;

  @Column()
  strategySaleId: number; // ✅ Thêm strategySaleId
}
