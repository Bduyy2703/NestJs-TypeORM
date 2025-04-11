import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string; // Mô tả ngắn, dùng cho trang danh sách

  @Column({ type: 'text' })
  content: string; // Nội dung chi tiết, có thể chứa HTML

  @Column({ type: 'varchar', nullable: true })
  thumbnail: string; // Tên file hoặc URL của hình ảnh đại diện (lưu trên MinIO)

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  @Column({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;
}