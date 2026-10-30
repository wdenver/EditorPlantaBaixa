<template>
  <form class="opening-form" @submit.prevent="save">
    <label>
      Tipo
      <select v-model="form.type">
        <option value="window">Janela</option>
        <option value="door">Porta</option>
      </select>
    </label>
    <label>
      Cômodo
      <select v-model="form.roomId" required @change="chooseSide">
        <option disabled :value="null">Selecione um cômodo</option>
        <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
      </select>
    </label>
    <label>
      Parede
      <select v-model="form.side">
        <option v-for="side in OPENING_SIDES" :key="side.value" :value="side.value" :disabled="!hasWall(side.value)">
          {{ side.label }}
        </option>
      </select>
    </label>
    <label>
      Largura (m)
      <input v-model="form.width" type="number" min="0.01" step="0.01" required />
    </label>
    <label>
      Distância ao início da parede (m)
      <input v-model="form.offset" type="number" min="0" step="0.01" required />
    </label>
    <p class="opening-hint">Medida da esquerda nos lados horizontais e do topo nos lados verticais. A espessura acompanha a parede.</p>
    <template v-if="form.type === 'door'">
      <label>
        Dobradiça
        <select v-model="form.hinge">
          <option value="start">No início (esquerda / topo)</option>
          <option value="end">No fim (direita / base)</option>
        </select>
      </label>
      <label>
        Abertura da porta
        <select v-model="form.swing">
          <option value="inside">Para dentro do cômodo</option>
          <option value="outside">Para fora do cômodo</option>
        </select>
      </label>
    </template>
    <p v-if="error" class="opening-error" role="alert">{{ error }}</p>
    <div class="opening-actions">
      <button type="submit" class="btn-primary">{{ opening ? 'Aplicar alterações' : 'Inserir abertura' }}</button>
      <button v-if="!opening" type="button" class="btn-secondary" @click="emit('cancel')">Cancelar</button>
    </div>
  </form>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { usePlantStore } from '../stores/plantStore'
import { OPENING_SIDES } from '../openings'
import { DEFAULT_WALL_THICKNESS } from '../walls'

const props = defineProps({
  opening: { type: Object, default: null },
  initialRoomId: { type: [Number, String], default: null },
  initialType: { type: String, default: 'window' }
})
const emit = defineEmits(['saved', 'cancel'])
const store = usePlantStore()
const rooms = computed(() => store.rooms.filter(room => room.type === 'room'))
const form = ref({})
const error = ref('')
const selectedRoom = computed(() => rooms.value.find(room => room.id === form.value.roomId))
const hasWall = side => selectedRoom.value && selectedRoom.value.walls[side] !== false &&
  (selectedRoom.value.wallThicknesses[side] ?? DEFAULT_WALL_THICKNESS) > 0
const chooseSide = () => {
  form.value.side = OPENING_SIDES.find(side => hasWall(side.value))?.value ?? 'top'
}

watch(() => [props.opening, props.initialRoomId, props.initialType], () => {
  form.value = {
    type: props.initialType,
    roomId: props.initialRoomId ?? rooms.value[0]?.id ?? null,
    side: 'top', width: 0.8, offset: 0, hinge: 'start', swing: 'inside',
    ...props.opening
  }
  if (!props.opening) chooseSide()
  error.value = ''
}, { immediate: true })

const save = () => {
  error.value = ''
  try {
    if (props.opening) {
      store.updateOpening(props.opening.id, form.value)
      emit('saved', props.opening.id)
    } else {
      const added = store.addOpening(form.value)
      emit('saved', added.id)
    }
  } catch (cause) {
    error.value = cause.message
  }
}
</script>

<style scoped>
.opening-form, .opening-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.opening-form { gap: 16px; }
.opening-form input, .opening-form select {
  width: 100%;
  padding: 8px;
  border: 1px solid #d9dde2;
  border-radius: 5px;
}
.opening-hint { color: #646a73; font-size: 12px; }
.opening-error { color: #b91c1c; }
.opening-actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
