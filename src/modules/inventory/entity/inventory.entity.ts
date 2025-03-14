import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Product } from "src/modules/product/entity/product.entity";

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  warehouseName: string; 

  @Column({ type: "varchar", length: 255 })
  location: string; 

  @OneToMany(() => Product, (product) => product.inventory)
  products: Product[];
}
