import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Repository } from 'typeorm';
import { CreateUsuarioDto, UpdateUsuarioDto } from 'src/usuario/dtos/usuario.dto';

import * as bcrypt from 'bcrypt';
import config from 'src/config';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsuarioService {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepo: Repository<Usuario>,
    ) { }


    async findAll() {
        try {
            return await this.usuarioRepo.find({
                // relations: ['rol', 'perfil', 'estadoUsuario'],
            });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas encontrando los usuarios: ${error}`,
            );
        }
    }

    async findOne(id: number) {
        try {
            const user = await this.usuarioRepo.findOneBy({id_usuario: id});
            if (!(user instanceof Usuario)) {
                throw new NotFoundException(
                    `Usuario con id #${id} no se encuentra en la Base de Datos`,
                );
            }
            return user;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas encontrando a un usuario por id: ${error}`,
            );
        }
    }

    async findOneByEmail(correo_cor: string) {
        try {
            const user = await this.usuarioRepo.findOne({
                where: { correo: correo_cor },
                // relations: ['pais', 'rol', 'estadoUsuario'],
            });
            return user;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas encontrando el usuario dado el correo: ${error}`,
            );
        }
    }


    //   async findUserProjects(id: number) {
    //     try {
    //       const user = await this.usuarioRepo.findOne(id, {
    //         relations: ['usuarioProyecto', 'usuarioProyecto.proyecto','usuarioProyecto.proyecto.estado_proyecto'],
    //       });

    //       if (!user) {
    //         throw new NotFoundException(
    //           `El usuario con id #${id} no se encuentra en la Base de Datos`,
    //         );
    //       }
    //       return user;
    //     } catch (error) {
    //       console.error(error);
    //       throw new InternalServerErrorException(
    //         `Problemas encontrando los proyectos del usuario: ${error}`,
    //       );
    //     }
    //   }

    async createUser(data: CreateUsuarioDto) {
        try {
            const userExits = await this.findOneByEmail(data.correo);
            if (userExits instanceof Usuario) {
                throw new InternalServerErrorException(
                    `Este usuario ya se encuentra registrado en la BD`,
                );
            }
            const newUser = this.usuarioRepo.create(data);
            const hashPassword = await bcrypt.hash(newUser.contrasena, 10);
            newUser.contrasena = hashPassword;

            // if (data.fk_estadoU) {
            //     const estado = await this.estadoUsuarioService.findOne(data.fk_estadoU);
            //     newUser.estadoUsuario = estado;
            // }

            return this.usuarioRepo.save(newUser);
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas creando el usuario: ${error}`,
            );
        }
    }

    async update(id: number, cambios: UpdateUsuarioDto) {
        try {
            const user = await this.usuarioRepo.findOneBy({id_usuario: id});
            // if (cambios.fk_estadoU) {
            //     const estado = await this.estadoUsuarioService.findOne(
            //         cambios.fk_estadoU,
            //     );
            //     user.estadoUsuario = estado;
            // }

            this.usuarioRepo.merge(user, cambios);
            return this.usuarioRepo.save(user);
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas actualizando el usuario: ${error}`,
            );
        }
    }

    async updatePassword(id: number, psdActual: string, psdNew: string) {
        const user = await this.usuarioRepo.findOneBy({id_usuario: id});
        if (!(user instanceof Usuario)) {
            throw new NotFoundException(
                `Usuario no encontrado para actualizar contraseña`,
            );
        }
        const isMatch = await bcrypt.compare(psdActual, user.contrasena);
        if (!isMatch) {
            throw new InternalServerErrorException(
                `Problemas actualizando la contraseña`,
            );
        }
        const hashPassword = await bcrypt.hash(psdNew, 10);
        user.contrasena = hashPassword;
        return this.usuarioRepo.save(user);
    }


    remove(id: number) {
        return this.usuarioRepo.delete(id);
    }
}
