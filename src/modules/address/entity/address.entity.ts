import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { defaultIfEmpty } from "rxjs";

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column({default : false})
  isDefault : boolean;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: "CASCADE" })
  user: User;
}
