import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  
  MONGODB_URI: z.string().default('mongodb://localhost:27017/techscholars'),
  
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

export function initEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment configuration');
  }
  
  env = result.data;
  return env;
}

export function getEnv() {
  if (!env) {
    return initEnv();
  }
  return env;
}