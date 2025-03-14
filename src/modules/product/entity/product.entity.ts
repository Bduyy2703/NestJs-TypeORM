import { Category } from "src/modules/category/entity/category.entity";
import { ProductDetails } from "./productDetail.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { File } from "src/modules/files/file.entity";
import { Inventory } from "src/modules/inventory/entity/inventory.entity";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; 

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number; 

  @Column()
  quantity: number;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @OneToMany(() => ProductDetails, (productDetails) => productDetails.product, { cascade: true })
  productDetails: ProductDetails[]; 

  @ManyToOne(() => Inventory, (inventory) => inventory.products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "inventoryId" })
  inventory: Inventory;  

  @OneToMany(() => File, (file) => file.targetId, { cascade: true })
  images: File[]; 

  @CreateDateColumn()
  createdAt: Date;
}
