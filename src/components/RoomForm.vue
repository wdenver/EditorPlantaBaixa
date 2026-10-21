<template>
  <div class="room-form-container">
    <h2>{{ isEditing ? 'Editar objeto' : 'Adicionar objeto' }}</h2>
    
    <form @submit.prevent="handleSubmit" class="room-form">
      <div class="form-group">
        <label for="object-type">Tipo:</label>
        <select id="object-type" v-model="form.type" @change="applyTypeDefaults">
          <option v-for="option in OBJECT_TYPES" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="room-name">Nome{{ form.type === 'marking' ? ' (opcional)' : '' }}:</label>
        <input
          id="room-name"
          v-model="form.name"
          type="text"
          placeholder="Ex: Sala de Estar"
          :required="form.type !== 'marking'"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="room-width">Largura (m):</label>
          <input
            id="room-width"
            v-model="form.width"
            type="number"
            placeholder="Ex: 5"
            min="0.1"
            step="0.01"
            required
          />
        </div>
        <div class="form-group">
          <label for="room-height">Altura (m):</label>
          <input
            id="room-height"
            v-model="form.height"
            type="number"
            placeholder="Ex: 4"
            min="0.1"
            step="0.01"
            required
          />
        </div>
      </div>
      <div v-if="form.type === 'room'" class="form-row">
        <div class="form-group">
          <label for="room-include-in-built-area">Incluir na Área Construída:</label>
          <input
            id="room-include-in-built-area"
            v-model="form.includeInBuiltArea"
            type="checkbox"
          />
        </div>
      </div>

      <!-- <div class="form-row">
        <div class="form-group">
          <label for="room-x">Posição X (m):</label>
          <input
            id="room-x"
            v-model="form.x"
            type="number"
            placeholder="Ex: 0"
            min="0"
            step="0.1"
            required
          />
        </div>
        <div class="form-group">
          <label for="room-y">Posição Y (m):</label>
          <input
            id="room-y"
            v-model="form.y"
            type="number"
            placeholder="Ex: 0"
            min="0"
            step="0.1"
            required
          />
        </div>
      </div> -->

      <div class="form-group">
        <label for="room-color">Cor:</label>
        <div class="color-picker">
          <input
            id="room-color"
            v-model="form.color"
            type="color"
          />
          <span class="color-name">{{ form.color }}</span>
        </div>
      </div>

      <div class="form-group">
        <label>Bordas a desenhar:</label>
        <div class="wall-selector" role="group" aria-label="Selecionar bordas do objeto">
          <button
            type="button"
            class="wall-toggle wall-toggle-top"
            :class="{ 'wall-toggle-active': form.walls.top }"
            @click="toggleWall('top')"
            :aria-pressed="form.walls.top"
            title="Parede superior"
          >
            Superior
          </button>
          <button
            type="button"
            class="wall-toggle wall-toggle-right"
            :class="{ 'wall-toggle-active': form.walls.right }"
            @click="toggleWall('right')"
            :aria-pressed="form.walls.right"
            title="Parede direita"
          >
            Direita
          </button>
          <button
            type="button"
            class="wall-toggle wall-toggle-bottom"
            :class="{ 'wall-toggle-active': form.walls.bottom }"
            @click="toggleWall('bottom')"
            :aria-pressed="form.walls.bottom"
            title="Parede inferior"
          >
            Inferior
          </button>
          <button
            type="button"
            class="wall-toggle wall-toggle-left"
            :class="{ 'wall-toggle-active': form.walls.left }"
            @click="toggleWall('left')"
            :aria-pressed="form.walls.left"
            title="Parede esquerda"
          >
            Esquerda
          </button>
          <div class="wall-selector-center">
            Clique nas bordas
          </div>
        </div>
      </div>

      <div v-if="form.type === 'room'" class="area-info">
        <strong>Área: {{ (parseFloat(form.width) * parseFloat(form.height)).toFixed(2) }} m²</strong>
      </div>

      <div class="error-message" v-if="error">
        ⚠️ {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" :class="isEditing ? 'btn-warning' : 'btn-primary'">
          {{ isEditing ? '💾 Atualizar objeto' : '✅ Adicionar objeto' }}
        </button>
        <button
          v-if="isEditing"
          type="button"
          class="btn-secondary"
          @click="cancelEdit"
        >
          ❌ Cancelar
        </button>
      </div>
    </form>

    <div class="tips">
      <h4>💡 Dicas:</h4>
      <ul>
        <li>As caixas não podem sair dos limites do lote</li>
        <li>A aparência pode ser editada no painel de propriedades</li>
        <li>Você pode arrastar as caixas no canvas para reposicioná-las</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import { usePlantStore } from '../stores/plantStore'
import { OBJECT_TYPES, getObjectDefaults } from '../objectTypes'

const createDefaultWalls = () => ({
  top: true,
  right: true,
  bottom: true,
  left: true
})

const normalizeWalls = (walls) => ({
  ...createDefaultWalls(),
  ...(walls || {})
})

const props = defineProps({
  initialType: {
    type: String,
    default: 'room'
  },
  selectedRoom: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['add-room', 'update-room', 'cancel'])

const plantStore = usePlantStore()
const form = ref({
  ...getObjectDefaults(props.initialType),
  name: '',
  width: '',
  height: '',
  x: '',
  y: '',
  includeInBuiltArea: true,
  walls: createDefaultWalls()
})

const error = ref('')

const isEditing = computed(() => !!props.selectedRoom)

watch(() => props.selectedRoom, (newRoom) => {
  if (newRoom) {
    form.value = {
      ...newRoom,
      walls: normalizeWalls(newRoom.walls)
    }
  } else {
    resetForm()
  }
}, { deep: true, immediate: true })

const handleSubmit = () => {
  error.value = ''

  const width = parseFloat(form.value.width)
  const height = parseFloat(form.value.height)
  const x = Number(form.value.x)
  const y = Number(form.value.y)

  if (![width, height, x, y].every(Number.isFinite) || width < 0.1 || height < 0.1 || x < 0 || y < 0) {
    error.value = 'Informe dimensões de pelo menos 0,1 m e posições válidas dentro do lote.'
    return
  }

  // Validação de limites
  if (x + width > plantStore.lot.width) {
    error.value = `A largura do objeto excede o limite do lote (máximo: ${plantStore.lot.width - x}m)`
    return
  }

  if (y + height > plantStore.lot.height) {
    error.value = `A altura do objeto excede o limite do lote (máximo: ${plantStore.lot.height - y}m)`
    return
  }

  const payload = {
    ...form.value,
    walls: normalizeWalls(form.value.walls)
  }

  if (isEditing.value) {
    emit('update-room', payload)
  } else {
    emit('add-room', payload)
  }

  resetForm()
}

const cancelEdit = () => {
  resetForm()
  emit('cancel')
}

const toggleWall = (side) => {
  form.value.walls[side] = !form.value.walls[side]
}

const applyTypeDefaults = () => {
  if (!isEditing.value) Object.assign(form.value, getObjectDefaults(form.value.type))
}

function resetForm() {
  form.value = {
    ...getObjectDefaults(props.initialType),
    name: '',
    width: '',
    height: '',
    includeInBuiltArea: true,
    x: 0,
    y: 0,
    walls: createDefaultWalls()
  }
  error.value = ''
}
</script>

<style scoped>
.room-form-container {
  padding: 25px;
  background: white;
  border-radius: 8px;
}

h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.room-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker input[type="color"] {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
}

.color-name {
  font-family: monospace;
  font-size: 0.9em;
  color: #666;
  background: #f5f5f5;
  padding: 6px 10px;
  border-radius: 4px;
  flex: 1;
}

.wall-selector {
  position: relative;
  width: 220px;
  height: 220px;
  border: 1px dashed #c8c8c8;
  border-radius: 10px;
  margin: 0 auto;
  background: #fafafa;
}

.wall-toggle {
  position: absolute;
  border: 2px solid #d0d0d0;
  background: #f1f1f1;
  color: #666;
  font-weight: 600;
  font-size: 0.82em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wall-toggle:hover {
  border-color: #667eea;
}

.wall-toggle-active {
  background: #dfffe4;
  border-color: #4CAF50;
  color: #2e7d32;
}

.wall-toggle-top,
.wall-toggle-bottom {
  left: 50%;
  width: 130px;
  height: 34px;
  transform: translateX(-50%);
}

.wall-toggle-left,
.wall-toggle-right {
  top: 50%;
  width: 34px;
  height: 130px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: translateY(-50%);
}

.wall-toggle-top {
  top: 10px;
}

.wall-toggle-right {
  right: 10px;
}

.wall-toggle-bottom {
  bottom: 10px;
}

.wall-toggle-left {
  left: 10px;
}

.wall-selector-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #888;
  font-size: 0.85em;
  text-align: center;
  pointer-events: none;
}

.area-info {
  background: #f0f7ff;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #667eea;
  color: #333;
}

.error-message {
  background: #ffe0e0;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #f44336;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.form-actions button {
  flex: 1;
  padding: 12px;
  font-size: 1em;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-warning {
  background-color: #ff9800;
  color: white;
}

.btn-warning:hover {
  background-color: #e68900;
}

.btn-secondary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary:hover {
  background-color: #0b7dda;
}

.tips {
  margin-top: 20px;
  padding: 15px;
  background: #fffacd;
  border-radius: 6px;
  border-left: 4px solid #ff9800;
}

.tips h4 {
  color: #ff9800;
  margin: 0 0 10px 0;
  font-size: 1em;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.tips li {
  margin: 5px 0;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
