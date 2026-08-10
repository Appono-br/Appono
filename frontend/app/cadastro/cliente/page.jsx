import { RegisterClientForm } from "@/components/auth/register-client-form";
export default async function ClientRegisterPage({ searchParams }) {
    const params = await searchParams;
    const googleFlow = params?.google === "1";
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-texto-escuro">
      <section className="flex flex-1 items-center px-4 py-2">
        <RegisterClientForm googleFlow={googleFlow} />
      </section>
      <p className="px-4 py-3 text-center text-xs font-semibold text-app-cinza">
        &copy; 2026 APPONO. Todos os direitos reservados.
      </p>
    </main>);
}
