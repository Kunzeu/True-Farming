/** Local shim so `import('cloudflare:workers')` works under the Node adapter. */
export const env = new Proxy(
  {},
  {
    get(_t, prop: string) {
      return process.env[prop];
    },
  }
);
