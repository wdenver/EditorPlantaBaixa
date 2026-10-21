<template>
  <div class="editor-container">
    <div v-if="!plantStore.lot" class="setup-section">
      <div class="setup-card">
        <h2>Criar um Novo Lote</h2>
        <p>Defina as dimensões do lote para começar</p>
        <form @submit.prevent="handleCreateLot" class="lot-form">
          <div class="form-group">
            <label for="lot-width">Largura (metros):</label>
            <input
              id="lot-width"
              v-model="newLot.width"
              type="number"
              placeholder="Ex: 10"
              min="1"
              step="0.1"
              required
            />
          </div>
          <div class="form-group">
            <label for="lot-height">Altura (metros):</label>
            <input
              id="lot-height"
              v-model="newLot.height"
              type="number"
              placeholder="Ex: 15"
              min="1"
              step="0.1"
              required
            />
          </div>
          <button type="submit" class="btn-primary" style="width: 100%;">
            Criar Lote
          </button>
        </form>
      </div>
    </div>

    <div v-else class="editor-shell">
      <header class="top-bar">
        <div class="brand-area">
          <div class="brand-mark">PB</div>
          <div>
            <strong>Planta Baixa</strong>
            <span class="project-name">Projeto sem título</span>
          </div>
        </div>

        <div class="top-actions">
          <button type="button" class="action-button" @click="triggerFileImport">Abrir projeto</button>
          <button type="button" class="action-button" @click="resetProject">Novo projeto</button>
          <button type="button" class="action-button action-primary" @click="saveProjectFile">Salvar</button>
        </div>
      </header>

      <div class="editor-body">
        <aside class="resources-panel">
          <div class="resource-heading">
            <h2>Recursos</h2>
          </div>
          <div class="resource-content">
            <button type="button" class="new-room-button" @click="openAddRoomModal()">
              <span aria-hidden="true">＋</span>
              Novo cômodo
            </button>
            <button type="button" class="new-room-button" @click="openAddRoomModal('furniture')">＋ Adicionar móvel</button>
            <button type="button" class="new-room-button" @click="openAddRoomModal('marking')">＋ Adicionar marcação</button>
            <details class="wall-settings" open>
              <summary>Paredes — configurações globais</summary>
              <label>
                Preenchimento
                <input
                  type="color"
                  aria-label="Preenchimento global das paredes"
                  :value="plantStore.wallSettings.fillColor"
                  @input="plantStore.updateWallSettings({ fillColor: $event.target.value })"
                />
              </label>
              <label>
                Borda
                <input
                  type="color"
                  aria-label="Cor global da borda das paredes"
                  :value="plantStore.wallSettings.strokeColor"
                  @input="plantStore.updateWallSettings({ strokeColor: $event.target.value })"
                />
              </label>
            </details>
            <SvgPalette />
          </div>
          <div class="project-summary">
            <h3>Resumo do projeto</h3>
            <div><span>Área do terreno</span><strong>{{ (plantStore.lot.width * plantStore.lot.height).toFixed(2) }} m²</strong></div>
            <div><span>Cômodos</span><strong>{{ plantStore.rooms.filter(item => item.type === 'room').length }}</strong></div>
            <div><span>Área construída</span><strong>{{ plantStore.getTotalArea.toFixed(2) }} m²</strong></div>
          </div>
        </aside>

        <main class="workspace-panel">
          <PlantCanvas
            class="workspace-canvas"
            :selected-room-id="selectedElement.type === 'room' ? selectedElement.id : null"
            :selected-element-type="selectedElement.type"
            @edit-room="selectRoomToEdit"
            @select-element="selectElement"
            @add-room="openAddRoomModal"
            @add-furniture="openAddRoomModal('furniture')"
            @add-marking="openAddRoomModal('marking')"
          />
        </main>

        <PropertiesPanel
          :item="selectedItem"
          :is-object="selectedElement.type === 'room'"
          :can-move-forward="plantStore.canMoveObject(selectedItem.id, 1)"
          :can-move-backward="plantStore.canMoveObject(selectedItem.id, -1)"
          @update="updateSelectedProperty"
          @reorder="plantStore.moveObject(selectedItem.id, $event)"
        />
      </div>

      <div v-if="isRoomModalOpen" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ selectedRoom ? 'Editar objeto' : 'Adicionar objeto' }}</h3>
            <button type="button" class="modal-close" @click="closeRoomModal">✕</button>
          </div>
          <RoomForm
            @add-room="handleAddRoom"
            @update-room="handleUpdateRoom"
            @cancel="closeRoomModal"
            :selectedRoom="selectedRoom"
            :initial-type="newObjectType"
          />
        </div>
      </div>

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
import { computed, onBeforeUnmount, ref } from 'vue'
import { usePlantStore } from '../stores/plantStore'
import PlantCanvas from './PlantCanvas.vue'
import RoomForm from './RoomForm.vue'
import SvgPalette from './SvgPalette.vue'
import PropertiesPanel from './PropertiesPanel.vue'

const plantStore = usePlantStore()
const newLot = ref({ width: '', height: '' })
const selectedRoom = ref(null)
const newObjectType = ref('room')
const selectedElement = ref({ type: 'lot' })
const isRoomModalOpen = ref(false)
const fileInput = ref(null)

const selectedItem = computed(() => selectedElement.value.type === 'room'
  ? plantStore.getRoomById(selectedElement.value.id) || plantStore.lot
  : plantStore.lot)

const handlePlaceImage = (ev) => {
  const item = ev.detail
  if (!plantStore.lot) {
    alert('Crie um lote primeiro para inserir imagens.')
    return
  }
  // center position
  const centerX = Math.max(0, (plantStore.lot.width / 2) - (item.scale / 2))
  const vb = { vbWidth: item.vbWidth || 1, vbHeight: item.vbHeight || 1 }
  const heightMeters = item.scale * (vb.vbHeight / vb.vbWidth)
  const centerY = Math.max(0, (plantStore.lot.height / 2) - (heightMeters / 2))
  plantStore.addPlacedImage({ path: item.path, name: item.name, scaleMeters: item.scale, x: centerX, y: centerY, vbWidth: vb.vbWidth, vbHeight: vb.vbHeight })
}

window.addEventListener('place-image', handlePlaceImage)
onBeforeUnmount(() => window.removeEventListener('place-image', handlePlaceImage))

const handleCreateLot = () => {
  if (newLot.value.width && newLot.value.height) {
    plantStore.createLot(newLot.value.width, newLot.value.height)
    newLot.value = { width: '', height: '' }
  }
}

const handleAddRoom = (room) => {
  const addedRoom = plantStore.addRoom(room)
  selectedElement.value = { type: 'room', id: addedRoom.id }
  closeRoomModal()
}

const handleUpdateRoom = (updatedRoom) => {
  plantStore.updateRoom(updatedRoom.id, updatedRoom)
  closeRoomModal()
}

const selectRoomToEdit = (room) => {
  selectedRoom.value = room
  selectedElement.value = { type: 'room', id: room.id }
  isRoomModalOpen.value = true
}

const selectElement = (selection) => {
  selectedElement.value = selection?.type === 'room'
    ? { type: 'room', id: selection.id }
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
    plantStore.updateRoom(item.id, { ...item, [field]: value })
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
  min-height: 100vh;
  background: #eef2f5;
}

.setup-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
}

.setup-card {
  background: #ffffff;
  padding: 40px 32px;
  border-radius: 18px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
  max-width: 420px;
  width: 100%;
}

.setup-card h2 {
  color: #1f2937;
  margin-bottom: 10px;
  font-size: 1.8em;
}

.setup-card p {
  color: #475569;
  margin-bottom: 28px;
  font-size: 1.05em;
}

.lot-form {
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
  color: #334155;
}

.form-group input {
  padding: 12px 14px;
  border: 1px solid #d9e1ea;
  border-radius: 10px;
  font-size: 1em;
  background: #f8fafc;
}

.form-group input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.09);
  outline: none;
}

.editor-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #edf2f7;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #0f172a;
}

.brand-mark {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #22c55e);
  color: #fff;
  font-size: 0.8rem;
}

.main-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.menu-button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  background: #f8fafc;
  color: #334155;
  border: 1px solid transparent;
  font-weight: 600;
}

.menu-button.active {
  background: #e0f2fe;
  color: #075985;
  border-color: #bae6fd;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-body {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr) 320px;
  gap: 0;
  flex: 1;
  min-height: 0;
}

.toolbox {
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.tool-button {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: transparent;
  color: #1f2937;
  border: 1px solid transparent;
  text-align: left;
  font-weight: 600;
}

.tool-button:hover,
.tool-button.active {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.tool-button.danger {
  color: #b91c1c;
}

.workspace-panel {
  min-width: 0;
  padding: 12px;
  background: #edf2f7;
}

.workspace-canvas {
  display: block;
  height: calc(100vh - 118px);
  min-height: 500px;
}

.details-panel {
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  padding: 18px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}

.panel-section h3 {
  margin: 0 0 12px;
  color: #0f172a;
  font-size: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 10px;
}

.info-item strong {
  color: #0f172a;
  font-weight: 700;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.mini-button {
  padding: 6px 10px;
  border-radius: 8px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 700;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.room-item {
  background: #f8fafc;
  padding: 12px;
  border-radius: 10px;
  border-left: 4px solid #4f46e5;
  border: 1px solid #e2e8f0;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.room-header h4 {
  margin: 0;
  color: #0f172a;
  font-size: 0.92em;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.room-details {
  font-size: 0.8em;
  color: #475569;
  margin-bottom: 8px;
}

.room-details p {
  margin: 2px 0;
}

.room-actions {
  display: flex;
  gap: 6px;
}

.btn-sm {
  padding: 7px 10px;
  font-size: 0.8rem;
  border-radius: 8px;
  border: none;
  flex: 1;
}

.btn-edit {
  background-color: #2563eb;
  color: white;
}

.btn-edit:hover {
  background-color: #1d4ed8;
}

.btn-delete {
  background-color: #ef4444;
  color: white;
}

.btn-delete:hover {
  background-color: #dc2626;
}

.hidden-file-input {
  display: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  padding: 20px;
}

.modal-content {
  width: min(720px, 95vw);
  max-height: 92vh;
  background: #fff;
  border-radius: 16px;
  overflow: auto;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ececec;
}

.modal-header h3 {
  margin: 0;
  color: #111827;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.4em;
  cursor: pointer;
  color: #475569;
  line-height: 1;
}

.modal-close:hover {
  color: #111827;
}

@media (max-width: 1024px) {
  .editor-body {
    grid-template-columns: 1fr;
  }

  .toolbox {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 14px 12px;
  }

  .workspace-panel {
    padding: 8px;
  }

  .workspace-canvas {
    height: 60vh;
  }

  .details-panel {
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
}

.editor-shell {
  height: 100vh;
  min-height: 560px;
  overflow: hidden;
  background: #f4f5f7;
}

.top-bar {
  height: 58px;
  flex: 0 0 58px;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: none;
  z-index: 2;
}

.brand-area {
  gap: 10px;
  font-size: 13px;
}

.brand-area > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-name {
  color: #7a8089;
  font-size: 11px;
  font-weight: 400;
}

.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
}

.top-actions {
  gap: 8px;
}

.action-button {
  min-height: 34px;
  padding: 0 13px;
  color: #30343a;
  background: #fff;
  border: 1px solid #d9dde2;
  border-radius: 6px;
  font-size: 12px;
}

.action-primary {
  color: #fff;
  background: #1687f8;
  border-color: #1687f8;
}

.editor-body {
  grid-template-columns: 250px minmax(0, 1fr) 310px;
  height: calc(100vh - 58px);
  overflow: hidden;
}

.resources-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border-right: 1px solid #e4e6e9;
}

.resource-heading {
  display: flex;
  align-items: center;
  min-height: 54px;
  padding: 0 18px;
  border-bottom: 1px solid #e8eaed;
}

.resource-heading h2 {
  margin: 0;
  font-size: 14px;
}

.resource-content {
  padding: 14px;
  overflow: auto;
}

.wall-settings {
  margin: 16px 0;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
}

.wall-settings summary {
  cursor: pointer;
  font-weight: 600;
}

.wall-settings label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.wall-settings input {
  width: 36px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.new-room-button {
  width: 100%;
  margin-bottom: 18px;
  padding: 10px 12px;
  border: 1px solid #d8e8fa;
  border-radius: 6px;
  background: #eef6ff;
  color: #126cc3;
  text-align: left;
  font-size: 12px;
}

.new-room-button span {
  margin-right: 6px;
  font-size: 17px;
  vertical-align: -1px;
}

.project-summary {
  margin-top: auto;
  padding: 15px 16px;
  border-top: 1px solid #e8eaed;
}

.project-summary h3 {
  margin: 0 0 12px;
  font-size: 12px;
}

.project-summary > div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 9px;
  color: #6e747d;
  font-size: 11px;
}

.project-summary strong {
  color: #30343a;
  font-weight: 600;
  white-space: nowrap;
}

.workspace-panel {
  min-width: 0;
  min-height: 0;
  padding: 0;
  background: #f4f5f7;
}

.workspace-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.modal-content {
  border-radius: 10px;
}

@media (max-width: 1024px) {
  .editor-shell {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .editor-body {
    height: auto;
    overflow: visible;
    grid-template-columns: minmax(0, 1fr);
  }

  .resources-panel {
    border-right: 0;
    border-bottom: 1px solid #e4e6e9;
  }

  .resource-content {
    max-height: 270px;
  }

  .project-summary {
    display: none;
  }

  .workspace-panel {
    height: 65vh;
    min-height: 420px;
    padding: 8px;
  }

  .details-panel {
    padding: 0;
  }

  .workspace-canvas {
    height: 100%;
  }
}

@media (max-width: 560px) {
  .top-bar {
    padding: 0 10px;
  }

  .top-actions {
    gap: 5px;
  }

  .action-button {
    padding: 0 8px;
  }
}
</style>
