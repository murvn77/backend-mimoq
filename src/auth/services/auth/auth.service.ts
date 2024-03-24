import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PayloadToken } from 'src/auth/models/token.model';
import { Usuario } from 'src/usuario/entities/usuario.entity';

import { UsuarioService } from 'src/usuario/services/usuario/usuario.service';

@Injectable()
export class AuthService {
    constructor(
        private usuarioService: UsuarioService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string) {
        try {
            console.log(email, password);
            const usuario = await this.usuarioService.findOneByEmail(email);
            console.log(usuario);
            if (usuario instanceof Usuario) {
                const isMatch = await bcrypt.compare(password, usuario.contrasena);
                if (isMatch) {
                    return usuario;
                }
            } else {
                throw new NotFoundException(
                    `No existe registro con el correo ${email}`,
                );
            }
            return null;
        } catch (error) {
            console.error(error);
            return error;
        }
    }

    generateJWT(usuario: Usuario) {
        const payload: PayloadToken = {
            role: usuario.rol.nombre,
            sub: usuario.id_usuario,
        };
        return {
            access_token: this.jwtService.sign(payload),
            usuario,
        };
    }
}