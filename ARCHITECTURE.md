# 📁 Estrutura do Projeto

## Diretórios e Arquivos

```
editorPlanta/
│
├── 📄 package.json              # Dependências e scripts npm
├── 📄 vite.config.js            # Configuração do Vite
├── 📄 index.html                # HTML principal (entry point)
│
├── 📄 README.md                 # Documentação completa
├── 📄 QUICKSTART.md             # Guia rápido de início
├── 📄 DEVELOPMENT.md            # Guia de desenvolvimento
├── 📄 ARCHITECTURE.md           # Este arquivo
│
├── 📄 .gitignore                # Arquivos ignorados pelo git
├── 📄 .env.example              # Exemplo de variáveis de ambiente
│
└── 📂 src/                      # Código-fonte da aplicação
    │
    ├── 📄 main.js              # Ponto de entrada da aplicação Vue
    ├── 📄 App.vue              # Componente raiz
    ├── 📄 style.css            # Estilos globais
    │
    ├── 📂 components/          # Componentes Vue reutilizáveis
    │   ├── PlantEditor.vue     # Componente principal (container)
    │   ├── PlantCanvas.vue     # Visualização SVG da planta
    │   └── RoomForm.vue        # Formulário para adicionar/editar cômodos
    │
    └── 📂 stores/              # Gerenciamento de estado (Pinia)
        └── plantStore.js       # Store principal da aplicação
```

## Componentes da Aplicação

### 🎯 App.vue
- **Responsabilidade**: Componente raiz da aplicação
- **Conteúdo**: Header e wrapper do PlantEditor
- **Estado**: Nenhum (apenas apresentação)

### 🏠 PlantEditor.vue
- **Responsabilidade**: Container principal com lógica de aplicação
- **Conteúdo**: 
  - Formulário de criação de lote
  - Sidebar com informações e lista de cômodos
  - Integração de componentes filhos
- **Estado**: selectedRoom (qual cômodo está sendo editado)

### 📋 RoomForm.vue
- **Responsabilidade**: Formulário para CRUD de cômodos
- **Props**: `selectedRoom` (cômodo selecionado para edição)
- **Emits**: 
  - `add-room` - evento para adicionar novo cômodo
  - `update-room` - evento para atualizar cômodo existente
- **Validações**: 
  - Verifica se cômodo fica dentro dos limites do lote
  - Valida todos os campos obrigatórios

### 🎨 PlantCanvas.vue
- **Responsabilidade**: Visualização interativa da planta
- **Recursos**:
  - Renderização SVG da planta
  - Drag & drop de cômodos
  - Grid de referência
  - Controles de zoom
  - Dimensões e áreas dos cômodos
- **Interações**: Clique e arraste para mover cômodos

## Store (Pinia)

### plantStore.js

**Estado:**
```javascript
lot: {              // Lote criado
  id,
  width,
  height,
  createdAt
}

rooms: [{           // Array de cômodos
  id,
  name,
  width,
  height,
  x,
  y,
  color
}]
```

**Ações:**
- `createLot(width, height)` - Cria um novo lote
- `addRoom(room)` - Adiciona um novo cômodo
- `updateRoom(id, updatedRoom)` - Atualiza um cômodo existente
- `deleteRoom(id)` - Deleta um cômodo
- `getRoomById(id)` - Obtém um cômodo pelo ID
- `resetProject()` - Limpa todo o projeto

**Computed:**
- `getTotalArea` - Calcula a área total ocupada pelos cômodos

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                      App.vue                            │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│                   PlantEditor.vue                       │
│  (Container com sidebar, form e canvas)                │
└─────┬──────────────────────────────────┬────────────────┘
      │                                  │
┌─────▼─────────────┐     ┌─────────────▼──────────┐
│  RoomForm.vue     │     │  PlantCanvas.vue       │
│  (Adiciona/edita) │     │  (Visualiza e arrasta) │
└─────┬─────────────┘     └─────────────┬──────────┘
      │                                  │
      │        ┌──────────────────────────┘
      │        │
      └────────▼──────────────────────────┐
               │                          │
        ┌──────▼──────────────────────────┘
        │
┌───────▼────────────────────────────────────────┐
│         plantStore (Pinia)                     │
│  - Gerencia lot e rooms                       │
│  - Valida limites                             │
│  - Calcula áreas                              │
└────────────────────────────────────────────────┘
```

## Ciclo de Vida de um Cômodo

1. **Criação**
   - Usuário preenche RoomForm
   - Clica "Adicionar Cômodo"
   - RoomForm emite `add-room`
   - PlantEditor chama `plantStore.addRoom()`
   - PlantCanvas renderiza o novo cômodo

2. **Visualização**
   - PlantCanvas renderiza com cor única
   - Exibe nome, área e dimensões
   - Permite arrasto

3. **Edição**
   - Usuário clica ✏️ na lista
   - PlantEditor define `selectedRoom`
   - RoomForm recebe via props e preenche campos
   - Usuário modifica valores
   - PlantEditor chama `plantStore.updateRoom()`
   - PlantCanvas atualiza renderização

4. **Exclusão**
   - Usuário clica 🗑️ na lista
   - Confirma exclusão
   - PlantEditor chama `plantStore.deleteRoom()`
   - Cômodo remove de `plantStore.rooms`
   - PlantCanvas remove da renderização

## Padrões de Código

### Composição API + Script Setup
Todos os componentes usam `<script setup>` para código mais limpo:
```vue
<script setup>
// Imports
import { ref, computed } from 'vue'
import { usePlantStore } from '../stores/plantStore'

// Props (sem necessidade de import)
const props = defineProps({ ... })

// Emits
const emit = defineEmits(['event-name'])

// Reactive state
const state = ref('')

// Computed properties
const computed = computed(() => { ... })

// Methods
const method = () => { ... }
</script>
```

### Nomeação
- Componentes: PascalCase (PlantEditor.vue)
- Props: camelCase (selectedRoom)
- Emits: kebab-case (add-room)
- Methods: camelCase (handleClick)
- Store actions: camelCase (createLot)

### Estilos
- Escopo: `<style scoped>` em todos componentes
- Variables: usar CSS puro, sem preprocessadores
- Classes: kebab-case (.room-item)
- Colors: Paleta em style.css

## Performance

- **SVG**: Otimizado para plantas de até 100 cômodos
- **Scale variable**: 40px por metro padrão (ajustável)
- **Reatividade**: Computed properties para cálculos
- **Rendering**: PlantCanvas usa renderização em tempo real

## Segurança

- **Input validation**: Todos os inputs validados
- **Boundary checks**: Cômodos não saem dos limites do lote
- **No API calls**: Dados armazenados localmente (por enquanto)

## Extensibilidade

Para adicionar novas funcionalidades:

1. **Novo tipo de elemento** → Novo componente em `src/components/`
2. **Novas ações** → Adicione à store `plantStore.js`
3. **Novo painel** → Adicione seção em `PlantEditor.vue`
4. **Novos estilos** → Atualize `src/style.css`

---

**Última atualização**: 2024
