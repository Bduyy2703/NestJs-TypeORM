import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Discount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, unique: true })
  name: string; 

  @Column({ type: "varchar", length: 255, nullable: true })
  condition: string; 

  @Column({ type: "decimal", precision: 10, scale: 2 })
  discountValue: number; 

  @Column({ type: "enum", enum: ["PERCENTAGE", "FIXED"], default: "FIXED" })
  discountType: "PERCENTAGE" | "FIXED"; 

  @Column({ type: "int", default: 0 })
  quantity: number; 

  @Column({ type: "timestamp", nullable: true })
  startDate: Date; 

  @Column({ type: "timestamp", nullable: true })
  endDate: Date; 

  @Column({ type: "boolean", default: true })
  isActive: boolean; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
