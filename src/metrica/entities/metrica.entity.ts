import { OneToMany, Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Atributo } from './atributo.entity';
import { Experimento } from 'src/experimento/entities/experimento.entity';
import { Subatributo } from './subatributo.entity';

@Entity()
export class Metrica {
    @PrimaryGeneratedColumn()
    id_metrica: number;

    @Column({ type: 'varchar', length: 50 })
    nombre: string;

    @Column({ type: 'varchar', length: 500 })
    descripcion: string;

    @Column({ type: 'varchar', length: 200 })
    formula: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    nombre_prometheus: string;

    @ManyToOne(() => Subatributo, (subatributo) => subatributo.metricas, {
        nullable: false,
    })
    @JoinColumn({ name: 'fk_id_subatributo' })
    subatributo: Subatributo;
}
