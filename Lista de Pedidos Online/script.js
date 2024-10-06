// Configuração do Firebase
var firebaseConfig = {
    apiKey: "AIzaSyAbADgKRicHlfDWoaXmIfU0EjGbU6nFkPQ",
    authDomain: "armazene-acd30.firebaseapp.com",
    databaseURL: "https://armazene-acd30-default-rtdb.firebaseio.com",
    projectId: "armazene-acd30",
    storageBucket: "armazene-acd30.appspot.com",
    messagingSenderId: "853849509051",
    appId: "1:853849509051:web:6fa7e18d0af9b9375b2d9e",
    measurementId: "G-PHWMDP8QE0"
  };
// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || [];
let sections = JSON.parse(localStorage.getItem('sections')) || [];

function saveState() {
    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
    localStorage.setItem('sections', JSON.stringify(sections));
}

function toggleRiscado(event, uniqueId) {
    const listItem = event.target.closest('li');
    const markButton = listItem.querySelector('.mark-button');
    const unmarkButton = listItem.querySelector('.unmark-button');

    const section = sections.find(s => s.items.some(i => i.uniqueId === uniqueId));
    const item = section.items.find(i => i.uniqueId === uniqueId);

    if (listItem.classList.contains('riscado')) {
        // Desmarcar item
        item.purchased = 0;
        purchasedItems = purchasedItems.filter(p => p.uniqueId !== uniqueId);
    } else {
        // Marcar item
        const purchasedQuantity = parseInt(listItem.querySelector('.purchased-input').value);
        if (!purchasedQuantity || purchasedQuantity <= 0) {
            alert('Por favor, insira a quantidade comprada antes de marcar o item.');
            return;
        }
        item.purchased = purchasedQuantity;
        purchasedItems.push({ name: item.name, store: item.store, purchased: item.purchased, uniqueId: uniqueId });
    }

    // Atualiza a interface do usuário
    listItem.classList.toggle('riscado');
    markButton.style.display = listItem.classList.contains('riscado') ? 'none' : 'inline-block';
    unmarkButton.style.display = listItem.classList.contains('riscado') ? 'inline-block' : 'none';

    saveState();
}

function discardItem(event, sectionName, uniqueId) {
    const section = sections.find(s => s.name === sectionName);
    if (section) {
        section.items = section.items.filter(item => item.uniqueId !== uniqueId);
        purchasedItems = purchasedItems.filter(item => item.uniqueId !== uniqueId);
        const listItem = event.target.closest('li');
        listItem.remove();
        saveState();
    }
}

function discardSection(event, sectionName) {
    sections = sections.filter(section => section.name !== sectionName);
    purchasedItems = purchasedItems.filter(item => item.section !== sectionName);
    const sectionDiv = event.target.closest('.section');
    sectionDiv.remove();
    saveState();
}

function editSectionName(event, oldName) {
    const newName = prompt('Editar nome da seção:', oldName);
    if (newName && newName.trim() !== '') {
        const section = sections.find(s => s.name === oldName);
        if (section) {
            section.name = newName;

            // Atualizar o DOM
            const sectionDiv = event.target.closest('.section');
            sectionDiv.querySelector('h2').textContent = newName;
            const ulElement = sectionDiv.querySelector('ul');
            ulElement.dataset.sectionName = newName;

            saveState();
        }
    }
}

function restoreState() {
    const sectionsContainer = document.getElementById('sections');
    sectionsContainer.innerHTML = '';
    sections.forEach(section => {
        addSectionToDOM(section.name, section.items);
    });
}

function addSection() {
    const sectionNameInput = document.getElementById('newSectionName');
    const sectionName = sectionNameInput.value.trim();
    if (sectionName) {
        const newSection = { name: sectionName, items: [] };
        sections.push(newSection);
        addSectionToDOM(sectionName, []);
        sectionNameInput.value = '';
        saveState();
    } else {
        alert('Por favor, insira um nome para a seção.');
    }
}

function addSectionToDOM(name, items) {
    const sectionsContainer = document.getElementById('sections');
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section');
    sectionDiv.innerHTML = `<h2>${name}</h2>
        <button class="discard-section-btn" onclick="discardSection(event, '${name}')">Descartar Seção</button>
        <button class="edit-section-btn" onclick="editSectionName(event, '${name}')">Editar Seção</button>
        <ul class="sortable" ondragover="event.preventDefault()"></ul>
        <div class="add-item">
            <input type="number" placeholder="Qtd Estoque" class="newItemStock">
            <input type="text" placeholder="Nome do Produto" class="newItemName">
            <input type="number" placeholder="Qtd Pedida" class="newItemRequested">
            <input type="text" placeholder="Loja" class="newItemStore">
            <button onclick="addItem(event, '${name}')">Adicionar Produto</button>
        </div>`;
    sectionsContainer.appendChild(sectionDiv);
    const ulElement = sectionDiv.querySelector('ul');
    ulElement.dataset.sectionName = name;

    // Converter items em array se for um objeto
    if (!items) {
        items = [];
    } else if (!Array.isArray(items)) {
        items = Object.values(items);
    }

    if (items.length === 0) {
        ulElement.classList.add('placeholder');
    }
    items.forEach(item => {
        addItemToDOM(ulElement, item, name);
    });
    initializeSortable(ulElement);
}

function addItem(event, sectionName) {
    const sectionDiv = event.target.closest('.section');
    const itemStockInput = sectionDiv.querySelector('.newItemStock');
    const itemNameInput = sectionDiv.querySelector('.newItemName');
    const itemRequestedInput = sectionDiv.querySelector('.newItemRequested');
    const itemStoreInput = sectionDiv.querySelector('.newItemStore');
    const itemStock = parseInt(itemStockInput.value) || 0;
    const itemName = itemNameInput.value.trim();
    const itemRequested = parseInt(itemRequestedInput.value) || 0;
    const itemStore = itemStoreInput.value.trim();
    const uniqueId = `${itemName}-${itemStore}-${Date.now()}`;

    if (itemName && itemStore) {
        const section = sections.find(s => s.name === sectionName);
        const newItem = {
            name: itemName,
            stock: itemStock,
            requested: itemRequested,
            store: itemStore,
            purchased: 0,
            uniqueId: uniqueId
        };
        section.items.push(newItem);
        const ulElement = sectionDiv.querySelector('ul');
        ulElement.classList.remove('placeholder');
        addItemToDOM(ulElement, newItem, sectionName);
        itemStockInput.value = '';
        itemNameInput.value = '';
        itemRequestedInput.value = '';
        itemStoreInput.value = '';
        saveState();
    } else {
        alert('Por favor, insira um nome para o produto e uma loja.');
    }
}

function addItemToDOM(ulElement, item, sectionName) {
    const listItem = document.createElement('li');
    listItem.classList.add('container');
    listItem.setAttribute('draggable', true);
    listItem.setAttribute('data-unique-id', item.uniqueId);
    listItem.innerHTML = `(Estoque: ${item.stock}) ${item.name} (Pedida: ${item.requested}, Loja: ${item.store})
        <div class="button-group">
            <input type="number" min="0" placeholder="Qtd Comprada" value="${item.purchased}" class="purchased-input" onchange="updatePurchased(event, '${sectionName}', '${item.uniqueId}')">
            <button class="mark-button" onclick="toggleRiscado(event, '${item.uniqueId}')">Marcar</button>
            <button class="unmark-button" onclick="toggleRiscado(event, '${item.uniqueId}')" style="display: none;">Desmarcar</button>
            <button onclick="discardItem(event, '${sectionName}', '${item.uniqueId}')">Descartar</button>
        </div>`;
    ulElement.appendChild(listItem);

    // Se o item já estava riscado (purchased > 0), atualiza a interface
    if (item.purchased > 0) {
        listItem.classList.add('riscado');
        const markButton = listItem.querySelector('.mark-button');
        const unmarkButton = listItem.querySelector('.unmark-button');
        markButton.style.display = 'none';
        unmarkButton.style.display = 'inline-block';
    }
}

function initializeSortable(ulElement) {
    new Sortable(ulElement, {
        group: {
            name: 'shared',
            pull: true,
            put: true
        },
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        scroll: true,
        scrollSensitivity: 60,
        scrollSpeed: 20,
        emptyInsertThreshold: 10,
        supportPointer: false,
        onEnd: function (evt) {
            const itemId = evt.item.getAttribute('data-unique-id');
            const oldSectionName = evt.from.dataset.sectionName;
            const newSectionName = evt.to.dataset.sectionName;

            if (oldSectionName && newSectionName && oldSectionName !== newSectionName) {
                const oldSection = sections.find(section => section.name === oldSectionName);
                const newSection = sections.find(section => section.name === newSectionName);
                const movedItem = oldSection.items.find(item => item.uniqueId === itemId);

                // Remover o item da seção antiga e adicionar na nova
                oldSection.items = oldSection.items.filter(item => item.uniqueId !== itemId);
                newSection.items.push(movedItem);
                saveState();
            }

            // Atualizar o placeholder das seções
            if (evt.from.children.length === 0) {
                evt.from.classList.add('placeholder');
            }
            if (evt.to.children.length > 0) {
                evt.to.classList.remove('placeholder');
            }
        }
    });
}

function updatePurchased(event, sectionName, uniqueId) {
    const section = sections.find(s => s.name === sectionName);
    if (section) {
        const item = section.items.find(i => i.uniqueId === uniqueId);
        if (item) {
            const newPurchased = parseInt(event.target.value) || 0;
            item.purchased = newPurchased;

            // Atualiza o estado de riscado se a quantidade comprada for maior que 0
            const listItem = event.target.closest('li');
            const markButton = listItem.querySelector('.mark-button');
            const unmarkButton = listItem.querySelector('.unmark-button');
            if (newPurchased > 0) {
                if (!listItem.classList.contains('riscado')) {
                    listItem.classList.add('riscado');
                    markButton.style.display = 'none';
                    unmarkButton.style.display = 'inline-block';
                }
                // Atualiza purchasedItems
                const existingItem = purchasedItems.find(p => p.uniqueId === uniqueId);
                if (existingItem) {
                    existingItem.purchased = newPurchased;
                } else {
                    purchasedItems.push({ name: item.name, store: item.store, purchased: newPurchased, uniqueId: uniqueId });
                }
            } else {
                if (listItem.classList.contains('riscado')) {
                    listItem.classList.remove('riscado');
                    markButton.style.display = 'inline-block';
                    unmarkButton.style.display = 'none';
                }
                purchasedItems = purchasedItems.filter(p => p.uniqueId !== uniqueId);
            }
            saveState();
        }
    }
}

function generateReport() {
    const reportContainer = document.getElementById('report');
    reportContainer.innerHTML = '<h3>Relatório de Compras:</h3>';

    const markedItems = sections.flatMap(section => {
        // Garantir que section.items seja um array
        let items = section.items || [];
        if (!Array.isArray(items)) {
            items = Object.values(items);
        }
        return items.filter(item => item.purchased > 0);
    });

    if (markedItems.length > 0) {
        const ul = document.createElement('ul');
        markedItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.purchased} - ${item.name} - ${item.store}`;
            ul.appendChild(li);
        });
        reportContainer.appendChild(ul);
    } else {
        reportContainer.innerHTML += '<p>Nenhum item foi marcado como comprado.</p>';
    }
}

function exportHistory() {
    const data = { sections, purchasedItems };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lista_produtos_historico.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importHistory(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);

        // Converter sections em array se for um objeto
        sections = data.sections || [];
        if (!Array.isArray(sections)) {
            sections = Object.values(sections);
        }

        // Garantir que items em cada section sejam arrays
        sections.forEach(section => {
            if (section.items) {
                if (!Array.isArray(section.items)) {
                    section.items = Object.values(section.items);
                }
            } else {
                section.items = [];
            }
        });

        // Converter purchasedItems em array se for um objeto
        purchasedItems = data.purchasedItems || [];
        if (!Array.isArray(purchasedItems)) {
            purchasedItems = Object.values(purchasedItems);
        }

        saveState();
        // Limpar o DOM e restaurar o estado
        document.getElementById('sections').innerHTML = '';
        restoreState();
    };
    reader.readAsText(file);
}

// Função para salvar o estado atual online (Firebase)
function saveOnline() {
    const saveName = prompt("Nome para o salvamento:");
    if (saveName && saveName.trim() !== '') {
        const data = { sections, purchasedItems, timestamp: Date.now(), name: saveName.trim() };
        const newDataKey = database.ref().child('savedStates').push().key;
        const updates = {};
        updates['/savedStates/' + newDataKey] = data;
        database.ref().update(updates).then(() => {
            alert('Estado salvo online com sucesso!');
            loadSavedStates(); // Atualiza a lista de salvamentos
        }).catch(error => {
            alert('Erro ao salvar online: ' + error.message);
        });
    } else {
        alert('Operação cancelada ou nome inválido.');
    }
}

// Função para carregar os estados salvos online
function loadSavedStates() {
    const savedCardsContainer = document.getElementById('savedCards');
    savedCardsContainer.innerHTML = '<p>Carregando salvamentos...</p>';

    database.ref('/savedStates/').once('value').then(function(snapshot) {
        const savedStates = [];
        snapshot.forEach(function(childSnapshot) {
            const savedState = childSnapshot.val();
            savedState.key = childSnapshot.key;
            savedStates.push(savedState);
        });

        // Exibir os mais recentes no topo
        savedStates.sort((a, b) => b.timestamp - a.timestamp);

        savedCardsContainer.innerHTML = '';
        savedStates.forEach(savedState => {
            addSavedCardToDOM(savedState);
        });
    }).catch(function(error) {
        savedCardsContainer.innerHTML = '<p>Erro ao carregar salvamentos.</p>';
        console.error('Erro ao carregar salvamentos:', error);
    });
}

// Função para adicionar um cartão de salvamento ao DOM
function addSavedCardToDOM(savedState) {
    const savedCardsContainer = document.getElementById('savedCards');
    const card = document.createElement('div');
    card.classList.add('saved-card');
    const date = new Date(savedState.timestamp);
    card.innerHTML = `
        <div class="saved-card-header">
            <strong>${savedState.name || 'Salvamento sem nome'} - ${date.toLocaleString()}</strong>
            <div>
                <button onclick="restoreSavedState('${savedState.key}')">Restaurar</button>
                <button onclick="deleteSavedState('${savedState.key}')">Excluir</button>
            </div>
        </div>`;
    savedCardsContainer.appendChild(card);
}

// Função para restaurar um estado salvo
function restoreSavedState(key) {
    database.ref('/savedStates/' + key).once('value').then(function(snapshot) {
        const data = snapshot.val();

        // Converter sections em array se for um objeto
        sections = data.sections || [];
        if (!Array.isArray(sections)) {
            sections = Object.values(sections);
        }

        // Garantir que items em cada section sejam arrays
        sections.forEach(section => {
            if (section.items) {
                if (!Array.isArray(section.items)) {
                    section.items = Object.values(section.items);
                }
            } else {
                section.items = [];
            }
        });

        // Converter purchasedItems em array se for um objeto
        purchasedItems = data.purchasedItems || [];
        if (!Array.isArray(purchasedItems)) {
            purchasedItems = Object.values(purchasedItems);
        }

        saveState();
        // Limpar o DOM e reconstruir
        document.getElementById('sections').innerHTML = '';
        restoreState();
        // Limpar o relatório
        document.getElementById('report').innerHTML = '';
    }).catch(function(error) {
        alert('Erro ao restaurar o salvamento: ' + error.message);
        console.error('Erro ao restaurar o salvamento:', error);
    });
}

// Função para excluir um estado salvo
function deleteSavedState(key) {
    database.ref('/savedStates/' + key).remove().then(() => {
        loadSavedStates();
    }).catch(function(error) {
        alert('Erro ao excluir o salvamento: ' + error.message);
        console.error('Erro ao excluir o salvamento:', error);
    });
}

window.onload = function() {
    restoreState();
    loadSavedStates();
};
