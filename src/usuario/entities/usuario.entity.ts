import { Proyecto } from 'src/proyecto/entities/proyecto.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolUsuario } from './rol-usuario.entity';

@Entity()
export class Usuario {
    @PrimaryGeneratedColumn()
    id_usuario: number;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'varchar', length: 100 })
    correo: string;

    @Column({ type: 'varchar', length: 100 })
    documento: string;

    @Column({ type: 'varchar', length: 100 })
    contrasena: string;

    @ManyToOne(() => RolUsuario, (rol_usuario) => rol_usuario.usuarios, {
        nullable: false,
    })
    @JoinColumn({ name: 'fk_id_rol_usuario' })
    rol: RolUsuario;

    @OneToMany(() => Proyecto, (proyecto) => proyecto.usuario)
    proyectos: Proyecto[];
}
