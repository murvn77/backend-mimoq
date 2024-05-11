import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { Carga } from './carga.entity';
import { Metrica } from 'src/metrica/entities/metrica.entity';

@Entity()
export class Experimento {
    @PrimaryGeneratedColumn()
    id_experimento: number;

    @Column({ type: 'varchar', length: 70, nullable: true })
    nombre: string;

    @Column({ type: 'varchar', length: 5 })
    duracion: string;

    @Column({ type: 'integer' })
    cant_replicas: number;

    @Column('varchar', { array: true })
    endpoints: string[];

    @Column('varchar', { array: true, nullable: true })
    nombres_archivos: string[];

    @ManyToOne(() => Carga, (carga) => carga.experimentos)
    @JoinColumn({ name: 'fk_id_carga' })
    carga: Carga;

    @ManyToMany(() => Despliegue)
    @JoinTable()
    despliegues: Despliegue[];

    @ManyToMany(() => Metrica)
    @JoinTable()
    metricas: Metrica[];
}
