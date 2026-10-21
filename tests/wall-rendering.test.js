import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { compileScript, parse } from '@vue/compiler-sfc'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia, setActivePinia } from 'pinia'
import { usePlantStore } from '../src/stores/plantStore.js'

const componentUrl = new URL('../src/components/PlantCanvas.vue', import.meta.url)
const { descriptor } = parse(await readFile(componentUrl, 'utf8'))
const script = compileScript(descriptor, { id: 'wall-rendering-test', inlineTemplate: true }).content.replace(
  /from ['"]([^'"]+)['"]/g,
  (_, specifier) => `from '${specifier.startsWith('.')
    ? new URL(specifier.endsWith('.js') ? specifier : `${specifier}.js`, componentUrl).href
    : import.meta.resolve(specifier)}'`
)
const { default: Canvas } = await import(`data:text/javascript;base64,${Buffer.from(script).toString('base64')}`)

test('canvas renders room fills and controls before furniture, with labels above the drawing', async (t) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = usePlantStore()
  store.createLot(20, 20)
  store.addRoom({ id: 1, name: 'Sala', x: 1, y: 1, width: 4, height: 3, color: '#ffffff' })
  store.addRoom({ id: 2, name: 'Sofa', type: 'furniture', x: 2, y: 2, width: 1, height: 1 })
  store.addRoom({ id: 3, type: 'marking', x: 2, y: 2, width: 1, height: 1 })
  store.updateWallSettings({ fillColor: '#123456', strokeColor: '#abcdef' })
  globalThis.window = { addEventListener() {}, removeEventListener() {} }
  t.after(() => { delete globalThis.window })
  const html = await renderToString(createSSRApp(Canvas, { selectedRoomId: 1 }).use(pinia))
  const fillIndex = html.indexOf('class="room-fills"')
  const wallsIndex = html.indexOf('class="room-walls"')
  const objectsIndex = html.indexOf('class="rooms"')
  assert.ok(fillIndex < wallsIndex && wallsIndex < objectsIndex)
  const wallHtml = html.slice(wallsIndex, objectsIndex)
  assert.equal((wallHtml.match(/<rect /g) || []).length, 8)
  assert.match(wallHtml, /stroke="#abcdef" stroke-width="2" fill="none"/)
  assert.match(wallHtml, /fill="#123456"/)
  assert.match(wallHtml, /height="5.7"/)
  const objectsHtml = html.slice(objectsIndex, html.indexOf('class="placed-images"'))
  assert.equal((objectsHtml.match(/class="room-wall"/g) || []).length, 8)
  assert.match(objectsHtml, /fill="transparent"/)
  assert.match(objectsHtml, /class="resize-handle/)
  const imagesIndex = html.indexOf('class="placed-images"')
  const labelsIndex = html.indexOf('class="room-labels"')
  const labelsHtml = html.slice(labelsIndex, html.indexOf('class="dimensions"'))
  assert.ok(objectsIndex < imagesIndex && imagesIndex < labelsIndex)
  assert.ok(labelsHtml.indexOf('Sala') < labelsHtml.indexOf('Sofa'))
  assert.match(labelsHtml, /12\.0 m²/)
  assert.match(labelsHtml, /4\.0 × 3\.0 m/)
  assert.match(labelsHtml, /1\.0 × 1\.0 m/)
  assert.match(descriptor.template.content, /v-model="showRoomNames"[\s\S]*?Nomes dos cômodos/)
  assert.match(descriptor.template.content, /v-model="showRoomAreas"[\s\S]*?Áreas/)
  assert.match(descriptor.template.content, /v-model="showRoomDimensions"[\s\S]*?Dimensões/)
  assert.match(descriptor.template.content, /v-if="showRoomNames \|\| showRoomAreas \|\| showRoomDimensions"/)
})
