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

    @Column({ type: 'varchar', length: 100, nullable: true})
    url_proyecto: string;

    // @Column({ type: 'varchar', length: 100, nullable: false})
    // tipo: string; --- Individual o multiple

    @Column('varchar', { array: true, nullable: true })    
    urls_proyecto: string[];

    @Column('varchar', { array: true, nullable: true })    
    nombres_proyecto: string[];

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
