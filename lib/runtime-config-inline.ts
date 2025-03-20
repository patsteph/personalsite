import { getBasePath } from './firebase';

type RuntimeConfig = {
  basePath: string;
  isProduction: boolean;
};

export function getConfig(): RuntimeConfig {
  return {
    basePath: getBasePath(),
    isProduction: process.env.NODE_ENV === 'production'
  };
}