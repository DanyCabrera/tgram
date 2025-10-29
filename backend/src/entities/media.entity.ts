import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'image' | 'video' | 'audio';

  @Column()
  url: string;

  @Column({ nullable: true })
  filename?: string;

  @Column({ nullable: true })
  size?: number;

  @Column({ nullable: true })
  mimeType?: string;

  @Column()
  postId: string;

  @ManyToOne(() => Post, post => post.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
