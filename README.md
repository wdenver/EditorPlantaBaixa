# 🏠 Editor de Plantas de Casa

Um aplicativo web interativo desenvolvido com Vue.js 3 para criar e organizar plantas baixas de residências, permitindo adicionar, editar e visualizar cômodos com suas dimensões e áreas.

## 🎯 Funcionalidades

- **Criar Lotes**: Defina as dimensões iniciais da planta (largura e altura)
- **Adicionar Cômodos**: Crie cômodos com nome, dimensões e posição
- **Móveis e marcações**: Adicione objetos retangulares com `type` igual a `room` (cômodo), `furniture` (móvel) ou `marking` (marcação). Marcações têm nome opcional e preenchimento inicialmente transparente; móveis começam em cinza, com bordas de 1 px.
- **Ordem de desenho**: Cômodos ficam abaixo dos móveis, e marcações acima dos móveis. “Enviar para frente” e “Enviar para trás” movem uma posição por clique dentro do mesmo tipo.
- **Editar Cômodos**: Modifique as propriedades dos cômodos já criados
- **Arrastar Cômodos**: Mova os cômodos diretamente no canvas
- **Visualização em Tempo Real**: Veja a planta atualizada conforme você trabalha
- **Paleta de Cores**: Cada cômodo possui uma cor única para melhor visualização
- **Cálculo de Áreas**: Apenas cômodos exibem área no desenho e podem entrar no total de área construída, conforme a opção “Incluir na área construída”.
- **Painel de propriedades contextual**: Edite dimensões reais, preenchimento, opacidade e traço do terreno ou do cômodo selecionado
- **Zoom e navegação**: Use o menu de zoom, a roda do mouse e o arraste com o botão central
- **Paredes físicas**: Retângulos centralizados nas arestas dos cômodos, com espessura inicial de 15 cm, editável por lado e proporcional ao zoom. Cantos e trechos compartilhados são unidos visualmente, sem linhas internas.
- **Cores globais das paredes**: Preenchimento cinza (`#808080`) e borda escura (`#222222`), configuráveis para todo o projeto. O contorno fino permanece com 1 px na tela.
- **Espessura por aresta**: Cômodos usam centímetros; terreno, móveis e marcações mantêm seus traços em pixels.

## 🛠️ Tecnologias Utilizadas

- **Vue.js 3** - Framework JavaScript progressivo
- **Vite** - Build tool rápido e moderno
- **Pinia** - Gerenciamento de estado
- **SVG** - Gráficos vetoriais para a visualização da planta

## 📋 Requisitos

- Node.js 16+ 
- npm ou yarn

## 🚀 Como Instalar

```bash
# 1. Navegue até o diretório do projeto
cd /home/denver/projects/editorPlanta

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Abra seu navegador em http://localhost:5173
```

## 💻 Como Usar

1. Criar o terreno
- Defina a largura e o comprimento em metros no formulário inicial.
- O terreno pode ser selecionado no canvas para editar dimensões e aparência pelo painel à direita.

2. Adicionar um cômodo
- Use "Novo cômodo" ou a barra de ferramentas inferior e informe o nome e as dimensões em metros.
- Selecione o cômodo no canvas para editar dimensões, preenchimento, opacidade e espessura das arestas.

3. Editar um cômodo
- Clique no cômodo para exibir suas propriedades no painel à direita.
- O duplo-clique mantém disponível o formulário completo do cômodo.
- Use “Adicionar móvel” ou “Adicionar marcação” nos recursos ou na barra inferior para criar os demais objetos. Todos podem ser arrastados, redimensionados, duplicados e editados pelo mesmo formulário.
- No painel à direita, edite tipo, nome, preenchimento e opacidade. Em cômodos, ajuste a espessura de cada parede em centímetros; para terreno, móveis e marcações, edite a cor e a espessura dos traços em pixels. As cores das paredes são definidas em **Paredes — configurações globais**, nos recursos à esquerda.
- As espessuras físicas das paredes e os traços em pixels são armazenados separadamente e preservados ao trocar o tipo de um objeto.

4. Mover e redimensionar
- Clique e arraste um cômodo no canvas para reposicioná‑lo.
- Arraste as alças brancas nas bordas para redimensionar (mínimo 0.5 m).
- As posições/dimensões respeitam os limites do lote e atualizam em tempo real.

5. Menu de contexto
- Clique com o botão direito sobre um objeto para duplicar, editar, inverter dimensões, enviar para frente/trás ou apagar. A ordem também pode ser alterada no painel de propriedades.

6. Comportamento e validações importantes
- Cômodos não podem ultrapassar os limites do lote.
- Tamanho mínimo por dimensão: 0.5 m.
- No menu **Encaixe e grid**, ao lado do zoom, habilite ou desabilite individualmente os snaps no grid, nas arestas de outros objetos e nas guias verticais/horizontais.
- Marque **Desabilitar todos os snaps** para mover e redimensionar livremente, mantendo os limites do lote. Ao desmarcar, as opções individuais anteriores voltam a valer.
- Móveis encaixam nas faces internas e externas das paredes dos cômodos, considerando a espessura por lado e a maior espessura nos trechos compartilhados. Lados desativados ou com espessura zero não geram snap. Entre móveis e marcações, o encaixe continua nas arestas dos objetos.
- Ajuste **Espaçamento do grid (m)** para mudar a distância entre as linhas (padrão: 1 m; mínimo e incremento: 0,01 m). O mesmo espaçamento é usado no snap ao mover e redimensionar cômodos, móveis e marcações.
- **Mostrar grid** controla apenas a visibilidade: é possível ocultar a grade mantendo o snap, ou exibi-la com o snap desligado.
- Ao mover ou redimensionar, arestas de cômodos e guias próximas alinham o elemento; o grid é usado quando não há outro alvo de snap próximo.
- A área de cada cômodo é calculada e exibida sobre o retângulo no canvas.

7. Zoom e visualização
- Clique no percentual no topo do canvas para abrir as opções de zoom, ajuste à área visível ou à seleção e opções de grade/réguas/contornos.
- A roda do mouse sobre o canvas aproxima ou afasta a visualização; arraste com o botão central para mover o canvas.
- O percentual representa o zoom em relação à escala base, sem alterar as dimensões reais armazenadas em metros.

Observação: todas as alterações são aplicadas ao estado local da aplicação (sem backend por padrão) e são refletidas imediatamente na visualização do canvas.

O tipo, a aparência e a ordem são preservados ao salvar, reabrir ou recarregar o projeto. A coleção JSON `rooms` foi mantida por compatibilidade e agora contém os três tipos de objeto; objetos antigos sem `type` são tratados como cômodos. Imagens da paleta continuam na camada de imagens existente.

### Paredes e compatibilidade

- A posição, a largura e o comprimento continuam representando os eixos das paredes: metade da espessura fica para cada lado da aresta. O cálculo de área e o snap de cômodos e marcações não mudam; móveis encaixam nas faces físicas das paredes.
- Trechos com eixos coincidentes são unidos, inclusive em coincidências parciais. No trecho compartilhado prevalece a maior espessura, sem modificar os valores individuais dos cômodos. Paredes apenas próximas não são encaixadas automaticamente.
- A divisa continua visível se pelo menos um dos cômodos tiver a parede ativada. Para abrir a divisa, desative a parede dos dois lados. Espessura zero também desativa o respectivo trecho.
- Todas as paredes são desenhadas acima dos preenchimentos dos cômodos, mas abaixo de móveis e marcações. A opção **Contornos** também controla a exibição das paredes.
- Projetos antigos recebem paredes de 15 cm em todos os lados, preservando os lados desativados. Terreno, móveis e marcações não são alterados.
- O JSON passa a usar `version: 2`, com `wallSettings` para as cores globais e `wallThicknesses` por objeto (valores em metros). Essas configurações também são persistidas no armazenamento local. Projetos novos voltam às cores padrão.

## 📊 Interface

### Painel Lateral (Esquerda)
- Recursos visuais e imagens SVG
- Ação para criar cômodos e resumo de áreas do projeto

### Área Principal (Centro)
- Canvas central com barra de ferramentas inferior
- Navegação por zoom e pan, grades, guias e réguas

### Painel de Propriedades (Direita)
- Dimensões reais do terreno ou cômodo selecionado
- Cor e opacidade do preenchimento
- Espessura física de cada parede dos cômodos; cor do traço e espessura em pixels nos demais objetos

## 🎨 Estrutura do Projeto

```
editorPlanta/
├── src/
│   ├── components/
│   │   ├── PlantEditor.vue      # Componente principal
│   │   ├── RoomForm.vue          # Formulário de cômodos
│   │   ├── PlantCanvas.vue       # Visualização SVG
│   │   └── PropertiesPanel.vue   # Propriedades contextuais do terreno/cômodo
│   ├── stores/
│   │   └── plantStore.js         # Gerenciamento de estado
│   ├── App.vue                   # Componente raiz
│   ├── main.js                   # Entrada da aplicação
│   └── style.css                 # Estilos globais
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 🚨 Validações

- Os cômodos não podem exceder os limites do lote
- Dimensões mínimas de 0.5m para cômodos
- O nome é obrigatório para cômodos e móveis, mas opcional para marcações
- Cada cômodo tem uma cor aleatória (pode ser customizada)

## 🔄 Build para Produção

```bash
npm run build
```

Os arquivos estáticos estarão em `dist/`

## 📝 Exemplo de Uso

1. Crie um lote de 10m × 15m
2. Adicione uma "Sala de Estar" de 5m × 4m na posição (0, 0)
3. Adicione um "Quarto" de 4m × 3.5m na posição (5, 0)
4. Adicione uma "Cozinha" de 3m × 3m na posição (0, 4)
5. Visualize a planta montada no canvas
6. Ajuste as posições arrastando os cômodos se necessário

## 💡 Dicas

- Use nomes descritivos para os cômodos (Sala de Estar, Quarto Principal, etc)
- Organize os cômodos de forma lógica na planta
- O grid no canvas ajuda a alinhar os cômodos
- Use cores diferentes para facilitar a visualização

## 📄 Licença

Este projeto é fornecido como está para fins educacionais e de uso pessoal.

## 👨‍💻 Desenvolvimento

Para continuar desenvolvendo:

```bash
npm run dev     # Modo desenvolvimento
npm run build   # Build para produção
npm run preview # Preview do build
```

---

Criado com ❤️ usando Vue.js
