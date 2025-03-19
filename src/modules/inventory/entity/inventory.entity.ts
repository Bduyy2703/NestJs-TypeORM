import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ProductDetails } from "src/modules/product-details/entity/productDetail.entity";

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  warehouseName: string; 

  @Column({ type: "varchar", length: 255 })
  location: string; 

  @OneToMany(() => ProductDetails, (productDetails) => productDetails.inventory)
  productDetails: ProductDetails[];
  
}
