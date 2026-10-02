# ⚡ Quick Start

## Instalação Rápida (2 minutos)

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev

# 3. Abra seu navegador:
# http://localhost:5173
```

## Primeiros Passos

### 1️⃣ Criar um Lote
```
Largura: 10 metros
Altura: 15 metros
[Clique em "Criar Lote"]
```

### 2️⃣ Adicionar seu Primeiro Cômodo
```
Nome: Sala de Estar
Largura: 5 metros
Altura: 4 metros
Posição X: 0 metros
Posição Y: 0 metros
Cor: [escolha uma cor]
[Clique em "Adicionar Cômodo"]
```

### 3️⃣ Adicionar mais Cômodos
```
Nome: Quarto 1
Largura: 4 metros
Altura: 3.5 metros
Posição X: 5 metros
Posição Y: 0 metros
```

### 4️⃣ Visualizar e Interagir
- Veja a planta no canvas à direita
- Clique e arraste para mover os cômodos
- Use 🔍+ e 🔍- para zoom
- Clique ✏️ para editar um cômodo
- Clique 🗑️ para deletar um cômodo

## 🎮 Controles

| Ação | Como Fazer |
|------|-----------|
| Mover cômodo | Clique e arraste no canvas |
| Aumentar zoom | Clique 🔍+ |
| Diminuir zoom | Clique 🔍- |
| Editar cômodo | Clique ✏️ na lista |
| Deletar cômodo | Clique 🗑️ na lista |
| Editar lote | Clique "Editar Lote" |
| Limpar tudo | Clique "Limpar Projeto" |

## 📝 Exemplo Completo de Planta Simples

**Lote: 12m × 10m**

1. **Sala (5m × 4m)** - Posição: 0, 0
2. **Cozinha (3m × 3m)** - Posição: 5, 0
3. **Quarto 1 (4m × 3.5m)** - Posição: 0, 4
4. **Banheiro (2m × 2m)** - Posição: 4, 4

Área total usada: ~33.5 m² de 120 m²

## 🔧 Troubleshooting

### Porta não abre em http://localhost:5173?
```bash
# Verifique se o servidor está rodando
npm run dev

# Tente outra porta
npm run dev -- --port 3000
```

### Erro de módulos não encontrados?
```bash
# Limpe node_modules e reinstale
rm -rf node_modules
npm install
```

### Cores estranhas ou não aparecem?
```bash
# Limpe o cache do navegador (Ctrl+Shift+Delete)
# Recarregue a página (Ctrl+F5)
```

## 📚 Próximos Passos

- Leia [README.md](README.md) para documentação completa
- Veja [DEVELOPMENT.md](DEVELOPMENT.md) para ideias de melhorias
- Explore o código em `src/components/` e `src/stores/`

## 🚀 Build para Produção

```bash
npm run build

# Saída em: dist/
# Deploy o conteúdo de `dist/` para seu servidor
```

---

**Divirta-se criando plantas! 🏠**
