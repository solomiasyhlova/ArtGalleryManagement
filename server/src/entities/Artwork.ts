import { ARTWORK_TYPES, type ArtworkType } from '@art-gallery/shared';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericTransformer } from '../db/transformers.js';

// Column types are explicit because tsx/esbuild don't emit decorator metadata.
@Entity('artworks')
@Check('artworks_price_positive', `"price" > 0`)
export class Artwork {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 99 })
  title!: string;

  @Index('artworks_artist_idx')
  @Column({ type: 'varchar', length: 50 })
  artist!: string;

  // An explicit enumName keeps the Postgres type name stable across migrations.
  @Index('artworks_type_idx')
  @Column({ type: 'enum', enum: [...ARTWORK_TYPES], enumName: 'artwork_type' })
  type!: ArtworkType;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericTransformer })
  price!: number;

  @Column({ type: 'boolean', default: true })
  availability!: boolean;

  @Column({ name: 'image_url', type: 'varchar', length: 2048, nullable: true })
  imageUrl!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
