import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RightsEnum } from './Enums/rights.enum';
import { User } from './user.entity';
@Entity()
export class Right {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: RightsEnum,
        nullable: false,
    })
    value: RightsEnum;

    @ManyToOne(() => User, (user) => user.rights, {
        cascade: true,
        onDelete: 'CASCADE',
        nullable: false,
        orphanedRowAction: 'delete',
    })
    receiver: User;

    @ManyToOne(() => User, (_) => _, {
        cascade: true,
        onDelete: 'CASCADE',
        nullable: true,
        orphanedRowAction: 'delete',
    })
    giver: User;

    @Column({ nullable: true })
    giverId: number;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
    public created_at: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
    })
    public updated_at: Date;
}
