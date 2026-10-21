# Melhorias de layout e propriedades

## Referências visuais

- `tela1.png`: referência para a organização geral da tela e para o painel de propriedades.
- `tela2.png`: referência para o menu de zoom e opções de visualização do canvas.

## Organização da tela

- Deixar a tela de edição mais limpa, com o canvas como área central de trabalho.
- Manter a navegação de recursos à esquerda, o canvas ao centro e o painel contextual de propriedades à direita, conforme `tela1.png`.
- Manter a barra de ferramentas de desenho na parte inferior do canvas, como na referência.
- Exibir no topo os controles do projeto e o zoom atual do canvas.

## Zoom e visualização do canvas

- O percentual exibido no topo (por exemplo, 100%) representa o zoom do canvas.
- Ao clicar no percentual, abrir um menu semelhante ao de `tela2.png`, com opções para:
  - aumentar e diminuir o zoom;
  - ajustar o canvas à área visível;
  - definir zoom de 50%, 100% ou 200%;
  - ajustar o zoom à seleção;
  - alternar visualização de pixels em 1x ou 2x;
  - mostrar/ocultar grade de pixels, encaixe na grade, grades de layout, réguas e contornos.
- Exibir os atalhos de teclado junto às opções, seguindo a referência visual.
- Permitir alterar o zoom girando a roda de scroll do mouse sobre o canvas.
- Permitir mover a visualização do canvas nos eixos X e Y segurando o botão central do mouse e arrastando.

## Painel contextual de propriedades

- O painel à direita deve mostrar as propriedades do elemento selecionado.
- Quando nenhum cômodo estiver selecionado, mostrar as propriedades do terreno.
- Ao selecionar um cômodo (room), trocar o conteúdo do painel para as propriedades desse cômodo.
- Os campos de propriedades devem ser editáveis e refletir as alterações no elemento selecionado.
- Organizar as propriedades em seções visuais, seguindo a referência: layout/dimensões, aparência, preenchimento e traço.
- Para esta mudança, não incluir edição de posição ou rotação; limitar os campos às propriedades descritas neste documento.

### Dimensões e escala

- Permitir consultar e editar as dimensões do terreno e dos cômodos em unidades reais (metros/centímetros).
- Para cada cômodo, apresentar largura e comprimento, como os campos W e H da referência.
- Usar a conversão de escala que já existe no software. Não criar uma nova configuração ou método de calibração de escala.

### Aparência, preenchimento e traço

- Permitir editar a cor do preenchimento e a opacidade do terreno e dos cômodos.
- Permitir editar a cor e a espessura do traço.
- Permitir controlar a espessura de cada aresta separadamente.
- Ao separar as espessuras, manter a cor e o estilo do traço iguais em todas as arestas.

## Decisões confirmadas

- As dimensões são exibidas/editadas em unidades reais e usam a conversão já existente no software.
- A configuração individual por aresta se aplica somente à espessura; cor e estilo são compartilhados.
- Posição e rotação não fazem parte dos campos editáveis desta mudança.
- A aparência editável inclui cor do preenchimento e opacidade.
- As dimensões editáveis de cada cômodo são largura e comprimento; a área não é um campo de edição solicitado.
