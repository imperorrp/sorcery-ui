// Browser shim for esbuild - prevents Node.js code from running in browser
// This is a minimal shim that provides the interface without functionality

export default {
  build: () => Promise.resolve(),
  serve: () => Promise.resolve(),
  transform: () => Promise.resolve({ code: '', map: '' }),
  version: '0.25.12',
};

export const build = () => Promise.resolve();
export const serve = () => Promise.resolve();
export const transform = () => Promise.resolve({ code: '', map: '' });
export const version = '0.25.12';