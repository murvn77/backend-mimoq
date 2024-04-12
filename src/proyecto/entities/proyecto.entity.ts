import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Despliegue } from './despliegue.entity';

@Entity()
export class Proyecto {
    @PrimaryGeneratedColumn()
    id_proyecto: number;

    @Column({ type: 'varchar', length: 40 })
    nombre: string;

    @Column({ type: 'varchar', length: 250 })
    descripcion: string;

    @Column({ type: 'varchar', length: 150, nullable: true})
    url_repositorio: string;

    @Column('varchar', { array: true, nullable: true })    
    urls_repositorios: string[];

    @Column('varchar', { array: true, nullable: true })    
    nombres_microservicios: string[];

    @Column({ type: 'boolean' })
    docker_compose: boolean;

    @Column({ type: 'boolean' })
    dockerfile: boolean;

    @ManyToOne(() => Usuario, (usuario) => usuario.proyectos)
    @JoinColumn({ name: 'fk_usuario' })
    usuario: Usuario;

    @OneToMany(() => Despliegue, (despliegue) => despliegue.proyecto)
    despliegues: Despliegue[];
}
