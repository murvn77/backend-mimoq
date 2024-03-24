import { Module } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import config from "src/config";
import { UsuarioModule } from "src/usuario/usuario.module";
import { AuthService } from './services/auth/auth.service';
import { AuthController } from './controllers/auth/auth.controller';
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsuarioService } from "src/usuario/services/usuario/usuario.service";
import { ProyectoModule } from "src/proyecto/proyecto.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { RolUsuario } from "src/usuario/entities/rol-usuario.entity";
import { RolUsuarioService } from "src/usuario/services/rol-usuario/rol-usuario.service";

@Module({
    imports: [
      UsuarioModule,
      PassportModule,
      TypeOrmModule.forFeature([
        Usuario, 
        RolUsuario
      ]),
      JwtModule.registerAsync({
        inject: [config.KEY],
        useFactory: (configService: ConfigType<typeof config>) => {
          return {
            secret: configService.jwtSecret,
            signOptions: {
              expiresIn: '1h',
            },
          };
        },
      }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy, UsuarioService, RolUsuarioService],
    controllers: [AuthController],
  })
  export class AuthModule {}