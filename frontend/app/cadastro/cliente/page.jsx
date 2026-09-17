import { RegisterClientForm } from "@/components/auth/register-client-form";
export default async function ClientRegisterPage({ searchParams }) {
    const params = await searchParams;
    const googleFlow = params?.google === "1";
    return (<main className="auth-publica flex min-h-screen flex-col bg-white text-app-texto-escuro">
      <section className="flex flex-1 items-center px-4 py-2">
        <RegisterClientForm googleFlow={googleFlow} />
      </section>
    </main>);
}
