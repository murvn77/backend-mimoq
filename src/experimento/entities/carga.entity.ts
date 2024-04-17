import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Experimento } from './experimento.entity';

@Entity()
export class Carga {
    @PrimaryGeneratedColumn()
    id_carga: number;

    @Column('varchar', { array: true })    
    cant_usuarios: string[];

    @Column('varchar', { array: true })    
    duracion_picos: string[];

    @OneToMany(
        () => Experimento,
        (experimento) => experimento.carga,
    )
    experimentos: Experimento[];
}