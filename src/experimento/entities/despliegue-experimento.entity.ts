import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Experimento } from './experimento.entity';
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';

@Entity()
export class DespliegueExperimento {
    @PrimaryGeneratedColumn()
    id_despliegue_experimento: number;

    @ManyToOne(() => Experimento, (experimento) => experimento.despliegueExperimentos)
    @JoinColumn({ name: 'fk_id_experimento' })
    experimento: Experimento;

    @ManyToOne(() => Despliegue, (despliegue) => despliegue.despliegueExperimentos)
    @JoinColumn({ name: 'fk_id_despliegue' })
    despliegue: Despliegue;
}