import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';

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

    @Column({ type: 'varchar', length: 100 })
    tag_img: string;

    @Column({ type: 'varchar', length: 100 })
    label_despliegue_k8s: string;


    @ManyToOne(() => Proyecto, (proyecto) => proyecto.despliegues)
    @JoinColumn({ name: 'fk_proyecto' })
    proyecto: Proyecto;
}
