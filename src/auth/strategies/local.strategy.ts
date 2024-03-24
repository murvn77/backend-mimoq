import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { AuthService } from '../services/auth/auth.service';


@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'correo',
            passwordField: 'contrasena',
        });
    }

    async validate(email: string, password: string) {
        const usuario = await this.authService.validateUser(email, password);
        if (usuario instanceof Usuario) {
            return usuario;
        } else {
            throw new UnauthorizedException('No esta Autorizado');
        }
    }
}