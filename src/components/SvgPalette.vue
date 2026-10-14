<template>
  <div class="svg-palette">
    <h4>Imagens SVG</h4>
    <div v-if="items.length === 0" class="muted">Nenhuma imagem encontrada</div>
    <ul>
      <li v-for="(it, idx) in items" :key="idx" class="svg-item" draggable="true"
          @dragstart="onDragStart($event, it)" @click="place(it)">
        <div class="thumb">
          <img :src="it.path" :alt="it.name" />
        </div>
        <div class="meta">
          <div class="name">{{ it.name }}</div>
          <div class="scale">escala: {{ it.scale }} m</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

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
  // set a custom mime type and a text/plain fallback for browser compatibility
  try {
    ev.dataTransfer.setData('application/x-svg', payload)
    ev.dataTransfer.setData('text/plain', payload)
  } catch (e) {
    // some browsers may throw for unknown types; ensure text/plain at least
    ev.dataTransfer.setData('text/plain', payload)
  }
  ev.dataTransfer.effectAllowed = 'copy'

  // set drag image if possible
  const img = new Image()
  img.src = item.path
  img.width = 40
  img.height = 40
  if (ev.dataTransfer.setDragImage) {
    // slight try/catch to avoid cross-origin issues
    try { ev.dataTransfer.setDragImage(img, 20, 20) } catch (e) {}
  }
}

const place = (item) => {
  // emit for click-to-place
  const e = new CustomEvent('place-image', { detail: item })
  window.dispatchEvent(e)
}
</script>

<style scoped>
.svg-palette { font-size: 0.92rem }
ul { list-style: none; padding: 0; margin: 0; display:flex; flex-direction:column; gap:8px }
.svg-item { display:flex; gap:10px; padding:8px; border-radius:8px; background:#fff; cursor:pointer; align-items:center }
.thumb img { width:42px; height:42px; object-fit:contain }
.meta .name { font-weight:700 }
.meta .scale { color:#666; font-size:0.85em }
.muted { color:#777 }
</style>
