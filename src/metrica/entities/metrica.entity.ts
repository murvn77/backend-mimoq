import { OneToMany, Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Atributo } from './atributo.entity';
import { Experimento } from 'src/experimento/entities/experimento.entity';

@Entity()
export class Metrica {
    @PrimaryGeneratedColumn()
    id_metrica: number;

    @Column({ type: 'varchar', length: 50 })
    nombre: string;

    @Column({ type: 'varchar', length: 250 })
    descripcion: string;

    @ManyToOne(() => Atributo, (atributo) => atributo.metricas, {
        nullable: false,
    })
    @JoinColumn({ name: 'fk_id_atributo' })
    atributo: Atributo;
}