import { USER_ROLES, type UserRole } from '@art-gallery/shared';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// `user` is a reserved word in Postgres. Column types are explicit because tsx/esbuild don't emit
// decorator metadata.
@Entity('users')
@Check('users_email_lowercase', `"email" = lower("email")`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  // Never loaded unless a query asks for it with `addSelect`.
  @Column({ name: 'password_hash', type: 'varchar', length: 72, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: [...USER_ROLES], enumName: 'user_role', default: 'user' })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
