import Link from "next/link";
import Image from "next/image";

const heroImage =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80";
const foodImage =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80";
const restaurantImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

export default function Home() {
  return (
    <main className="min-h-screen bg-app-chantilly text-app-texto-escuro">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/60 bg-app-chantilly/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-app-cafe-profundo md:flex">
            <Link href="#inicio">Início</Link>
            <Link href="#reserva">Como usar</Link>
            <Link href="#sobre">Sobre</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/cadastro"
              className="hidden border border-app-caramelo-torrado px-4 py-2 text-sm font-semibold text-app-caramelo-torrado transition hover:bg-app-creme-suave sm:inline-flex"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="bg-app-dourado-mel px-4 py-2 text-sm font-semibold text-white transition hover:bg-app-caramelo-torrado"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <section
        id="inicio"
        className="relative flex min-h-[620px] items-center justify-center overflow-hidden bg-app-cafe-profundo px-5 py-20 text-white"
      >
        <Image
          src={heroImage}
          alt="Mesa reservada em restaurante elegante"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-app-cafe-profundo/55" />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <Image
            src="/brand/appono-logo.svg"
            alt="Appono"
            width={112}
            height={96}
            className="mb-10 h-24 w-28 brightness-0 invert"
          />
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">
            Reserve sua mesa com antecedência
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-app-creme-suave sm:text-lg">
            Planeje sua chegada, escolha seus pratos e ajude o restaurante a
            preparar uma experiência presencial mais rápida e organizada.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="bg-app-dourado-mel px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado"
            >
              Reservar agora
            </Link>
            <Link
              href="#reserva"
              className="bg-app-chantilly px-7 py-3 text-sm font-bold uppercase tracking-wide text-app-cafe-profundo transition hover:bg-app-creme-suave"
            >
              Saiba mais
            </Link>
          </div>
        </div>
      </section>

      <section id="reserva" className="bg-app-creme-leve py-8">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-[1fr_1.1fr_1fr]">
          <Image
            src={foodImage}
            alt="Pratos servidos em mesa"
            width={560}
            height={420}
            className="h-64 w-full object-cover md:h-80"
          />
          <div className="flex min-h-64 flex-col items-center justify-center bg-app-caramelo-torrado px-8 py-10 text-center text-white md:min-h-80">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-app-baunilha-dourada">
              Appono
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              A melhor experiência gastronômica.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-app-creme-suave">
              A reserva e o pedido caminham juntos para reduzir a espera e
              organizar o fluxo do restaurante.
            </p>
          </div>
          <Image
            src={foodImage}
            alt="Experiência gastronômica"
            width={560}
            height={420}
            className="h-64 w-full object-cover md:h-80"
          />
        </div>
      </section>

      <section className="bg-app-creme-suave py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-app-cafe-profundo">
              Por que usar o Appono?
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              Tudo foi pensado para conectar planejamento do cliente e operação
              do restaurante.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="bg-app-chantilly p-6 text-center shadow-sm">
              <h3 className="text-base font-semibold text-app-cafe-profundo">
                Reserva fácil
              </h3>
              <p className="mt-3 text-sm leading-6 text-app-mocha">
                Escolha restaurante, horário e quantidade de pessoas com poucos
                passos.
              </p>
            </article>
            <article className="bg-app-chantilly p-6 text-center shadow-sm">
              <h3 className="text-base font-semibold text-app-cafe-profundo">
                Menos espera
              </h3>
              <p className="mt-3 text-sm leading-6 text-app-mocha">
                Antecipe o pedido para que a cozinha se organize antes da sua
                chegada.
              </p>
            </article>
            <article className="bg-app-chantilly p-6 text-center shadow-sm">
              <h3 className="text-base font-semibold text-app-cafe-profundo">
                Fluxo inteligente
              </h3>
              <p className="mt-3 text-sm leading-6 text-app-mocha">
                O restaurante acompanha reservas, pedidos e capacidade em um só
                lugar.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="sobre" className="bg-app-chantilly py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-app-cafe-profundo">
              Quem somos nós?
            </h2>
            <p className="mt-5 text-base leading-8 text-app-mocha">
              A Appono nasceu para melhorar a relação entre clientes e
              restaurantes no consumo presencial. A proposta é transformar a
              reserva em uma experiência planejada, onde o cliente chega com
              menos espera e o restaurante trabalha com mais previsibilidade.
            </p>
          </div>
          <Image
            src={restaurantImage}
            alt="Ambiente interno de restaurante"
            width={640}
            height={420}
            className="h-80 w-full object-cover shadow-sm"
          />
        </div>
      </section>

      <footer className="border-t border-app-baunilha-dourada/70 bg-app-creme-leve py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/brand/appono-logo.svg"
              alt="Appono"
              width={80}
              height={64}
              className="h-16 w-20"
            />
            <p className="mt-4 max-w-xs text-sm leading-6 text-app-mocha">
              Reserve sua mesa, antecipe seu pedido e aproveite melhor o tempo
              dentro do restaurante.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-app-cafe-profundo">
              Appono
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-app-mocha">
              <Link href="#inicio">Início</Link>
              <Link href="#reserva">Como usar</Link>
              <Link href="#sobre">Sobre</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-app-cafe-profundo">
              Conta
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-app-mocha">
              <Link href="/login">Entrar</Link>
              <Link href="/cadastro">Criar conta</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-app-cafe-profundo">
              Contato
            </h3>
            <p className="mt-4 text-sm leading-6 text-app-mocha">
              contato@appono.com
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
