import { NextFunction, Request, Response } from "express";
import { supabaseAuth } from "../lib/supabase";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const accessToken = authorization.slice(7);
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (error || !user) {
    return res.status(401).json({ error: "Token inválido" });
  }

  res.locals.user = user;
  res.locals.accessToken = accessToken;
  next();
}