import { Proyecto } from 'src/proyecto/entities/proyecto.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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

    @OneToMany(() => Proyecto, (proyecto) => proyecto.usuario)
    proyectos: Proyecto[];
}
