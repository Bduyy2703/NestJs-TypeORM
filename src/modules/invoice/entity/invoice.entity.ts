import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Address } from "../../address/entity/address.entity";
import { InvoiceItem } from "./invoiceItem.entity";

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
  items: InvoiceItem[]; // Danh sách sản phẩm

  @ManyToOne(() => Address)
  @JoinColumn({ name: "addressId" })
  address: Address;

  @Column()
  addressId: number;

  @Column()
  paymentMethod: string;

  @Column()
  totalProductAmount: number;

  @Column()
  shippingFee: number;

  @Column()
  shippingFeeDiscount: number;

  @Column()
  productDiscount: number;

  @Column()
  finalTotal: number;

  @Column()
  status: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}