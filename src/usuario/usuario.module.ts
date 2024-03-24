import { Module } from '@nestjs/common';
import { UsuarioController } from './controllers/usuario/usuario.controller';
import { UsuarioService } from './services/usuario/usuario.service';
import { Usuario } from './entities/usuario.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolUsuarioService } from './services/rol-usuario/rol-usuario.service';
import { RolUsuarioController } from './controllers/rol-usuario/rol-usuario.controller';
import { RolUsuario } from './entities/rol-usuario.entity';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/services/auth/auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario, 
      RolUsuario
    ]),
  ],
  controllers: [UsuarioController, RolUsuarioController],
  providers: [UsuarioService, RolUsuarioService],
})
export class UsuarioModule {}
