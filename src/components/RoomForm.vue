<template>
  <div class="room-form-container">
    <h2>{{ isEditing ? '✏️ Editar Cômodo' : '➕ Adicionar Novo Cômodo' }}</h2>
    
    <form @submit.prevent="handleSubmit" class="room-form">
      <div class="form-group">
        <label for="room-name">Nome do Cômodo:</label>
        <input
          id="room-name"
          v-model="form.name"
          type="text"
          placeholder="Ex: Sala de Estar"
          required
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
            min="0.5"
            step="0.1"
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
            min="0.5"
            step="0.1"
            required
          />
        </div>
      </div>
      <div class="form-row">
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

      <div class="area-info">
        <strong>Área: {{ (parseFloat(form.width) * parseFloat(form.height)).toFixed(2) }} m²</strong>
      </div>

      <div class="error-message" v-if="error">
        ⚠️ {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" :class="isEditing ? 'btn-warning' : 'btn-primary'">
          {{ isEditing ? '💾 Atualizar Cômodo' : '✅ Adicionar Cômodo' }}
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
        <li>Cada cômodo é representado por uma cor única</li>
        <li>Você pode arrastar as caixas no canvas para reposicioná-las</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import { usePlantStore } from '../stores/plantStore'

const props = defineProps({
  selectedRoom: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['add-room', 'update-room', 'cancel'])

const plantStore = usePlantStore()
const form = ref({
  name: '',
  width: '',
  height: '',
  x: '',
  y: '',
  includeInBuiltArea: true,
  color: '#FFFFFF' 
})

const error = ref('')

const isEditing = computed(() => !!props.selectedRoom)

watch(() => props.selectedRoom, (newRoom) => {
  if (newRoom) {
    form.value = { ...newRoom }
  } else {
    resetForm()
  }
}, { deep: true, immediate: true })

const handleSubmit = () => {
  error.value = ''

  const width = parseFloat(form.value.width)
  const height = parseFloat(form.value.height)
  const x = parseFloat(form.value.x)
  const y = parseFloat(form.value.y)

  // Validação de limites
  if (x + width > plantStore.lot.width) {
    error.value = `A largura do cômodo excede o limite do lote (máximo: ${plantStore.lot.width - x}m)`
    return
  }

  if (y + height > plantStore.lot.height) {
    error.value = `A altura do cômodo excede o limite do lote (máximo: ${plantStore.lot.height - y}m)`
    return
  }

  if (isEditing.value) {
    emit('update-room', form.value)
  } else {
    emit('add-room', { ...form.value })
  }

  resetForm()
}

const cancelEdit = () => {
  resetForm()
  emit('cancel')
}

function resetForm() {
  form.value = {
    name: '',
    width: '',
    height: '',
    includeInBuiltArea: true,
    x: 0,
    y: 0,
    color: '#ffffff'
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

.form-group input {
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
