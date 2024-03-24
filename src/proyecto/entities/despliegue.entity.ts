import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Experimento } from 'src/experimento/entities/experimento.entity';
import { DespliegueExperimento } from 'src/experimento/entities/despliegue-experimento.entity';

@Entity()
export class Despliegue {
    @PrimaryGeneratedColumn()
    id_despliegue: number;

    @Column({ type: 'integer', nullable: true })
    cant_replicas: number;

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
        () => DespliegueExperimento,
        (despliegueExperimento) => despliegueExperimento.despliegue,
    )
    despliegueExperimentos: DespliegueExperimento[];
}
