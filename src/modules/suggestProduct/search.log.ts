import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../users/entities/user.entity";

@Entity()
export class SearchLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  searchTerm: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  searchedAt: Date;
}
