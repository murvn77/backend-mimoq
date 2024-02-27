import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Proyecto } from 'src/proyecto/entities/proyecto.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProjectDto, UpdateProjectDto } from 'src/proyecto/dtos/proyecto.dto';
import { UsuarioService } from 'src/usuario/services/usuario/usuario.service';

@Injectable()
export class ProyectoService {
  constructor(
    @InjectRepository(Proyecto)
    private proyectoRepo: Repository<Proyecto>,
    private usuarioService: UsuarioService,
  ) { }

  async findAll() {
    try {
      return await this.proyectoRepo.find({});
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando los proyectos: ${error}`,
      );
    }
  }

  async findOne(id: number) {
    try {
      const proyecto = await this.proyectoRepo.findOneBy({ id_proyecto: id });
      if (!(proyecto instanceof Proyecto)) {
        throw new NotFoundException(
          `Proyecto con id #${id} no se encuentra en la Base de Datos`,
        );
      }
      return proyecto;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando proyecto por id: ${error}`,
      );
    }
  }

  async findOneByUrlProject(url_proyecto: string) {
    try {
      const project = await this.proyectoRepo.findOne({
        where: { url_proyecto: url_proyecto }
      });

      return project;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando el proyecto dado el correo: ${error}`,
      );
    }
  }

  async createProject(data: CreateProjectDto) {
    try {
      const projectExists = await this.findOneByUrlProject(data.url_proyecto);
      if (projectExists instanceof Proyecto) {
        throw new InternalServerErrorException(
          `Este proyecto  ya se encuentra registrado en la BD`,
        );
      }
      const newProject = this.proyectoRepo.create(data);

      if (data.fk_usuario) {
        const user = await this.usuarioService.findOne(data.fk_usuario);
        newProject.usuario = user;
      }

      return this.proyectoRepo.save(newProject);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas creando el proyecto: ${error}`,
      );
    }
  }

  async updateProject(id: number, cambios: UpdateProjectDto) {
    try {
      const proyecto = await this.proyectoRepo.findOneBy({ id_proyecto: id });

      this.proyectoRepo.merge(proyecto, cambios);
      return this.proyectoRepo.save(proyecto);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas actualizando el proyecto: ${error}`,
      );
    }
  }

  removeProject(id: number) {
    return this.proyectoRepo.delete(id);
  }
}
