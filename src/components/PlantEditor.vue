<template>
  <div class="editor-container">
    <div v-if="!plantStore.lot" class="setup-section">
      <Card class="setup-card">
        <template #title>Criar um novo lote</template>
        <template #content>
          <form class="lot-form" @submit.prevent="handleCreateLot">
            <label class="field">
              <span>Largura (metros)</span>
              <InputNumber v-model="newLot.width" :min="1" :step="0.1" :minFractionDigits="1" :maxFractionDigits="2" required />
            </label>
            <label class="field">
              <span>Altura (metros)</span>
              <InputNumber v-model="newLot.height" :min="1" :step="0.1" :minFractionDigits="1" :maxFractionDigits="2" required />
            </label>
            <Button type="submit" title="Criar lote" aria-label="Criar lote" icon="pi pi-check" />
          </form>
        </template>
      </Card>
    </div>

    <div v-else class="editor-shell">
      <Toolbar class="top-toolbar">
        <template #start>
          <div class="brand-area">
            <Avatar label="PB" shape="square" />
            <div>
              <strong>Planta Baixa</strong>
              <small>Projeto sem título</small>
            </div>
          </div>
        </template>
        <template #end>
          <div class="top-actions">
            <Button
              type="button"
              :icon="isDarkTheme ? 'pi pi-moon' : 'pi pi-sun'"
              :title="isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'"
              :aria-label="isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'"
              :aria-pressed="isDarkTheme"
              severity="secondary"
              text
              @click="isDarkTheme = !isDarkTheme"
            />
            <Button type="button" title="Abrir projeto" aria-label="Abrir projeto" icon="pi pi-folder-open" severity="secondary" text @click="triggerFileImport" />
            <Button type="button" title="Novo projeto" aria-label="Novo projeto" icon="pi pi-file" severity="secondary" text @click="resetProject" />
            <Button type="button" title="Salvar" aria-label="Salvar" icon="pi pi-save" @click="saveProjectFile" />
          </div>
        </template>
      </Toolbar>

      <Splitter class="editor-body" :layout="isNarrowScreen ? 'vertical' : 'horizontal'">
        <SplitterPanel class="editor-splitter-panel" :size="10" :min-size="10">
          <Panel class="resources-panel" header="Recursos">
            <div class="resource-content">
              <div class="resource-actions" role="group" aria-label="Adicionar elementos">
                <Button type="button" title="Novo cômodo" aria-label="Novo cômodo" icon="pi pi-home" @click="openAddRoomModal()" />
                <Button type="button" title="Adicionar móvel" aria-label="Adicionar móvel" icon="pi pi-box" severity="secondary" outlined @click="openAddRoomModal('furniture')" />
                <Button type="button" title="Adicionar marcação" aria-label="Adicionar marcação" icon="pi pi-pencil" severity="secondary" outlined @click="openAddRoomModal('marking')" />
                <Button type="button" title="Adicionar janela" aria-label="Adicionar janela" icon="pi pi-window-maximize" severity="secondary" outlined @click="openOpeningModal('window')" />
                <Button type="button" title="Adicionar porta" aria-label="Adicionar porta" icon="pi pi-sign-in" severity="secondary" outlined @click="openOpeningModal('door')" />
              </div>

              <Divider />

              <div class="wall-color-controls" role="group" aria-label="Cores globais das paredes">
                <ColorPicker
                  title="Preenchimento global das paredes"
                  aria-label="Preenchimento global das paredes"
                  :model-value="plantStore.wallSettings.fillColor.slice(1)"
                  format="hex"
                  @update:model-value="updateWallColor('fillColor', $event)"
                />
                <ColorPicker
                  title="Cor global da borda das paredes"
                  aria-label="Cor global da borda das paredes"
                  :model-value="plantStore.wallSettings.strokeColor.slice(1)"
                  format="hex"
                  @update:model-value="updateWallColor('strokeColor', $event)"
                />
              </div>

              <Divider />
              <SvgPalette />
            </div>
          </Panel>
        </SplitterPanel>

        <SplitterPanel class="editor-splitter-panel workspace-splitter-panel" :size="80" :min-size="50">
          <Splitter class="workspace-splitter" :layout="isNarrowScreen ? 'vertical' : 'horizontal'">
            <SplitterPanel class="workspace-content-panel" :size="75" :min-size="44">
              <main class="workspace-panel">
                <section class="project-summary" aria-labelledby="project-summary-title">
                  <h3 id="project-summary-title">Resumo do projeto</h3>
                  <div><span>Área do terreno</span><strong>{{ (plantStore.lot.width * plantStore.lot.height).toFixed(2) }} m²</strong></div>
                  <div><span>Cômodos</span><strong>{{ plantStore.rooms.filter(item => item.type === 'room').length }}</strong></div>
                  <div><span>Área construída</span><strong>{{ plantStore.getTotalArea.toFixed(2) }} m²</strong></div>
                </section>
                <PlantCanvas
                  class="workspace-canvas"
                  :selected-room-id="selectedElement.type === 'room' ? selectedElement.id : null"
                  :selected-element-type="selectedElement.type"
                  :selected-opening-id="selectedOpening?.id"
                  @edit-room="selectRoomToEdit"
                  @select-element="selectElement"
                  @add-room="openAddRoomModal"
                  @add-furniture="openAddRoomModal('furniture')"
                  @add-marking="openAddRoomModal('marking')"
                />
              </main>
            </SplitterPanel>

            <SplitterPanel class="workspace-properties-panel" :size="25" :min-size="19">
              <Panel v-if="selectedOpening" class="opening-properties" :header="selectedOpening.type === 'door' ? 'Porta' : 'Janela'">
                <OpeningForm :opening="selectedOpening" />
                <Button type="button" title="Apagar abertura" aria-label="Apagar abertura" icon="pi pi-trash" severity="danger" text @click="deleteSelectedOpening" />
              </Panel>
              <PropertiesPanel
                v-else
                :key="propertiesRevision"
                :item="selectedItem"
                :is-object="selectedElement.type === 'room'"
                :can-move-forward="plantStore.canMoveObject(selectedItem.id, 1)"
                :can-move-backward="plantStore.canMoveObject(selectedItem.id, -1)"
                :openings="plantStore.openings.filter(opening => opening.roomId === selectedItem.id)"
                @add-opening="openOpeningModal"
                @select-opening="selectElement({ type: 'opening', id: $event })"
                @update="updateSelectedProperty"
                @reorder="plantStore.moveObject(selectedItem.id, $event)"
              />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
      </Splitter>

      <Dialog v-model:visible="isOpeningModalOpen" modal :header="`Adicionar ${newOpeningType === 'door' ? 'porta' : 'janela'}`" :closeButtonProps="{ title: 'Fechar', 'aria-label': 'Fechar' }">
        <OpeningForm
          :initial-type="newOpeningType"
          :initial-room-id="openingRoomId"
          @saved="openingSaved"
          @cancel="isOpeningModalOpen = false"
        />
      </Dialog>

      <Dialog v-model:visible="isRoomModalOpen" modal :header="selectedRoom ? 'Editar objeto' : 'Adicionar objeto'" :closeButtonProps="{ title: 'Fechar', 'aria-label': 'Fechar' }">
        <RoomForm
          :selectedRoom="selectedRoom"
          :initial-type="newObjectType"
          @add-room="handleAddRoom"
          @update-room="handleUpdateRoom"
          @cancel="closeRoomModal"
        />
      </Dialog>

      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden-file-input"
        @change="handleFileImport"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Avatar from 'primevue/avatar'
import Card from 'primevue/card'
import Button from 'primevue/button'
import ColorPicker from 'primevue/colorpicker'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import InputNumber from 'primevue/inputnumber'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { usePlantStore } from '../stores/plantStore'
import PlantCanvas from './PlantCanvas.vue'
import RoomForm from './RoomForm.vue'
import SvgPalette from './SvgPalette.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import OpeningForm from './OpeningForm.vue'

const plantStore = usePlantStore()
const newLot = ref({ width: null, height: null })
const selectedRoom = ref(null)
const newObjectType = ref('room')
const selectedElement = ref({ type: 'lot' })
const isRoomModalOpen = ref(false)
const fileInput = ref(null)
const propertiesRevision = ref(0)
const isOpeningModalOpen = ref(false)
const newOpeningType = ref('window')
const openingRoomId = ref(null)
const isDarkTheme = ref(false)
const isNarrowScreen = ref(false)
const selectedOpening = computed(() => selectedElement.value.type === 'opening'
  ? plantStore.openings.find(opening => opening.id === selectedElement.value.id)
  : null)

const updateViewportLayout = () => {
  isNarrowScreen.value = window.matchMedia('(max-width: 768px)').matches
}

const updateWallColor = (field, color) => {
  const normalizedColor = color.startsWith('#') ? color : `#${color}`
  plantStore.updateWallSettings({ [field]: normalizedColor })
}

const applyTheme = (enabled) => {
  document.documentElement.classList.toggle('app-dark', enabled)
}

onMounted(() => {
  updateViewportLayout()
  window.addEventListener('resize', updateViewportLayout)
  isDarkTheme.value = localStorage.getItem('plant-editor-theme') === 'dark'
  applyTheme(isDarkTheme.value)
})

watch(isDarkTheme, (enabled) => {
  applyTheme(enabled)
  localStorage.setItem('plant-editor-theme', enabled ? 'dark' : 'light')
})

const openOpeningModal = (type = 'window') => {
  const rooms = plantStore.rooms.filter(room => room.type === 'room')
  if (!rooms.length) {
    alert('Adicione um cômodo antes de inserir portas e janelas.')
    return
  }
  const selected = plantStore.getRoomById(selectedElement.value.id)
  openingRoomId.value = selected?.type === 'room' ? selected.id : rooms[0].id
  newOpeningType.value = type
  isOpeningModalOpen.value = true
}

const openingSaved = (id) => {
  selectedElement.value = { type: 'opening', id }
  isOpeningModalOpen.value = false
}

const deleteSelectedOpening = () => {
  if (!confirm('Tem certeza que deseja apagar esta abertura?')) return
  const roomId = selectedOpening.value.roomId
  plantStore.deleteOpening(selectedOpening.value.id)
  selectedElement.value = { type: 'room', id: roomId }
}

const selectedItem = computed(() => selectedElement.value.type === 'room'
  ? plantStore.getRoomById(selectedElement.value.id) || plantStore.lot
  : plantStore.lot)

const handlePlaceImage = (ev) => {
  const item = ev.detail
  if (!plantStore.lot) {
    alert('Crie um lote primeiro para inserir imagens.')
    return
  }
  const centerX = Math.max(0, (plantStore.lot.width / 2) - (item.scale / 2))
  const vb = { vbWidth: item.vbWidth || 1, vbHeight: item.vbHeight || 1 }
  const heightMeters = item.scale * (vb.vbHeight / vb.vbWidth)
  const centerY = Math.max(0, (plantStore.lot.height / 2) - (heightMeters / 2))
  plantStore.addPlacedImage({ path: item.path, name: item.name, scaleMeters: item.scale, x: centerX, y: centerY, vbWidth: vb.vbWidth, vbHeight: vb.vbHeight })
}

window.addEventListener('place-image', handlePlaceImage)
onBeforeUnmount(() => {
  window.removeEventListener('place-image', handlePlaceImage)
  window.removeEventListener('resize', updateViewportLayout)
})

const handleCreateLot = () => {
  if (newLot.value.width && newLot.value.height) {
    plantStore.createLot(newLot.value.width, newLot.value.height)
    newLot.value = { width: null, height: null }
  }
}

const handleAddRoom = (room) => {
  const addedRoom = plantStore.addRoom(room)
  selectedElement.value = { type: 'room', id: addedRoom.id }
  closeRoomModal()
}

const applyRoomUpdate = (id, changes) => {
  const removeOpenings = changes.type && changes.type !== 'room' &&
    plantStore.openings.some(opening => opening.roomId === id)
  if (removeOpenings && !confirm('Mudar o tipo deste cômodo irá apagar suas portas e janelas. Deseja continuar?')) {
    propertiesRevision.value++
    return false
  }
  try {
    plantStore.updateRoom(id, changes, { removeOpenings })
    return true
  } catch (error) {
    alert(error.message)
    propertiesRevision.value++
    return false
  }
}

const handleUpdateRoom = (updatedRoom) => {
  if (applyRoomUpdate(updatedRoom.id, updatedRoom)) closeRoomModal()
}

const selectRoomToEdit = (room) => {
  selectedRoom.value = room
  selectedElement.value = { type: 'room', id: room.id }
  isRoomModalOpen.value = true
}

const selectElement = (selection) => {
  selectedElement.value = ['room', 'opening'].includes(selection?.type)
    ? { type: selection.type, id: selection.id }
    : { type: 'lot' }
}

const updateSelectedProperty = ({ field, value }) => {
  const item = selectedItem.value
  if (!item) return

  if (field === 'width' || field === 'height') {
    if (selectedElement.value.type === 'lot' && value < 0.1) {
      alert('O terreno deve ter pelo menos 0,1 m nessa dimensão.')
      return
    }

    if (selectedElement.value.type === 'lot') {
      const roomLimits = plantStore.rooms.map(room => field === 'width'
        ? room.x + room.width
        : room.y + room.height)
      const imageLimits = plantStore.placedImages.map(image => field === 'width'
        ? image.x + image.scaleMeters
        : image.y + image.scaleMeters * (image.vbHeight / (image.vbWidth || 1)))
      const requiredSize = Math.max(0, ...roomLimits, ...imageLimits)
      if (value < requiredSize) {
        alert(`O terreno precisa ter pelo menos ${requiredSize.toFixed(2)} m para conter os elementos existentes.`)
        return
      }
      plantStore.updateLot({ [field]: value })
      return
    }

    if (value < 0.5) {
      alert('O objeto deve ter pelo menos 0,5 m nessa dimensão.')
      return
    }

    const maxSize = field === 'width'
      ? plantStore.lot.width - item.x
      : plantStore.lot.height - item.y
    if (value > maxSize) {
      alert(`A dimensão não pode ultrapassar o limite do terreno (${maxSize.toFixed(2)} m).`)
      return
    }
  }

  if (selectedElement.value.type === 'room') {
    applyRoomUpdate(item.id, { ...item, [field]: value })
  } else {
    plantStore.updateLot({ [field]: value })
  }
}

const openAddRoomModal = (type = 'room') => {
  selectedRoom.value = null
  newObjectType.value = type
  isRoomModalOpen.value = true
}

const closeRoomModal = () => {
  isRoomModalOpen.value = false
  selectedRoom.value = null
}

const resetProject = () => {
  if (confirm('Isto irá limpar todo o projeto. Deseja continuar?')) {
    plantStore.resetProject()
    selectedRoom.value = null
    selectedElement.value = { type: 'lot' }
  }
}

const saveProjectFile = () => {
  const fileContent = plantStore.exportProject()
  const blob = new Blob([fileContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `planta-baixa-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
  link.click()

  URL.revokeObjectURL(url)
}

const triggerFileImport = () => {
  fileInput.value?.click()
}

const handleFileImport = async (event) => {
  const [file] = event.target.files || []
  if (!file) return

  try {
    const fileContent = await file.text()
    const projectData = JSON.parse(fileContent)
    const loaded = plantStore.loadProjectFromData(projectData)

    if (!loaded) {
      alert('O arquivo selecionado não possui um projeto válido.')
      return
    }

    selectedRoom.value = null
    selectedElement.value = { type: 'lot' }
    isRoomModalOpen.value = false
  } catch (error) {
    console.error('Não foi possível importar o projeto.', error)
    alert(`Não foi possível carregar o arquivo. ${error instanceof Error ? error.message : 'Verifique se o projeto é válido.'}`)
  } finally {
    event.target.value = ''
  }
}
</script>

<style scoped>
.editor-container {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.setup-section {
  height: 100%;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.setup-card {
  width: min(420px, 100%);
}

.lot-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.editor-shell {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-toolbar {
  flex: 0 0 auto;
  border: 0;
  border-bottom: 1px solid var(--p-content-border-color);
  border-radius: 0;
  padding: 0.25rem 1rem;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.brand-area small {
  display: block;
  color: var(--p-text-muted-color);
}

.top-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.resource-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.editor-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.editor-splitter-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.workspace-splitter {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border: 0;
  border-radius: 0;
}

.workspace-content-panel,
.workspace-properties-panel {
  min-width: 0;
  min-height: 0;
}

.resources-panel,
.opening-properties {
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.resources-panel :deep(.p-panel-content-container),
.opening-properties :deep(.p-panel-content-container) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.resources-panel :deep(.p-panel-content),
.opening-properties :deep(.p-panel-content) {
  height: 100%;
  overflow-y: auto;
}

.resource-content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.8rem;
}

.wall-color-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.project-summary {
  position: absolute;
  top: 1.625rem;
  left: 1.5rem;
  z-index: 10;
  width: 10rem;
  max-width: calc(100% - 14rem);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: transparent;
  pointer-events: none;
  font-size: 0.75rem;
}

.project-summary h3 {
  font-size: 0.8125rem;
  font-weight: 600;
}

.project-summary div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  column-gap: 0.75rem;
}

.project-summary strong {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.workspace-panel {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0.75rem;
  overflow: hidden;
}

.workspace-canvas {
  display: block;
  height: 100%;
  min-height: 0;
}

.hidden-file-input {
  display: none;
}

@media (max-width: 768px) {
  .editor-container {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;
  }

  .editor-shell {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;
  }

  .editor-body {
    flex: none;
    min-height: 0;
    overflow: visible;
    flex-direction: column;
  }

  .editor-splitter-panel {
    flex: 0 0 auto !important;
    height: auto;
    overflow: visible;
  }

  .workspace-splitter {
    flex: none;
    flex-direction: column;
    overflow: visible;
  }

  .workspace-splitter :deep(.p-splitterpanel) {
    flex: 0 0 auto !important;
    height: auto;
    overflow: visible;
  }

  .workspace-content-panel,
  .workspace-properties-panel {
    flex: 0 0 auto !important;
  }

  .editor-body :deep(.p-splitter-gutter) {
    display: none;
  }

  .resources-panel,
  .opening-properties,
  :deep(.properties-panel) {
    height: auto;
    max-height: 360px;
  }

  .workspace-panel {
    flex: none;
    min-width: 0;
    height: 60vh;
    height: 60dvh;
    min-height: 300px;
    padding: 0.25rem;
  }

  .workspace-canvas {
    min-height: 0;
  }

  .project-summary {
    top: 1.125rem;
    left: 1rem;
    max-width: calc(100% - 13rem);
  }

  .top-toolbar {
    gap: 0.5rem;
  }
}
</style>
