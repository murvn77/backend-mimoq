import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Experimento {
    @PrimaryGeneratedColumn()
    id_experimento: number;

    @Column({ type: 'varchar', length: 100 })
    url_proyecto: string;

    @Column({ type: 'integer' })
    duracion: number;

    @Column({ type: 'integer' })
    cantidad_usuarios: number;
}