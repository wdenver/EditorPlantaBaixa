<template>
  <div class="svg-palette">

    <h5>Imagens SVG</h5>
    <Message v-if="items.length === 0" severity="secondary" size="small">Nenhuma imagem encontrada</Message>
    <ul v-else>
      <li
        v-for="(it, idx) in items"
        :key="idx"
        class="svg-item"
        draggable="true"
        @dragstart="onDragStart($event, it)"
      >
        <img :src="it.path" :alt="it.name" />
        <div class="meta">
          <strong>{{ it.name }}</strong>
          <small>escala: {{ it.scale }} m</small>
        </div>
        <Button type="button" icon="pi pi-plus" :title="`Adicionar ${it.name}`" :aria-label="`Adicionar ${it.name}`" rounded text @click="place(it)" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Panel from 'primevue/panel'

const items = ref([])

const loadIndex = async () => {
  try {
    const res = await fetch('/svgs/images.txt')
    if (!res.ok) return
    const text = await res.text()
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    items.value = lines.map(line => {
      const [path, name, scale] = line.split('|')
      return { path: path?.trim() || '', name: (name || '').trim(), scale: parseFloat(scale) || 1 }
    })
  } catch (e) {
    // ignore
  }
}

onMounted(loadIndex)

const onDragStart = (ev, item) => {
  const payload = JSON.stringify({ path: item.path, name: item.name, scaleMeters: item.scale })
  try {
    ev.dataTransfer.setData('application/x-svg', payload)
    ev.dataTransfer.setData('text/plain', payload)
  } catch (e) {
    ev.dataTransfer.setData('text/plain', payload)
  }
  ev.dataTransfer.effectAllowed = 'copy'

  const img = new Image()
  img.src = item.path
  img.width = 40
  img.height = 40
  if (ev.dataTransfer.setDragImage) {
    try { ev.dataTransfer.setDragImage(img, 20, 20) } catch (e) {}
  }
}

const place = (item) => {
  const e = new CustomEvent('place-image', { detail: item })
  window.dispatchEvent(e)
}
</script>

<style scoped>
.svg-palette {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.svg-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-border-radius-md);
}

.svg-item img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
</style>
