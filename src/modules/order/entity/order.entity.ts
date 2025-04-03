// import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
// import { User } from "./"
// import { OrderItem } from ""; // Sẽ định nghĩa tiếp

// @Entity()
// export class Order {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @ManyToOne(() => User, (user) => user.orders)
//   user: User;

//   @Column({ type: "varchar", length: 255 })
//   addressStreet: string;

//   @Column({ type: "varchar", length: 255 })
//   addressCity: string;

//   @Column({ type: "varchar", length: 50 })
//   addressCountry: string;

//   @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
//   orderItems: OrderItem[];

//   @Column({ type: "decimal", precision: 15, scale: 2 })
//   totalAmount: number; // Tổng tiền sản phẩm

//   @Column({ type: "decimal", precision: 15, scale: 2 })
//   shippingFee: number; // Phí ship gốc

//   @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
//   discountAmount: number; // Số tiền giảm giá

//   @Column({ type: "decimal", precision: 15, scale: 2 })
//   finalTotal: number; // Tổng tiền cuối cùng

//   @Column({ type: "varchar", length: 50, default: "PENDING" })
//   status: string; // PENDING, PAID, SHIPPED, DELIVERED, CANCELLED

//   @Column({ type: "varchar", length: 255, nullable: true })
//   paymentUrl: string; // URL thanh toán từ cổng thanh toán

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }

// @Entity()
// export class OrderItem {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @ManyToOne(() => Order, (order) => order.orderItems)
//   order: Order;

//   @Column({ type: "int" })
//   productId: number;

//   @Column({ type: "varchar", length: 255 })
//   name: string;

//   @Column({ type: "int" })
//   quantity: number;

//   @Column({ type: "decimal", precision: 15, scale: 2 })
//   price: number;

//   @Column({ type: "decimal", precision: 15, scale: 2 })
//   totalPrice: number;
// }