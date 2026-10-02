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

    <div v-else class="editor-content">
      <PlantCanvas class="fullscreen-canvas" @edit-room="selectRoomToEdit" />

      <div class="floating-panel">
        <div class="lot-info">
          <h3>Informações do Lote</h3>
          <div class="info-item">
            <span>Dimensões:</span>
            <strong>{{ plantStore.lot.width }}m × {{ plantStore.lot.height }}m</strong>
          </div>
          <div class="info-item">
            <span>Área Total:</span>
            <strong>{{ (plantStore.lot.width * plantStore.lot.height).toFixed(2) }} m²</strong>
          </div>
          <div class="info-item">
            <span>Cômodos:</span>
            <strong>{{ plantStore.rooms.length }}</strong>
          </div>
          <div class="info-item">
            <span>Área Ocupada:</span>
            <strong>{{ plantStore.getTotalArea.toFixed(2) }} m²</strong>
          </div>

          <div class="lot-actions">
            <button class="btn-primary" @click="openAddRoomModal" style="width: 100%; margin-top: 10px;">
              ➕ Novo Cômodo
            </button>
            <button class="btn-warning" @click="editLot" style="width: 100%; margin-top: 10px;">
              ✏️ Editar Lote
            </button>
            <button class="btn-secondary" @click="saveProjectFile" style="width: 100%; margin-top: 10px;">
              💾 Salvar Arquivo
            </button>
            <button class="btn-secondary" @click="triggerFileImport" style="width: 100%; margin-top: 10px;">
              📂 Carregar Arquivo
            </button>
            <button class="btn-danger" @click="resetProject" style="width: 100%; margin-top: 10px;">
              🗑️ Limpar Projeto
            </button>
          </div>
        </div>

        <div class="rooms-list">
          <h3>Cômodos</h3>
          <div v-if="plantStore.rooms.length === 0" class="empty-state">
            <p>Nenhum cômodo adicionado ainda.</p>
            <p style="font-size: 0.9em; opacity: 0.7;">Clique em "Novo Cômodo" para adicionar.</p>
          </div>
          <div v-else class="rooms-items">
            <div
              v-for="room in plantStore.rooms"
              :key="room.id"
              class="room-item"
              :style="{ borderLeftColor: room.color }"
            >
              <div class="room-header">
                <h4>{{ room.name }}</h4>
                <div class="color-indicator" :style="{ backgroundColor: room.color }"></div>
              </div>
              <div class="room-details">
                <p><small>{{ room.width }}m × {{ room.height }}m</small></p>
                <p><small>Área: {{ (room.width * room.height).toFixed(2) }} m²</small></p>
              </div>
              <div class="room-actions">
                <button class="btn-sm btn-edit" @click="selectRoomToEdit(room)">✏️</button>
                <button class="btn-sm btn-delete" @click="deleteRoom(room.id)">🗑️</button>
              </div>
            </div>
          </div>
        </div>
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

const plantStore = usePlantStore()
const newLot = ref({ width: '', height: '' })
const selectedRoom = ref(null)
const isRoomModalOpen = ref(false)
const fileInput = ref(null)

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
  min-height: calc(100vh - 120px);
}

.setup-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  padding: 20px;
}

.setup-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}

.setup-card h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.8em;
}

.setup-card p {
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1em;
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
  color: #333;
}

.form-group input {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.editor-content {
  /* position: relative; */
  /* background: white; */
  /* border-radius: 12px; */
  /* overflow: hidden; */
  /* box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); */
  /* height: calc(100vh - 140px); */
}

.hidden-file-input {
  display: none;
}

.fullscreen-canvas {
padding-left: 400px;
  width: 100%;
  height: 100%;
}

.floating-panel {
  position: absolute;
  top: 15px;
  left: 15px;
  bottom: 15px;
  width: min(330px, 92vw);
  background: rgba(249, 249, 249, 0.95);
  backdrop-filter: blur(8px);
  padding: 16px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 5;
}

.lot-info {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.lot-info h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.1em;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.95em;
  color: #555;
}

.info-item strong {
  color: #667eea;
  font-weight: 600;
}

.rooms-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 220px;
}

.rooms-list h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.1em;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 10px;
  text-align: center;
  color: #999;
  background: white;
  border-radius: 8px;
  border: 2px dashed #ddd;
  flex: 1;
}

.rooms-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.room-item {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #667eea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.room-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.room-header h4 {
  margin: 0;
  color: #333;
  font-size: 0.95em;
  flex: 1;
}

.color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
}

.room-details {
  margin-bottom: 10px;
  font-size: 0.85em;
  color: #666;
}

.room-details p {
  margin: 2px 0;
}

.room-actions {
  display: flex;
  gap: 6px;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 0.9em;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background-color: #2196F3;
  color: white;
  flex: 1;
}

.btn-edit:hover {
  background-color: #0b7dda;
}

.btn-delete {
  background-color: #f44336;
  color: white;
  flex: 1;
}

.btn-delete:hover {
  background-color: #da190b;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  padding: 20px;
}

.modal-content {
  width: min(720px, 95vw);
  max-height: 92vh;
  background: #fff;
  border-radius: 12px;
  overflow: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
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
  color: #333;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.4em;
  cursor: pointer;
  color: #444;
  line-height: 1;
}

.modal-close:hover {
  color: #000;
}

@media (max-width: 1024px) {
  .editor-content {
    height: calc(100vh - 110px);
  }

  .floating-panel {
    position: absolute;
    top: auto;
    left: 10px;
    right: 10px;
    bottom: 10px;
    width: auto;
    max-height: 45%;
  }
}
</style>
