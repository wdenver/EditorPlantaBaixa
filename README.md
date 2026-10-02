# 🏠 Editor de Plantas de Casa

Um aplicativo web interativo desenvolvido com Vue.js 3 para criar e organizar plantas baixas de residências, permitindo adicionar, editar e visualizar cômodos com suas dimensões e áreas.

## 🎯 Funcionalidades

- **Criar Lotes**: Defina as dimensões iniciais da planta (largura e altura)
- **Adicionar Cômodos**: Crie cômodos com nome, dimensões e posição
- **Editar Cômodos**: Modifique as propriedades dos cômodos já criados
- **Arrastar Cômodos**: Mova os cômodos diretamente no canvas
- **Visualização em Tempo Real**: Veja a planta atualizada conforme você trabalha
- **Paleta de Cores**: Cada cômodo possui uma cor única para melhor visualização
- **Cálculo de Áreas**: Visualize automaticamente a área total e de cada cômodo
- **Controles de Zoom**: Amplie ou diminua a visualização da planta

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

1. Criar o lote
- Use o formulário lateral de "Lote" para definir largura e altura (metros) e clique em "Criar Lote".

2. Adicionar um cômodo
- No formulário "Adicionar Cômodo" informe:
  - Nome
  - Largura (m)
  - Altura (m)
  - Posição X (m) — posição horizontal dentro do lote
  - Posição Y (m) — posição vertical dentro do lote
  - Cor
- Clique em "Adicionar Cômodo"; o cômodo aparece imediatamente no canvas.

3. Editar um cômodo
- Duplo-clique no cômodo no canvas ou use o ícone ✏️ na lista lateral para abrir o editor.
- Altere os valores e confirme para aplicar as mudanças.

4. Mover e redimensionar
- Clique e arraste um cômodo no canvas para reposicioná‑lo.
- Arraste as alças brancas nas bordas para redimensionar (mínimo 0.5 m).
- As posições/dimensões respeitam os limites do lote e atualizam em tempo real.

5. Menu de contexto
- Clique com o botão direito sobre um cômodo para abrir o menu de contexto com as opções: Duplicar, Editar, Inverter altura × largura e Apagar.

6. Comportamento e validações importantes
- Cômodos não podem ultrapassar os limites do lote.
- Tamanho mínimo por dimensão: 0.5 m.
- Snapping: ao mover/redimensionar, cômodos encostam automaticamente em bordas de outros cômodos quando próximos.
- A área de cada cômodo é calculada e exibida sobre o retângulo no canvas.

7. Zoom e visualização
- Use os botões de zoom (🔍+ / 🔍-) e "Resetar" para ajustar a escala.
- O nível de zoom é exibido em percentagem.

Observação: todas as alterações são aplicadas ao estado local da aplicação (sem backend por padrão) e são refletidas imediatamente na visualização do canvas.

## 📊 Interface

### Painel Lateral (Esquerda)
- Informações do lote (dimensões, área total)
- Lista de todos os cômodos
- Ações rápidas (editar, deletar)

### Área Principal (Centro)
- Formulário para adicionar/editar cômodos
- Dicas de uso
- Cálculo automático de área

### Canvas (Direita)
- Visualização da planta
- Grid de referência
- Cômodos com cores únicas
- Controles de zoom

## 🎨 Estrutura do Projeto

```
editorPlanta/
├── src/
│   ├── components/
│   │   ├── PlantEditor.vue      # Componente principal
│   │   ├── RoomForm.vue          # Formulário de cômodos
│   │   └── PlantCanvas.vue       # Visualização SVG
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
- Todos os campos são obrigatórios
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
