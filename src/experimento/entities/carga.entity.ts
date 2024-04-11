import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Experimento } from './experimento.entity';

@Entity()
export class Carga {
    @PrimaryGeneratedColumn()
    id_carga: number;

    @Column({ type: 'varchar', length: 50 })
    cant_usuarios: string;

    @Column({ type: 'varchar', length: 50 })
    duracion_picos: string;

    @Column({ type: 'boolean' })
    con_picos: boolean;

    @OneToMany(
        () => Experimento,
        (experimento) => experimento.carga,
    )
    experimentos: Experimento[];
}