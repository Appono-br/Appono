import { redirect } from "next/navigation";

export default async function LegacyPlanoRestaurantePage({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) query.append(name, item);
    }
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  redirect(`/restaurante/configuracoes/planos${suffix}`);
}
