import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { ExperimentoDespliegue } from 'src/experimento/entities/experimento-despliegue.entity';

@Entity()
export class Despliegue {
    @PrimaryGeneratedColumn()
    id_despliegue: number;

    // @Column('integer', { array: true, nullable: true })    
    // cant_replicas: number[];

    @Column({ type: 'integer', nullable: true })
    replicas: number;

    @Column({ type: 'integer', nullable: true })
    cant_pods: number;

    @Column({ type: 'varchar', length: 100 })
    nombre_namespace: string;

    @Column({ type: 'varchar', length: 100 })
    usuario_img: string;

    @Column({ type: 'varchar', length: 100 })
    nombre_img: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    tag_img: string;

    @Column({ type: 'varchar', length: 100 })
    label_despliegue_k8s: string;

    @Column({ type: 'integer' })
    puerto: number;

    @ManyToOne(() => Proyecto, (proyecto) => proyecto.despliegues)
    @JoinColumn({ name: 'fk_proyecto' })
    proyecto: Proyecto;

    @OneToMany(
        () => ExperimentoDespliegue,
        (experimentoDespliegue) => experimentoDespliegue.despliegue,
    )
    despliegueExperimentos: ExperimentoDespliegue[];
}
