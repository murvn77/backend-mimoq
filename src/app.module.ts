import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuarioModule } from './usuario/usuario.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import * as Joi from 'joi';
import { MetricaModule } from './metrica/metrica.module';
import { ProyectoModule } from './proyecto/proyecto.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // envFilePath: enviroments[process.env.NODE_ENV] || '.prod.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        PG_HOST: Joi.string().required(),
        PG_DATABASE: Joi.string().required(),
        PG_USUARIO: Joi.string().required(),
        PG_PASSWORD: Joi.string().required(),
        PG_PORT: Joi.number().required(),
      }),
    }),
    DatabaseModule,
    UsuarioModule,
    MetricaModule,
    ProyectoModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
