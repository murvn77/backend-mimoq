import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Despliegue } from './despliegue.entity';

@Entity()
export class Proyecto {
    @PrimaryGeneratedColumn()
    id_proyecto: number;

    @Column({ type: 'varchar', length: 100 })
    titulo: string;

    @Column({ type: 'varchar', length: 100 })
    descripcion: string;

    @Column({ type: 'varchar', length: 100 })
    url_proyecto: string;

    @Column({ type: 'boolean', nullable: true })
    docker_compose: boolean;

    @Column({ type: 'boolean', nullable: true })
    dockerfile: boolean;

    @ManyToOne(() => Usuario, (usuario) => usuario.proyectos)
    @JoinColumn({ name: 'fk_usuario' })
    usuario: Usuario;

    @OneToMany(() => Despliegue, (despliegue) => despliegue.proyecto)
    despliegues: Despliegue[];
}
