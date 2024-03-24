import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    port: parseInt(process.env.PORT, 10),
    postgres: {
      host: process.env.PG_HOST,
      name: process.env.PG_DATABASE,
      // schema: process.env.PG_SCHEMA,
      user: process.env.PG_USUARIO,
      password: process.env.PG_PASSWORD,
      port: parseInt(process.env.PG_PORT, 10),
    },
    jwtSecret: process.env.JWT_SECRET,
  };
});
