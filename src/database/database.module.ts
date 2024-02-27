import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import config from '../config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        const { host, name, user, password, port } =
          configService.postgres;
        return {
          type: 'postgres',
          host,
          database: name,
          // schema,
          username: user,
          password,
          port,
          synchronize: true,
          autoLoadEntities: true,
          //entities: ["src/**/*.entity.ts"],
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
