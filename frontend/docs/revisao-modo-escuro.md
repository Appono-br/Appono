# Revisão visual do modo escuro

## Causas corrigidas

- 80 regras antigas de tema escuro distribuídas entre home, cliente e restaurante competiam entre si.
- Sobrescritas de cores claras com `!important` alcançavam o modo escuro.
- Variáveis como `--app-cafe-profundo` eram usadas para texto e fundo, clareando superfícies e o gradiente fotográfico.
- A preferência de tema era aplicada somente a alguns contêineres. Login, cadastro, carregamento e elementos fora deles não herdavam o tema.
- Textos de botões e ícones nem sempre acompanhavam a mudança de fundo no hover.
- Cabeçalhos com altura fixa e opções longas em modais podiam ultrapassar seus limites.

## Organização

`app/tema-escuro.css` centraliza a paleta e os estados escuros, sem novos `!important`. Os nomes de cores existentes continuam compatíveis, mas os usos como fundo, texto e preenchimento de ações recebem tratamentos separados.

`app/globals.css` conserva as cores anteriores sob seletores exclusivos do modo claro, além das regras compartilhadas de layout. As regras escuras antigas foram removidas.

`components/configuracoes/tema-aplicacao.jsx` aplica o tema em `html[data-tema]`, usando a preferência existente `appono:theme`. O script de inicialização em `app/layout.jsx` aplica a preferência antes da pintura; o componente sincroniza alterações posteriores. Não foi criada uma segunda preferência.

A home ganhou gradiente fotográfico independente do tema e um cabeçalho com navegação recolhida até haver espaço. Os diálogos permitem crescimento e rolagem vertical; fotografias não recebem filtros. Somente os arquivos da marca recebem tratamento no tema escuro.

## Paleta

| Finalidade | Variável | Cor |
| --- | --- | --- |
| Página | --ui-fundo | #0B0B0B |
| Header | --ui-header | #241713 |
| Card | --ui-superficie | #171311 |
| Modal/campo | --ui-superficie-elevada | #211914 |
| Superfície de destaque | --ui-superficie-destaque | #36241D |
| Texto principal | --ui-texto | #F5EBDD |
| Texto secundário | --ui-texto-secundario | #C9B8A8 |
| Borda decorativa | --ui-borda | #594638 |
| Borda de controle | --ui-borda-controle | #9D8069 |
| Destaque | --ui-acento | #E0A174 |
| Ação preenchida | --ui-acento-fundo | #CF8150 |
| Hover claro | --ui-hover | #EADCC8 |
| Texto sobre fundo claro | --ui-texto-inverso | #241713 |

As bordas dos campos são mais claras que as decorativas para identificar os controles. Erro, sucesso e alerta conservam cores distintas. Ações destrutivas permanecem vermelhas no hover.

## Verificação executada

- Lint do frontend e build completo do Next.js: aprovados.
- Busca de marcadores Git no frontend: nenhum encontrado.
- Sintaxe das folhas de estilo validada durante a compilação.
- Teste local da lógica de tema: claro → escuro → claro, valor persistido, leitura posterior e fallback quando localStorage está bloqueado.
- Somente arquivos do frontend alterados. Sem commit, push ou deploy.

Contraste calculado a partir das cores opacas, sem representar uma auditoria de todos os elementos renderizados:

| Par | Contraste |
| --- | --- |
| Texto principal / página | 16,69:1 |
| Texto principal / header | 14,76:1 |
| Texto secundário / card elevado | 8,98:1 |
| Texto / hover bege | 12,90:1 |
| Texto / ação caramelo | 5,72:1 |
| Borda de campo / campo | 4,72:1 |
| Texto de erro / fundo de erro | 7,41:1 |
| Texto de sucesso / fundo de sucesso | 6,85:1 |
| Texto / botão destrutivo | 5,86:1 |

## Validação visual pendente

O navegador integrado retornou indisponível e não havia navegadores conectados. Não foram produzidas screenshots nem realizados testes de clique, foco, autofill, console ou layout renderizado. A compilação não substitui esses testes.

Conferir manualmente, em português e inglês, a 320, 375, 768, 1024 e 1440 px:

1. Home: alternância de tema, imagem principal, header, FAQ, escolha de perfil e footer.
2. Login, cadastros e recuperação: campos, senha, Google, autofill, validação e diálogos.
3. Cliente: dashboard, favoritos, reserva, pedido, chat, configurações e pagamento.
4. Restaurante: dashboard, cardápio, cozinha, histórico, chat e configurações.
5. Administração: financeiro, notificações e reembolsos.
6. Em cada área: hover, foco via Tab, seleção, estados desabilitados, carregamento e mensagens.
7. Recarregar em modo escuro, navegar entre páginas e voltar ao claro, verificando persistência, ausência de flashes, estouro horizontal e regressões visuais.

Não se afirma cobertura visual completa dos módulos ou compatibilidade de widgets externos com base apenas nessas verificações locais.
