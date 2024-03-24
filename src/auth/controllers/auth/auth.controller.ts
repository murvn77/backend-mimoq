import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Usuario } from 'src/usuario/entities/usuario.entity';
import { AuthService } from 'src/auth/services/auth/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiBody({ description: 'Credenciales de usuario', type: Usuario })
    @UseGuards(AuthGuard('local'))
    login(@Req() req: Request) {
        const usuario = req.user as Usuario;
        return this.authService.generateJWT(usuario);
    }
}