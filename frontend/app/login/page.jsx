import { LoginForm } from "@/components/auth/login-form";
export default function LoginPage() {
    return (<main className="flex h-screen overflow-hidden flex-col bg-app-creme-leve">
      <LoginForm />
      <p className="px-4 py-2 text-center text-[11px] font-semibold text-app-cinza">
        &copy; 2026 APPONO. Todos os direitos reservados.
      </p>
    </main>);
}
