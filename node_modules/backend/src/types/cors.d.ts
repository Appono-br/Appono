declare module "cors" {
  import type { RequestHandler } from "express";

  interface CorsOptions {
    [key: string]: unknown;
  }

  function cors(options?: CorsOptions): RequestHandler;

  export = cors;
}
