

import { basePath } from './config';

type RuntimeConfig = {
  basePath: string;
  isProduction: boolean;
};

export function getConfig(): RuntimeConfig {
  return {
    basePath: basePath,
    isProduction: process.env.NODE_ENV === 'production'
  };
}