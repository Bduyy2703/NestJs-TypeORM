import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cart } from "./cart.entity";
import { ProductDetails } from "src/modules/product-details/entity/productDetail.entity";

@Entity()
export class CartItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: "CASCADE" })
    cart: Cart;

    @ManyToOne(() => ProductDetails, (productDetails) => productDetails.cartItems, { onDelete: "CASCADE" })
    productDetails: ProductDetails;

    @Column({ type: "int", default: 1 })
    quantity: number;
}
