import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ExperimentoDespliegue } from './experimento-despliegue.entity';

@Entity()
export class Experimento {
    @PrimaryGeneratedColumn()
    id_experimento: number;

    @Column({ type: 'integer' })
    duracion: number;

    @Column({ type: 'integer' })
    cantidad_usuarios: number;

    @Column({ type: 'varchar', length: 100 })
    endpoints: string[];

    @OneToMany(
        () => ExperimentoDespliegue,
        (experimentoDespliegue) => experimentoDespliegue.experimento,
    )
    despliegueExperimentos: ExperimentoDespliegue[];
}