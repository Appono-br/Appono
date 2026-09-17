import { RegisterRestaurantForm } from "@/components/auth/register-restaurant-form";
export default async function RestaurantRegisterPage({ searchParams }) {
    const params = await searchParams;
    const googleFlow = params?.google === "1";
    return (<main className="auth-publica flex min-h-screen flex-col bg-white text-app-texto-escuro">
      <section className="flex flex-1 items-center px-4 py-2">
        <RegisterRestaurantForm googleFlow={googleFlow} />
      </section>
    </main>);
}
