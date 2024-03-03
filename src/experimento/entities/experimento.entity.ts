import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}