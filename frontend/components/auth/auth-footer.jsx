import Image from "next/image";
import Link from "next/link";
export function AuthFooter({ dark = false, compact = false }) {
    return (<footer className={dark
            ? "bg-app-cafe-profundo text-app-baunilha-dourada"
            : "border-t border-app-baunilha-dourada bg-app-creme-suave text-app-mocha"}>
      <div className={`mx-auto flex max-w-7xl flex-col px-6 md:flex-row md:items-center md:justify-between ${compact ? "gap-4 py-4" : "gap-8 py-8"}`}>
        <Link href="/" className="group w-fit">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={104} height={104} className={`transition duration-300 group-hover:scale-105 ${compact ? "h-9 w-9" : "h-20 w-20"} ${dark ? "brightness-0 invert sepia" : ""}`}/>
        </Link>

        <nav className={`flex flex-col font-semibold uppercase tracking-[0.28em] md:flex-row md:items-center ${compact ? "gap-3 md:gap-8" : "gap-4 md:gap-12"} ${compact ? "text-[10px]" : "text-xs"}`}>
          <Link className="transition hover:text-app-dourado-mel" href="#">
            Política de Privacidade
          </Link>
          <Link className="transition hover:text-app-dourado-mel" href="#">
            Termos de Uso
          </Link>
          <Link className="transition hover:text-app-dourado-mel" href="#">
            Contato
          </Link>
        </nav>

        <p className={compact ? "text-xs font-semibold" : "text-sm font-semibold"}>
          © 2026 APPONO. Todos os direitos reservados.
        </p>
      </div>
    </footer>);
}
