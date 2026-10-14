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
          <span>Planta Baixa</span>
        </div>

        <nav class="main-menu" aria-label="Menu principal">
          <button type="button" class="menu-button active">Arquivo</button>
          <button type="button" class="menu-button">Editar</button>
          <button type="button" class="menu-button">Visualizar</button>
          <button type="button" class="menu-button">Ajuda</button>
        </nav>

        <div class="top-actions">
          <button type="button" class="btn-secondary" @click="saveProjectFile">Salvar</button>
          <button type="button" class="btn-secondary" @click="triggerFileImport">Carregar</button>
        </div>
      </header>

      <div class="editor-body">
        <aside class="toolbox">
          <div class="tool-section">
            <span class="tool-label">Ferramentas</span>
            <button type="button" class="tool-button active">🧭 Planta</button>
            <button type="button" class="tool-button" @click="openAddRoomModal">➕ Cômodo</button>
            <button type="button" class="tool-button" @click="editLot">✏️ Lote</button>
          </div>

          <div class="tool-section">
            <span class="tool-label">Projeto</span>
            <button type="button" class="tool-button danger" @click="resetProject">🗑️ Limpar</button>
          </div>
        </aside>

        <main class="workspace-panel">
          <PlantCanvas class="workspace-canvas" @edit-room="selectRoomToEdit" />
        </main>

        <aside class="details-panel">
          <div class="panel-section">
            <h3>Resumo do lote</h3>
            <div class="info-item">
              <span>Dimensões</span>
              <strong>{{ plantStore.lot.width }}m × {{ plantStore.lot.height }}m</strong>
            </div>
            <div class="info-item">
              <span>Área total</span>
              <strong>{{ (plantStore.lot.width * plantStore.lot.height).toFixed(2) }} m²</strong>
            </div>
            <div class="info-item">
              <span>Cômodos</span>
              <strong>{{ plantStore.rooms.length }}</strong>
            </div>
            <div class="info-item">
              <span>Área ocupada</span>
              <strong>{{ plantStore.getTotalArea.toFixed(2) }} m²</strong>
            </div>
          </div>

          <div class="panel-section">
            <h3>Imagens SVG</h3>
            <SvgPalette />
            <p class="muted" style="margin-top:8px">Clique para inserir no centro ou arraste para o canvas.</p>
          </div>

          <!-- <div class="panel-section">
            <div class="panel-header">
              <h3>Cômodos</h3>
              <button type="button" class="mini-button" @click="openAddRoomModal">+ Novo</button>
            </div>

            <div v-if="plantStore.rooms.length === 0" class="empty-state">
              <p>Nenhum cômodo adicionado ainda.</p>
            </div>

            <div v-else class="rooms-list">
              <div
                v-for="room in plantStore.rooms"
                :key="room.id"
                class="room-item"
                :style="{ borderLeftColor: room.color }"
              >
                <div class="room-header">
                  <h4>{{ room.name }}</h4>
                  <span class="color-indicator" :style="{ backgroundColor: room.color }"></span>
                </div>
                <div class="room-details">
                  <p>{{ room.width }}m × {{ room.height }}m</p>
                  <p>Área: {{ (room.width * room.height).toFixed(2) }} m²</p>
                </div>
                <div class="room-actions">
                  <button class="btn-sm btn-edit" @click="selectRoomToEdit(room)">✏️</button>
                  <button class="btn-sm btn-delete" @click="deleteRoom(room.id)">🗑️</button>
                </div>
              </div>
            </div>
          </div> -->


        </aside>
      </div>

      <div v-if="isRoomModalOpen" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ selectedRoom ? 'Editar Cômodo' : 'Adicionar Cômodo' }}</h3>
            <button type="button" class="modal-close" @click="closeRoomModal">✕</button>
          </div>
          <RoomForm
            @add-room="handleAddRoom"
            @update-room="handleUpdateRoom"
            @cancel="closeRoomModal"
            :selectedRoom="selectedRoom"
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
import { ref } from 'vue'
import { usePlantStore } from '../stores/plantStore'
import PlantCanvas from './PlantCanvas.vue'
import RoomForm from './RoomForm.vue'
import SvgPalette from './SvgPalette.vue'

const plantStore = usePlantStore()
const newLot = ref({ width: '', height: '' })
const selectedRoom = ref(null)
const isRoomModalOpen = ref(false)
const fileInput = ref(null)

// listen to click-to-place events dispatched by SvgPalette
window.addEventListener('place-image', (ev) => {
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
})

const handleCreateLot = () => {
  if (newLot.value.width && newLot.value.height) {
    plantStore.createLot(newLot.value.width, newLot.value.height)
    newLot.value = { width: '', height: '' }
  }
}

const handleAddRoom = (room) => {
  plantStore.addRoom(room)
  closeRoomModal()
}

const handleUpdateRoom = (updatedRoom) => {
  plantStore.updateRoom(updatedRoom.id, updatedRoom)
  closeRoomModal()
}

const selectRoomToEdit = (room) => {
  selectedRoom.value = room
  isRoomModalOpen.value = true
}

const openAddRoomModal = () => {
  selectedRoom.value = null
  isRoomModalOpen.value = true
}

const closeRoomModal = () => {
  isRoomModalOpen.value = false
  selectedRoom.value = null
}

const deleteRoom = (id) => {
  if (confirm('Tem certeza que deseja deletar este cômodo?')) {
    plantStore.deleteRoom(id)
    if (selectedRoom.value?.id === id) {
      selectedRoom.value = null
    }
  }
}

const editLot = () => {
  if (confirm('Editar o lote irá limpar todos os cômodos. Deseja continuar?')) {
    const newWidth = prompt('Nova largura (metros):', plantStore.lot.width)
    if (newWidth) {
      const newHeight = prompt('Nova altura (metros):', plantStore.lot.height)
      if (newHeight) {
        plantStore.createLot(newWidth, newHeight)
      }
    }
  }
}

const resetProject = () => {
  if (confirm('Isto irá limpar todo o projeto. Deseja continuar?')) {
    plantStore.resetProject()
    selectedRoom.value = null
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
    isRoomModalOpen.value = false
  } catch {
    alert('Não foi possível carregar o arquivo. Verifique se o JSON está válido.')
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
</style>
