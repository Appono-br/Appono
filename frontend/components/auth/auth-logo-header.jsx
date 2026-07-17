import Image from "next/image";
import Link from "next/link";
export function AuthLogoHeader({ compact = false }) {
    return (<header className="border-b border-app-baunilha-dourada bg-app-creme-suave">
      <div className={`mx-auto flex max-w-7xl items-center justify-center px-6 ${compact ? "py-2" : "py-4"}`}>
        <Link href="/" className="group">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={compact ? 92 : 132} height={compact ? 92 : 132} className={`transition duration-300 group-hover:scale-105 ${compact ? "h-9 w-9" : "h-28 w-28"}`} priority/>
        </Link>
      </div>
    </header>);
}
