import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSubatributoDto } from 'src/metrica/dtos/subatributo.dto';
import { Subatributo } from 'src/metrica/entities/subatributo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubatributoService {
    constructor(
        @InjectRepository(Subatributo)
        private subatributoRepo: Repository<Subatributo>,
    ) { }

    async find() {
        try {
            return await this.subatributoRepo.find();
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas encontrando los subatributos: ${error}`,
            );
        }
    }

    async findOne(id: number) {
        try {
            const subatributo = await this.subatributoRepo.findOneBy({ id_subatributo: id });
            if (!(subatributo instanceof Subatributo)) {
                throw new NotFoundException(
                    `Subatributo con #${id} no se encuentra en la Base de Datos`,
                );
            }
            return subatributo;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas encontrando el subatributo por id: ${error}`,
            );
        }
    }

    async findOneByName(nombre: string) {
        try {
            const subatributo = await this.subatributoRepo.findOne({
                where: { nombre: nombre },
                relations: ['metricas'],
            });
            if (!subatributo) {
                throw new NotFoundException(
                    `Subatributo "${nombre}" no se encuentra en la Base de Datos`,
                );
            }
            return subatributo;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas encontrando el subatributo por nombre: ${error}`,
            );
        }
    }

    async createSubatributo(data: CreateSubatributoDto) {
        try {
            const newSubatributo = this.subatributoRepo.create(data);
            return this.subatributoRepo.save(newSubatributo);
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas creando el subatributo: ${error}`,
            );
        }
    }
}
