import { Product } from "src/modules/product/entity/product.entity";
import { CategoryStrategySale } from "src/modules/strategySale/entity/categorySale.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @ManyToOne(() => Category, category => category.children, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "parentId" })
  parent: Category;
  
  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @OneToMany(() => Product, product => product.category)
  products: Product[];

  @OneToMany(() => CategoryStrategySale, (categoryStrategySale) => categoryStrategySale.category)
  categoryStrategySales: CategoryStrategySale[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
