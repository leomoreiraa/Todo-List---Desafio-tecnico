// Estrutura de dados e variáveis globais
let tasks = [];
let currentFilter = 'all';
let selectedTags = [];
let sidebarCollapsed = false;

// Elementos DOM - Navegação e UI
const sidebar = document.querySelector('.sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const currentViewTitle = document.getElementById('current-view-title');
const addTaskToggle = document.getElementById('add-task-toggle');
const addTaskArea = document.getElementById('add-task-area');
const cancelAddTask = document.getElementById('cancel-add-task');
const emptyState = document.getElementById('empty-state');

// Elementos DOM - Formulário de tarefas
const newTaskText = document.getElementById('new-task-text');
const newTaskDueDate = document.getElementById('new-task-due-date');
const newTaskTags = document.getElementById('new-task-tags');
const addTaskButton = document.getElementById('add-task-button');
const tasksList = document.getElementById('tasks');
const filterButtons = document.querySelectorAll('.filter-btn');
const tagFilterList = document.getElementById('tag-filter-list');

// Elementos DOM - Modal de edição
const editModal = document.getElementById('edit-modal');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const editTaskId = document.getElementById('edit-task-id');
const editTaskText = document.getElementById('edit-task-text');
const editTaskDueDate = document.getElementById('edit-task-due-date');
const editTaskTags = document.getElementById('edit-task-tags');
const saveEditButton = document.getElementById('save-edit-button');

// Elementos DOM - Acessibilidade
const decreaseFontBtn = document.getElementById('decrease-font');
const increaseFontBtn = document.getElementById('increase-font');
const toggleThemeBtn = document.getElementById('toggle-theme');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    updateTagFilters();
    setupEventListeners();
});

// Configuração de Event Listeners
function setupEventListeners() {
    // Toggle da barra lateral
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        sidebarCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    });
    
    // Toggle do formulário de adição de tarefa
    addTaskToggle.addEventListener('click', () => {
        addTaskArea.style.display = addTaskArea.style.display === 'none' || addTaskArea.style.display === '' ? 'block' : 'none';
        if (addTaskArea.style.display === 'block') {
            newTaskText.focus();
        }
    });
    
    // Cancelar adição de tarefa
    cancelAddTask.addEventListener('click', () => {
        addTaskArea.style.display = 'none';
        clearAddTaskForm();
    });

    // Adicionar tarefa
    addTaskButton.addEventListener('click', () => {
        addTask(
            newTaskText.value.trim(),
            newTaskDueDate.value,
            newTaskTags.value.trim()
        );
        addTaskArea.style.display = 'none';
    });

    // Filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            updateCurrentViewTitle();
            renderTasks();
        });
    });

    // Modal de edição
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // Salvar edições
    saveEditButton.addEventListener('click', () => {
        const id = parseInt(editTaskId.value);
        editTask(
            id,
            editTaskText.value.trim(),
            editTaskDueDate.value,
            editTaskTags.value.trim()
        );
        editModal.style.display = 'none';
    });

    // Acessibilidade - Tamanho da fonte
    decreaseFontBtn.addEventListener('click', () => {
        const body = document.body;
        if (body.classList.contains('font-size-large')) {
            body.classList.remove('font-size-large');
            body.classList.add('font-size-medium');
            localStorage.setItem('fontSize', 'medium');
        } else if (body.classList.contains('font-size-medium')) {
            body.classList.remove('font-size-medium');
            body.classList.add('font-size-small');
            localStorage.setItem('fontSize', 'small');
        }
    });

    increaseFontBtn.addEventListener('click', () => {
        const body = document.body;
        if (body.classList.contains('font-size-small')) {
            body.classList.remove('font-size-small');
            body.classList.add('font-size-medium');
            localStorage.setItem('fontSize', 'medium');
        } else if (body.classList.contains('font-size-medium')) {
            body.classList.remove('font-size-medium');
            body.classList.add('font-size-large');
            localStorage.setItem('fontSize', 'large');
        }
    });

    // Acessibilidade - Tema de contraste
    toggleThemeBtn.addEventListener('click', () => {
        const body = document.body;
        if (body.classList.contains('theme-light')) {
            body.classList.remove('theme-light');
            body.classList.add('theme-dark');
            toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('theme-dark');
            body.classList.add('theme-light');
            toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        }
    });
}

// Atualizar título da visualização atual
function updateCurrentViewTitle() {
    let title = 'Todas as Tarefas';
    
    if (currentFilter === 'pending') {
        title = 'Tarefas Pendentes';
    } else if (currentFilter === 'completed') {
        title = 'Tarefas Concluídas';
    }
    
    if (selectedTags.length > 0) {
        title += ` - Tags: ${selectedTags.join(', ')}`;
    }
    
    currentViewTitle.textContent = title;
}

// Limpar formulário de adição de tarefa
function clearAddTaskForm() {
    newTaskText.value = '';
    newTaskDueDate.value = '';
    newTaskTags.value = '';
}

// Funções CRUD para tarefas
function addTask(text, dueDate, tagsString) {
    if (!text) return; // Não adiciona tarefas vazias

    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const newTask = {
        id: Date.now(), // Timestamp como ID único
        text: text,
        completed: false,
        dueDate: dueDate || null,
        tags: tags
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateTagFilters();

    // Limpar campos do formulário
    clearAddTaskForm();

    // Mostrar animação de confirmação
    showToastConfirm();
}

function editTask(id, newText, newDueDate, newTagsString) {
    if (!newText) return; // Não permite texto vazio

    const newTags = newTagsString ? newTagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            text: newText,
            dueDate: newDueDate || null,
            tags: newTags
        };
        
        saveTasks();
        renderTasks();
        updateTagFilters();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateTagFilters();
}

function toggleComplete(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
    }
}

// Funções de renderização
function renderTasks() {
    tasksList.innerHTML = '';
    
    // Filtrar tarefas
    let filteredTasks = tasks;
    
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    // Filtrar por tags selecionadas
    if (selectedTags.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
            selectedTags.some(tag => task.tags.includes(tag))
        );
    }
    
    // Mostrar estado vazio se não houver tarefas
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'flex';
        return;
    } else {
        emptyState.style.display = 'none';
    }
    
    // Renderizar tarefas filtradas
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        // Checkbox para marcar como concluída
        const taskCheckbox = document.createElement('div');
        taskCheckbox.className = 'task-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-complete-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleComplete(task.id));
        
        taskCheckbox.appendChild(checkbox);
        
        // Conteúdo da tarefa
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        // Texto da tarefa
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.text;
        
        // Metadados da tarefa (data e tags)
        const taskMeta = document.createElement('div');
        taskMeta.className = 'task-meta';
        
        // Data de vencimento
        if (task.dueDate) {
            const taskDueDate = document.createElement('span');
            taskDueDate.className = 'task-due-date';
            
            // Formatar data
            const dueDate = new Date(task.dueDate);
            const formattedDate = dueDate.toLocaleDateString('pt-BR');
            const formattedTime = dueDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            // Verificar se está próximo do prazo ou atrasado
            const now = new Date();
            const timeDiff = dueDate - now;
            const oneDayMs = 24 * 60 * 60 * 1000;
            
            if (timeDiff < 0 && !task.completed) {
                taskDueDate.classList.add('overdue');
            } else if (timeDiff < oneDayMs && !task.completed) {
                taskDueDate.classList.add('due-soon');
            }
            
            taskDueDate.innerHTML = `<i class="fas fa-calendar-alt"></i> ${formattedDate} ${formattedTime}`;
            taskMeta.appendChild(taskDueDate);
        }
        
        // Tags
        if (task.tags.length > 0) {
            const taskTags = document.createElement('div');
            taskTags.className = 'task-tags';
            
            task.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = tag;
                taskTags.appendChild(tagSpan);
            });
            
            taskMeta.appendChild(taskTags);
        }
        
        taskContent.appendChild(taskText);
        taskContent.appendChild(taskMeta);
        
        // Botões de ação
        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'task-action-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.setAttribute('aria-label', 'Editar tarefa');
        editBtn.addEventListener('click', () => openEditModal(task));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-action-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.setAttribute('aria-label', 'Excluir tarefa');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                deleteTask(task.id);
            }
        });
        
        taskActions.appendChild(editBtn);
        taskActions.appendChild(deleteBtn);
        
        // Adicionar elementos à tarefa
        taskItem.appendChild(taskCheckbox);
        taskItem.appendChild(taskContent);
        taskItem.appendChild(taskActions);
        
        tasksList.appendChild(taskItem);
    });
}

function updateTagFilters() {
    // Coletar todas as tags únicas
    const allTags = new Set();
    tasks.forEach(task => {
        task.tags.forEach(tag => allTags.add(tag));
    });
    
    // Limpar lista de filtros de tags
    tagFilterList.innerHTML = '';
    
    // Adicionar tags como filtros
    allTags.forEach(tag => {
        const tagFilter = document.createElement('span');
        tagFilter.className = 'tag-filter';
        if (selectedTags.includes(tag)) {
            tagFilter.classList.add('active');
        }
        tagFilter.textContent = tag;
        tagFilter.addEventListener('click', () => toggleTagFilter(tag));
        tagFilterList.appendChild(tagFilter);
    });
}

function toggleTagFilter(tag) {
    const tagIndex = selectedTags.indexOf(tag);
    if (tagIndex === -1) {
        selectedTags.push(tag);
    } else {
        selectedTags.splice(tagIndex, 1);
    }
    updateCurrentViewTitle();
    renderTasks();
    updateTagFilters();
}

function openEditModal(task) {
    editTaskId.value = task.id;
    editTaskText.value = task.text;
    editTaskDueDate.value = task.dueDate || '';
    editTaskTags.value = task.tags.join(', ');
    editModal.style.display = 'flex';
    editTaskText.focus();
}

// Toast de confirmação
function showToastConfirm() {
    const toast = document.getElementById('toast-confirm');
    if (!toast) return;
    toast.style.display = 'flex';
    toast.style.animation = 'toastFadeIn 0.4s forwards';
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.4s forwards';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 400);
    }, 1200);
}

// Funções de armazenamento local
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    // Carregar tarefas
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    // Carregar preferências de acessibilidade
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        document.body.classList.add(`font-size-${savedFontSize}`);
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${savedTheme}`);
        
        if (savedTheme === 'dark') {
            toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    // Carregar estado da barra lateral
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState === 'true') {
        sidebar.classList.add('collapsed');
        sidebarCollapsed = true;
    }
}
