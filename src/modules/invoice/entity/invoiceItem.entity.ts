import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Invoice } from "./invoice.entity";
import { ProductDetails } from "../../product-details/entity/productDetail.entity";

@Entity()
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Invoice, invoice => invoice.items)
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice;

  @Column()
  invoiceId: number;

  @ManyToOne(() => ProductDetails)
  @JoinColumn({ name: "productDetailId" })
  productDetail: ProductDetails;

  @Column()
  productDetailId: number;

  @Column()
  quantity: number;

  @Column()
  price: number;
}