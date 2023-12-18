export { Config, ConfigSchema, validateConfig };

import { z } from 'zod';

import pkg from '../package.json';

const ConfigSchema = z
  .object({
    publicPath: z
      .string()
      .optional()
      .describe('The public path to the wasm files and the onnx model.')
      .default('https://unpkg.com/${PACKAGE_NAME}@${PACKAGE_VERSION}/dist/')
      .transform((val) => {
        return val
          .replace('${PACKAGE_NAME}', pkg.name)
          .replace('${PACKAGE_VERSION}', pkg.version);
      }),
    debug: z
      .boolean()
      .default(false)
      .describe('Whether to enable debug logging.'),
    proxyToWorker: z
      .boolean()
      .default(true)
      .describe('Whether to proxy inference to a web worker.'),
    fetchArgs: z
      .any()
      .default({})
      .describe('Arguments to pass to fetch when loading the model.'),
    progress: z
      .function()
      .args(z.string(), z.number(), z.number())
      .returns(z.void())
      .describe('Progress callback.')
      .optional(),
    model: z.enum(['small', 'medium']).default('medium'),
    output: z
      .object({
        format: z
          .enum(['image/png', 'image/jpeg', 'image/webp', 'image/x-rgba8'])
          .default('image/png'),
        quality: z.number().default(0.8),
        type: z.enum(['foreground', 'background', 'mask']).default('foreground')
      })
      .default({})
  })
  .default({});

type Config = z.infer<typeof ConfigSchema>;

function validateConfig(configuration?: Config): Config {
  const config = ConfigSchema.parse(configuration ?? {});
  if (config.debug) console.log('Config:', config);
  if (config.debug && !config.progress) {
    config.progress =
      config.progress ??
      ((key, current, total) => {
        console.debug(`Downloading ${key}: ${current} of ${total}`);
      });

    if (!crossOriginIsolated) {
      console.debug(
        'Cross-Origin-Isolated is not enabled. Performance will be degraded. Please see  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer.'
      );
    }
  }
  return config;
}
