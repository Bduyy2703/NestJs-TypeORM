import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
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

    @ManyToOne(() => Discount, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "discountId" })
    discount: Discount;
}