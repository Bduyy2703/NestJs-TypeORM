import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, Column } from "typeorm";
import { Category } from "src/modules/category/entity/category.entity";
import { StrategySale } from "src/modules/strategySale/entity/strategySale.entity";

@Entity()
@Unique(["category", "strategySale"])
export class CategoryStrategySale {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Category, (category) => category.categoryStrategySales, { onDelete: "CASCADE" })
    @JoinColumn({ name: "categoryId" })
    category: Category;

    @ManyToOne(() => StrategySale, (sale) => sale.categoryStrategySales, { onDelete: "CASCADE" })
    @JoinColumn({ name: "strategySaleId" })
    strategySale: StrategySale;

    @Column()
    strategySaleId: number;

    @Column()
    categoryId: number;
}
