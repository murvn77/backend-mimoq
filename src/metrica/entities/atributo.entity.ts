import { OneToMany, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Metrica } from './metrica.entity';

@Entity()
export class Atributo {
    @PrimaryGeneratedColumn()
    id_atributo: number;

    @Column({ type: 'varchar', length: 50 })
    nombre: string;

    @OneToMany(() => Metrica, (metrica) => metrica.atributo)
    metricas: Metrica[];
}