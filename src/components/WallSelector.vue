<template>
  <svg
    class="wall-selector"
    viewBox="0 0 200 200"
    role="group"
    aria-label="Bordas a desenhar"
  >
    <rect class="room-floor" x="31" y="31" width="138" height="138" />
    <text class="room-hint" x="100" y="96" text-anchor="middle" aria-hidden="true">
      <tspan x="100">Clique nas paredes</tspan>
      <tspan x="100" dy="15">para mostrar/esconder</tspan>
    </text>
    <g
      v-for="wall in walls"
      :key="wall.key"
      class="wall-control"
      role="button"
      tabindex="0"
      :aria-label="wall.label"
      :aria-pressed="modelValue[wall.key]"
      @click="toggleWall(wall.key)"
      @keydown.enter.prevent="toggleWall(wall.key)"
      @keydown.space.prevent="toggleWall(wall.key)"
    >
      <title>{{ wall.label }}</title>
      <polygon
        v-if="modelValue[wall.key]"
        class="room-wall"
        :points="wall.points"
      />
      <line v-else class="wall-guide" v-bind="wall.guide" />
      <polygon class="wall-hit-area" :points="wall.hitArea" />
    </g>
  </svg>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const walls = [
  {
    key: 'top',
    label: 'Borda superior',
    points: '24,24 176,24 162,38 38,38',
    hitArea: '4,4 196,4 148,52 52,52',
    guide: { x1: 31, y1: 31, x2: 169, y2: 31 }
  },
  {
    key: 'right',
    label: 'Borda direita',
    points: '176,24 176,176 162,162 162,38',
    hitArea: '196,4 196,196 148,148 148,52',
    guide: { x1: 169, y1: 31, x2: 169, y2: 169 }
  },
  {
    key: 'bottom',
    label: 'Borda inferior',
    points: '176,176 24,176 38,162 162,162',
    hitArea: '196,196 4,196 52,148 148,148',
    guide: { x1: 169, y1: 169, x2: 31, y2: 169 }
  },
  {
    key: 'left',
    label: 'Borda esquerda',
    points: '24,176 24,24 38,38 38,162',
    hitArea: '4,196 4,4 52,52 52,148',
    guide: { x1: 31, y1: 169, x2: 31, y2: 31 }
  }
]

const toggleWall = (side) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [side]: !props.modelValue[side]
  })
}
</script>

<style scoped>
.wall-selector {
  display: block;
  width: 200px;
  max-width: 100%;
  align-self: center;
}

.room-floor {
  fill: var(--p-content-hover-background);
}

.room-wall {
  fill: var(--p-text-color);
  stroke: var(--p-content-background);
  stroke-width: 1;
}

.wall-guide {
  stroke: var(--p-text-muted-color);
  stroke-width: 1;
  stroke-dasharray: 4 5;
}

.room-hint {
  fill: var(--p-text-muted-color);
  font-size: 10px;
  pointer-events: none;
}

.wall-control {
  cursor: pointer;
  outline: none;
}

.wall-hit-area {
  fill: transparent;
  stroke: transparent;
  stroke-width: 2;
  pointer-events: all;
}

.wall-control:hover .room-wall {
  fill: var(--p-primary-color);
}

.wall-control:hover .wall-guide {
  stroke: var(--p-primary-color);
  stroke-width: 2;
}

.wall-control:focus-visible .wall-hit-area {
  stroke: var(--p-primary-color);
}
</style>
