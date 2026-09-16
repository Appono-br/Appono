import { RoutineSkeleton } from "@/components/cliente/rotina/routine-ui";

export default function LoadingRotina() {
    return <main className="min-h-screen bg-white px-4 py-6 text-app-cafe-profundo sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl"><RoutineSkeleton /></div>
    </main>;
}
