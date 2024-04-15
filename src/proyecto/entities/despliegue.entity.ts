import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Experimento } from 'src/experimento/entities/experimento.entity';

@Entity()
export class Despliegue {
    @PrimaryGeneratedColumn()
    id_despliegue: number;

    @Column({ type: 'varchar', length: 50 })
    nombre: string;

    @Column({ type: 'integer', nullable: true })
    cant_replicas: number;

    @Column({ type: 'integer', nullable: true })
    cant_pods: number;

    @Column({ type: 'varchar', length: 50 })
    namespace: string;

    // @Column({ type: 'varchar', length: 100 })
    // label_despliegue_k8s: string;

    @Column({ type: 'integer' })
    puerto: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    imagen: string;

    @ManyToOne(() => Proyecto, (proyecto) => proyecto.despliegues, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fk_proyecto' })
    proyecto: Proyecto;

    @OneToMany(
        () => Experimento,
        (experimento) => experimento.despliegue,
    )
    experimentos: Experimento[];
}
