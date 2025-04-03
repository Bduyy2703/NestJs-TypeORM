import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Product } from "src/modules/product/entity/product.entity";
import { Inventory } from "src/modules/inventory/entity/inventory.entity";
import { CartItem } from "src/modules/cart/entity/cartItem.entity";


export enum ProductSize {
  SMALL = "S",
  MEDIUM = "M",
  LARGE = "L",
  XLARGE = "XL",
}

export enum ProductColor {
  GOLD = "Vàng",
  WHITE_GOLD = "Vàng trắng",
  ROSE_GOLD = "Vàng hồng",
  SILVER = "Bạc",
  PLATINUM = "Bạch kim",
}

export enum ProductMaterial {
  GOLD = "Vàng",
  WHITE_GOLD = "Vàng trắng",
  ROSE_GOLD = "Vàng hồng",
  SILVER = "Bạc",
  PLATINUM = "Bạch kim",
  TITANIUM = "Titan",
  DIAMOND = "Kim cương",
  PEARL = "Ngọc trai",
  EMERALD = "Ngọc lục bảo",
  RUBY = "Hồng ngọc",
  SAPPHIRE = "Lam ngọc",
  JADE = "Ngọc bích",
}
@Entity()
export class ProductDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "enum", enum: ProductSize })
  size: ProductSize;

  @Column({ type: "enum", enum: ProductColor })
  color: ProductColor;

  @Column({ type: "enum", enum: ProductMaterial })
  material: ProductMaterial;

  @Column()
  stock: number;

  @Column({ type: "int", default: 0 })
  sold: number;

  @Column({ type: "float", nullable: true }) // cm
  length?: number;

  @Column({ type: "float", nullable: true }) // cm
  width?: number;

  @Column({ type: "float", nullable: true }) // cm
  height?: number;

  @Column({ type: "float", nullable: true }) // gram
  weight?: number;

  @Column({ nullable: true })
  care_instructions?: string;

  @Column({ nullable: true })
  stone_size?: string;

  @Column({ nullable: true })
  stone_type?: string;

  @Column({ nullable: true })
  design_style?: string;

  @Column({ nullable: true, type: "text" })
  description?: string;

  @ManyToOne(() => Product, (product) => product.productDetails, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @ManyToOne(() => Inventory, (inventory) => inventory.productDetails, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inventoryId' })
  inventory: Inventory;

  @OneToMany(() => CartItem, (cartItem) => cartItem.productDetails)
  cartItems: CartItem[];
}

