import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Experimento } from './experimento.entity';

@Entity()
export class Carga {
    @PrimaryGeneratedColumn()
    id_carga: number;

    @Column('varchar')
    cantidad_usuarios: string;

    @Column('varchar')
    duracion_picos: string;

    @Column({ type: 'boolean' })
    con_picos: boolean;

    @OneToMany(
        () => Experimento,
        (experimento) => experimento.carga,
    )
    experimentos: Experimento[];
}