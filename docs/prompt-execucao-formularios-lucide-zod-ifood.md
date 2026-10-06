# Prompt Mestre de Execução: Formulários Profissionais, Validações Zod, Lucide Icons e Design System iFood

Você é um Engenheiro de Software Sênior especialista em React 19, Next.js 16, UI/UX de alto nível e arquitetura de formulários corporativos. Sua missão é implementar uma modernização abrangente no frontend do **Appono**, aplicando os seguintes pilares essenciais:

1. **React Hook Form + Zod**: Substituição de estados avulsos por formulários performáticos, controlados e tipados com schemas declarativos Zod.
2. **Validação Rigorosa de Campos Obrigatórios**: Mensagens de erro amigáveis e contextuais, validações reais (CPF e CNPJ com algoritmos de verificação, CEP com autopreenchimento, telefone e política de senha).
3. **Paginação Profissional de Formulários (Multi-Step / Wizard)**: Fluxo estruturado em etapas com Stepper visual, barra de progresso suave, validação condicional por etapa antes do avanço e retenção de estado.
4. **Substituição Integral por Lucide Icons (`lucide-react`)**: Remoção completa de SVGs inline e caracteres de texto/emoji na interface, unificando o design com a biblioteca Lucide.
5. **Experiência e Identidade Inspirada no iFood**: Componentes táteis, inputs com estados claros de foco/erro/sucesso, feedback em tempo real e visual limpo focado na conversão e usabilidade.

---

## 1. Instalação de Dependências

No diretório `frontend`, instale as bibliotecas necessárias:
```powershell
npm install react-hook-form zod @hookform/resolvers lucide-react --workspace frontend
```

---

## 2. Design System Inspirado no iFood

Implemente um ecossistema de componentes consistentes com os padrões visuais do iFood:

### 2.1. Anatomia dos Campos (Inputs, Selects e Textareas)
- **Label**: Tipografia nítida, peso semibold (`text-xs font-semibold text-slate-700`).
- **Obrigatoriedade**: Indicação explícita com asterisco vermelho estilizado (`<span className="text-red-500 ml-1" aria-hidden="true">*</span>`).
- **Container do Input**: Altura ergonômica (`h-12`), bordas arredondadas modernas (`rounded-xl`), fundo branco ou levemente off-white.
- **Ícone Contextual**: Ícone da Lucide à esquerda (`leftIcon`) ou controle de visualização à direita (`rightAction`, como o botão com `Eye`/`EyeOff`).
- **Estados de Foco**: Destaque suave com ring sutil (`focus:ring-2 focus:ring-red-500/15 focus:border-red-500`).
- **Feedback de Erro**:
  - Borda avermelhada (`border-red-500 bg-red-50/20`).
  - Mensagem explicativa abaixo do campo com ícone `AlertCircle` (`text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1.5`).
  - Atributos acessíveis: `aria-invalid="true"` e `role="alert"`.

### 2.2. Stepper e Navegação Multi-Etapas (Wizard)
- **Cabeçalho de Progresso**:
  - Título da etapa atual com subtítulo descritivo ("Passo 2 de 4: Endereço do Restaurante").
  - Barra de progresso contínua com preenchimento percentual animado.
  - Indicadores de etapas circulares: número da etapa ativa, ícone `Check` para etapas concluídas e estilo neutro para etapas pendentes.
- **Barra de Ações (Footer)**:
  - Botão **"Voltar"** com ícone `ArrowLeft` (desabilitado ou oculto na primeira etapa).
  - Botão **"Continuar"** com ícone `ArrowRight`, disparando a validação específica da etapa (`await trigger(camposDaEtapa)`).
  - Botão **"Finalizar Cadastro"** na última etapa com feedback de carregamento (`Loader2` animado).

---

## 3. Schemas de Validação Zod (`frontend/lib/schemas/`)

Crie uma arquitetura modular de validações:

### 3.1. Validadores Base (`frontend/lib/schemas/validacoes-base.js`)
- `validarCpf(cpf)`: Algoritmo oficial de validação de dígitos verificadores (módulo 11), rejeitando sequências idênticas (ex: `111.111.111-11`).
- `validarCnpj(cnpj)`: Algoritmo de validação dos 14 dígitos e cálculos verificadores de CNPJ.
- `validarTelefone(telefone)`: Validação de telefones fixos e celulares brasileiros com DDD (10 ou 11 dígitos numéricos).
- `validarCep(cep)`: 8 dígitos numéricos.

### 3.2. Schemas Declarativos
1. **Cadastro de Cliente (`registerClientSchema`)**:
   - **Etapa 1 (Identificação)**:
     - `name`: `z.string().min(3, "Informe seu nome completo.")`
     - `cpf`: `z.string().refine(validarCpf, "Informe um CPF válido.")`
     - `birthDate`: `z.string().min(10, "Informe sua data de nascimento.")`
   - **Etapa 2 (Contato & Senha)**:
     - `email`: `z.string().email("Informe um e-mail válido.")`
     - `phone`: `z.string().refine(validarTelefone, "Informe um telefone celular com DDD.")`
     - `password`: `z.string().min(6, "A senha deve ter no mínimo 6 caracteres.").refine(senhaValida, "A senha deve conter maiúscula, minúscula, número e caractere especial.")`
     - `confirmPassword`: validação com `.refine((data) => data.password === data.confirmPassword, { message: "As senhas não coincidem.", path: ["confirmPassword"] })`

2. **Cadastro de Restaurante (`registerRestaurantSchema`)**:
   - **Etapa 1 (Dados do Estabelecimento)**:
     - `storeName`: `z.string().min(2, "Nome fantasia é obrigatório.")`
     - `legalName`: `z.string().min(2, "Razão social é obrigatória.")`
     - `cnpj`: `z.string().refine(validarCnpj, "Informe um CNPJ válido.")`
     - `email`: `z.string().email("Informe um e-mail comercial válido.")`
     - `phone`: `z.string().refine(validarTelefone, "Informe um telefone comercial com DDD.")`
   - **Etapa 2 (Endereço)**:
     - `cep`: `z.string().min(8, "Informe um CEP válido.")`
     - `address`: `z.string().min(3, "Logradouro é obrigatório.")`
     - `number`: `z.string().min(1, "Número é obrigatório.")`
     - `neighborhood`: `z.string().min(2, "Bairro é obrigatório.")`
     - `city`: `z.string().min(2, "Cidade é obrigatória.")`
     - `uf`: `z.string().length(2, "Selecione o estado (UF).")`
     - `complement`: `z.string().optional()`
   - **Etapa 3 (Operação e Capacidade)**:
     - `tables`: `z.coerce.number().min(1, "O restaurante deve ter ao menos 1 mesa.")`
     - `categorias_culinarias`: `z.array(z.string()).min(1, "Selecione pelo menos uma categoria culinária.")`
   - **Etapa 4 (Plano e Acesso)**:
     - `plano`: `z.enum(["INICIAL", "PRO", "ENTERPRISE"])`
     - `password` e `confirmPassword` (obrigatórios se não for fluxo Google).

3. **Login (`loginSchema`)**:
   - `email`: `z.string().email("E-mail inválido.")`
   - `password`: `z.string().min(1, "Informe sua senha.")`

4. **Configurações do Restaurante & Rotina**:
   - Schemas modulares para Endereço, Operação, Notificações, Dados Bancários e Preferências da Rotina.

---

## 4. Paginação dos Formulários e Fluxo Multi-Step

Reestruture os formulários chave para o formato multi-step:

1. **`RegisterRestaurantForm`**:
   - Etapa 1: Dados Gerais e Contato
   - Etapa 2: Endereço e Localização
   - Etapa 3: Capacidade Operacional e Categorias
   - Etapa 4: Escolha do Plano e Credenciais
2. **`RegisterClientForm`**:
   - Etapa 1: Dados Pessoais (Nome, CPF, Data de Nascimento)
   - Etapa 2: Contato e Segurança (E-mail, Telefone, Senha)
3. **`RotinaConfigurarForm`**:
   - Etapa 1: Dietas e Alergias
   - Etapa 2: Endereço de Entrega/Referência
   - Etapa 3: Janelas de Refeição
   - Etapa 4: Orçamento e Integrações

Cada etapa deve validar estritamente seus campos via `trigger(stepFields)` antes de permitir que o usuário avance, garantindo feedback imediato e evitando submissões frustrantes.

---

## 5. Mapeamento e Migração Integral para Lucide Icons

Substitua todos os ícones manuais e SVGs inline pelo catálogo da Lucide:

| Módulo | Elemento / Ícone Atual | Substituição Lucide |
| :--- | :--- | :--- |
| **Navegação & Sidebar Restaurante** | SVGs com path inline | `LayoutDashboard`, `UtensilsCrossed`, `BarChart3`, `Megaphone`, `CreditCard`, `Receipt`, `CalendarDays`, `ChefHat`, `History`, `MessageSquare`, `Headphones`, `Settings`, `LogOut`, `X` |
| **Header do Cliente** | SVGs manuais (carrinho, perfil, sino) | `ShoppingBag`, `Settings`, `Heart`, `MessageSquare`, `Bell`, `Menu`, `X` |
| **Campos de Formulário** | Inputs sem ícones auxiliares | `Mail`, `Lock`, `Eye`, `EyeOff`, `User`, `Phone`, `Building2`, `MapPin`, `Calendar`, `Hash`, `ShieldCheck` |
| **Indicadores & Feedback** | Caracteres de erro e sucesso | `CheckCircle2`, `AlertCircle`, `Info`, `XCircle`, `Loader2` |
| **Stepper & Navegação** | Caracteres de seta / texto | `ArrowLeft`, `ArrowRight`, `ChevronRight`, `ChevronLeft`, `Check` |
| **Avaliação de Pedidos** | Caracteres `★` | `Star` (com controle de preenchimento `fill-amber-400 text-amber-400`) |
| **Ações & Operação** | Ícones de botões | `Search`, `SlidersHorizontal`, `Plus`, `Trash2`, `Edit3`, `Save`, `RefreshCw` |

---

## 6. Criação de Componentes UI Reutilizáveis

Construa no diretório `frontend/components/ui/` os blocos reutilizáveis:
- `FormInput.jsx`: Input integrado ao `react-hook-form` com label, indicador obrigatório, suporte a máscaras e feedback de erro acessível.
- `FormSelect.jsx`: Select padronizado com mensagens de validação.
- `FormStepper.jsx`: Componente de stepper horizontal com indicação de progresso, percentual e etapas numeradas.
- `FormStepActions.jsx`: Barra de botões com navegação "Voltar" / "Continuar" / "Finalizar" e spinners de loading.

---

## 7. Fases de Execução e Verificação

1. **Fase 1: Infraestrutura de Formulários e Schemas**
   - Instalar dependências no workspace `frontend`.
   - Criar `lib/schemas/` com validadores e schemas Zod.
   - Criar os componentes base de formulário em `components/ui/`.
2. **Fase 2: Fluxos de Autenticação e Cadastro**
   - Refatorar `RegisterRestaurantForm` com wizard de 4 passos.
   - Refatorar `RegisterClientForm` com wizard de 2 passos.
   - Refatorar `LoginForm`, `RecuperarSenha` e `CompletarPerfil`.
3. **Fase 3: Substituição de Ícones Globais**
   - Migrar `RestauranteSidebar` e `ClienteHeader` para `lucide-react`.
   - Atualizar botões de voltar, fechar modais e diálogos de confirmação.
4. **Fase 4: Formulários Operacionais e Cliente**
   - Migrar formulários de configurações do restaurante (`Endereco`, `Operacao`, `DadosBancarios`, etc.).
   - Migrar formulário de avaliação (`Star` de Lucide + Zod) e formulário da Rotina.
5. **Fase 5: Verificação e Validação**
   - Executar `npm run lint --workspace frontend` para assegurar conformidade.
   - Executar `npm run build --workspace frontend` para garantir ausência de erros em tempo de compilação.
   - Testar o comportamento responsivo e os fluxos em desktop e mobile.
