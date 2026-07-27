import Link from "next/link";

export function BotaoVoltar({ href, children = "Voltar", className = "" }) {
    return (
        <Link href={href} className={`inline-flex w-fit items-center gap-2 ${className}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                    d="M15 6 9 12l6 6M10 12h10"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.9"
                />
            </svg>
            <span>{children}</span>
        </Link>
    );
}
