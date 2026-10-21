# ⚡ Quick Start

## Instalação

```bash
npm install
npm run dev
```

Abra no navegador o endereço informado pelo Vite (normalmente
`http://localhost:5173`).

## Criar uma planta

1. Informe largura e altura do lote em metros e clique em **Criar Lote**.
2. Clique em **Novo cômodo** no painel **Recursos** ou em **＋ Cômodo** na
   barra inferior. Preencha nome, dimensões e posição e confirme.
3. Selecione o cômodo para editar suas dimensões, aparência e paredes no painel
   **Propriedades** à direita. Também é possível arrastar o objeto no canvas e
   redimensioná-lo pelas alças nas bordas.
4. Use **＋ Adicionar móvel** ou **＋ Adicionar marcação** para inserir outros
   objetos. A paleta **Imagens SVG** permite inserir as imagens disponíveis por
   clique ou arrastando-as para a planta.
5. Clique em **Exportar SVG** na barra inferior para baixar uma imagem vetorial
   da planta. Use **Salvar** no topo para baixar o projeto editável em JSON.

## Controles rápidos

| Ação | Como fazer |
|---|---|
| Selecionar ou mover | Clique no objeto; arraste para mover |
| Redimensionar | Arraste uma das alças brancas nas bordas do objeto |
| Editar pelo formulário | Dê duplo clique no objeto |
| Abrir ações do objeto | Clique com o botão direito no objeto |
| Aproximar ou afastar | Role a roda do mouse sobre o canvas |
| Mover a visualização | Arraste com o botão central do mouse |
| Ajustar zoom | Clique no percentual no topo do canvas |
| Ajustar à área visível | Use **⛶** na barra inferior ou **Zoom para caber** no menu de zoom |
| Configurar grade e encaixe | Abra **Encaixe e grid** ao lado do zoom |
| Adicionar e editar guias | Clique em **⌖ Guias** na barra inferior |
| Importar projeto | Clique em **Abrir projeto** e selecione um arquivo JSON salvo |
| Começar outro projeto | Clique em **Novo projeto** |

### Atalhos de teclado

Os atalhos de visualização funcionam quando o foco não está em um campo de
edição.

| Atalho | Ação |
|---|---|
| `Ctrl`/`⌘` + `+` | Aumentar zoom |
| `Ctrl`/`⌘` + `-` | Diminuir zoom |
| `Shift` + `1` | Ajustar canvas à área visível |
| `Shift` + `0` | Zoom em 100% |
| `Shift` + `2` | Zoom na seleção |
| `Shift` + `G` | Mostrar ou ocultar o grid |
| `Shift` + `R` | Mostrar ou ocultar as réguas |
| `Shift` + `'` | Mostrar ou ocultar a grade de pixels |
| `Ctrl` + `Shift` + `'` | Alternar snap no grid |

## Dicas

- O menu **Encaixe e grid** permite configurar o espaçamento do grid e ativar
  encaixes em grid, objetos e guias separadamente.
- Para mover ou redimensionar sem encaixes, marque **Desabilitar todos os
  snaps**. Os limites do lote continuam valendo.
- O painel **Paredes — configurações globais** controla as cores das paredes dos
  cômodos. A espessura de cada lado é configurada nas propriedades do cômodo.
- No painel de propriedades, marque **Incluir na área construída** para
  controlar quais cômodos entram no total do projeto.
- **Enviar para frente** e **Enviar para trás** mudam a ordem de desenho entre
  objetos do mesmo tipo.

## Build para produção

```bash
npm run build
```

Os arquivos de produção são gerados em `dist/`.

Para mais detalhes, consulte o [README.md](README.md).
