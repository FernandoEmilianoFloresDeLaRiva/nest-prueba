import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserInterface } from '../../../domain/entities/user';
import { UserProfile } from './user_profile.entity';
import { Terrariums } from '../../../../terrariums/infraestructure/ports/mysql';

@Entity({ name: 'users' })
export class User implements UserInterface {
  @PrimaryGeneratedColumn()
  readonly id: number;
  @Column({ nullable: false, length: 60, unique: true })
  readonly email: string;
  @Column({ unique: true, nullable: false, length: 45 })
  readonly username: string;
  @Column({ nullable: false })
  passwordUser: string;
  @OneToOne(() => UserProfile, (user) => user.user, { cascade: true })
  @JoinColumn({ name: 'id_user_profile' })
  userProfile: UserProfile;
  @OneToMany(() => Terrariums, (terrariums) => terrariums.user)
  terrariums: Terrariums[];
}
