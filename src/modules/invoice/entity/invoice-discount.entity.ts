import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Invoice } from "./invoice.entity";
import { Discount } from "../../discount/entity/discount.entity";

@Entity()
export class InvoiceDiscount {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    invoiceId: number;

    @ManyToOne(() => Invoice, invoice => invoice.id)
    invoice: Invoice;

    @Column()
    discountId: number;

    @ManyToOne(() => Discount, discount => discount.id)
    discount: Discount;
}