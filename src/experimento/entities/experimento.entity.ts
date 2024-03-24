import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DespliegueExperimento } from './despliegue-experimento.entity';

@Entity()
export class Experimento {
    @PrimaryGeneratedColumn()
    id_experimento: number;

    @Column({ type: 'integer' })
    duracion: number;

    @Column({ type: 'integer' })
    cantidad_usuarios: number;

    @Column({ type: 'integer' })
    cantidad_replicas: number;

    @Column({ type: 'varchar', length: 100 })
    readonly endpoints: string[];

    @OneToMany(
        () => DespliegueExperimento,
        (despliegueExperimento) => despliegueExperimento.experimento,
    )
    despliegueExperimentos: DespliegueExperimento[];
}