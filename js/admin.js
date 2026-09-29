const EVENTS_KEY = 'buhlo_events_data';
const ADMIN_KEY = 'buhlo_admin_password';
const ADMIN_SESSION_KEY = 'buhlo_admin_logged_in';
const DEFAULT_ADMIN_PASSWORD = 'лена';

// GitHub API configuration
const GITHUB_OWNER = 'Dimazm-coder';
const GITHUB_REPO = 'Release_A1';
const GITHUB_TOKEN = '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';
const GITHUB_API_URL = 'https://api.github.com/repos';

let appEvents = [];
let editingEventId = null;

function ensureAdminPassword() {
    if (!localStorage.getItem(ADMIN_KEY)) {
        localStorage.setItem(ADMIN_KEY, DEFAULT_ADMIN_PASSWORD);
    }
}

function getCurrentPassword() {
    ensureAdminPassword();
    return localStorage.getItem(ADMIN_KEY) || DEFAULT_ADMIN_PASSWORD;
}

function showDashboard() {
    document.getElementById('auth-block').classList.add('hidden');
    document.getElementById('topbar').classList.remove('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

function showAuth() {
    document.getElementById('auth-block').classList.remove('hidden');
    document.getElementById('topbar').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function checkAdminLogin() {
    const value = document.getElementById('admin-password').value.trim();
    if (value === getCurrentPassword()) {
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
        showDashboard();
        loadEvents();
    } else {
        document.getElementById('admin-error').style.display = 'block';
    }
}

function logoutAdmin() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-error').style.display = 'none';
    showAuth();
}

function getDefaultEvents() {
    return [
        {
            id: 1,
            title: 'Пятничный сбор',
            date: '2026-10-03',
            time: '19:00',
            location: 'Наше стандартное место / беседки',
            description: 'Еженедельный сбор компании для хорошего настроения',
            participants: [],
            maxParticipants: 50
        },
        {
            id: 2,
            title: 'Глобальный выезд на Нёман',
            date: '2026-07-17',
            time: '09:00',
            location: 'р. Неман',
            description: 'Ежегодный эпический выезд: лодки, палатки, казаны, хорошее настроение',
            participants: [],
            maxParticipants: 30
        }
    ];
}

function getSavedEvents() {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(getDefaultEvents()));
        return getDefaultEvents();
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : (parsed.events || getDefaultEvents());
    } catch (error) {
        return getDefaultEvents();
    }
}

async function loadEvents() {
    appEvents = getSavedEvents();

    try {
        const response = await fetch('../data/events.json');
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.events)) {
                appEvents = data.events;
                localStorage.setItem(EVENTS_KEY, JSON.stringify(appEvents));
            }
        }
    } catch (error) {
        console.log('No file fetch, using localStorage');
    }

    renderEvents();
}

function renderEvents() {
    const list = document.getElementById('events-list');
    if (!list) return;

    if (!appEvents.length) {
        list.innerHTML = '<div class="empty">События пока не добавлены.</div>';
        return;
    }

    list.innerHTML = appEvents.map(event => {
        const participants = Array.isArray(event.participants) ? event.participants : [];
        const dateText = event.date ? formatDate(event.date) : 'Дата не указана';
        return `
            <div class="event-item">
                <h4>${event.title}</h4>
                <p>${event.description || 'Описание отсутствует'}</p>
                <div class="event-meta">
                    <span class="tag">${dateText}</span>
                    <span class="tag">${event.time || 'Время не указано'}</span>
                    <span class="tag">${event.location || 'Место не указано'}</span>
                    <span class="tag">${participants.length}/${event.maxParticipants || 30}</span>
                </div>
                <div class="event-actions">
                    <button type="button" onclick="editEvent(${event.id})">Редактировать</button>
                    <button type="button" class="danger" onclick="deleteEvent(${event.id})">Удалить</button>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function saveEvent() {
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const location = document.getElementById('event-location').value.trim();
    const description = document.getElementById('event-description').value.trim();
    const limit = Number(document.getElementById('event-limit').value) || 30;

    if (!title || !date) {
        alert('Заполните название и дату события');
        return;
    }

    if (editingEventId !== null) {
        const idx = appEvents.findIndex(item => item.id === editingEventId);
        if (idx >= 0) {
            appEvents[idx] = {
                ...appEvents[idx],
                title,
                date,
                time,
                location: location || appEvents[idx].location || 'Место не указано',
                description: description || appEvents[idx].description || 'Описание события скоро появится.',
                maxParticipants: limit
            };
        }
    } else {
        appEvents.unshift({
            id: Date.now(),
            title,
            date,
            time,
            location: location || 'Место не указано',
            description: description || 'Описание события скоро появится.',
            participants: [],
            maxParticipants: limit
        });
    }

    localStorage.setItem(EVENTS_KEY, JSON.stringify(appEvents));
    renderEvents();
    resetForm();
}

function editEvent(eventId) {
    const event = appEvents.find(item => item.id === eventId);
    if (!event) return;

    editingEventId = eventId;
    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-date').value = event.date || '';
    document.getElementById('event-time').value = event.time || '';
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-description').value = event.description || '';
    document.getElementById('event-limit').value = event.maxParticipants || 30;

    const actionsButton = document.querySelector('.admin-actions button');
    if (actionsButton) {
        actionsButton.textContent = 'Обновить событие';
    }
}

function deleteEvent(eventId) {
    if (!confirm('Удалить событие?')) return;
    appEvents = appEvents.filter(item => item.id !== eventId);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(appEvents));
    renderEvents();
    if (editingEventId === eventId) {
        resetForm();
    }
}

function resetForm() {
    editingEventId = null;
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-location').value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-limit').value = 30;

    const actionsButton = document.querySelector('.admin-actions button');
    if (actionsButton) {
        actionsButton.textContent = 'Сохранить событие';
    }
}

function downloadEventsJson() {
    const data = JSON.stringify({ events: appEvents }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importEventsJson(input) {
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const parsed = JSON.parse(event.target.result);
            const items = Array.isArray(parsed) ? parsed : parsed.events;
            if (!Array.isArray(items)) {
                throw new Error('Некорректный формат JSON');
            }
            appEvents = items;
            localStorage.setItem(EVENTS_KEY, JSON.stringify(appEvents));
            renderEvents();
            alert('JSON успешно импортирован');
        } catch (error) {
            alert('Ошибка импорта: ' + error.message);
        }
        input.value = '';
    };
    reader.readAsText(file);
}

// GitHub API Functions
async function getFileFromGitHub(filePath) {
    try {
        const response = await fetch(`${GITHUB_API_URL}/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: atob(data.content),
            sha: data.sha
        };
    } catch (error) {
        console.error('Error fetching from GitHub:', error);
        throw error;
    }
}

async function updateFileInGitHub(filePath, content, message) {
    try {
        // First get the current file to get its SHA
        const fileData = await getFileFromGitHub(filePath);
        const sha = fileData.sha;

        const response = await fetch(`${GITHUB_API_URL}/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                content: btoa(content),
                sha: sha
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to update: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating GitHub:', error);
        throw error;
    }
}

async function loadEventsFromGitHub() {
    try {
        const statusEl = document.getElementById('github-status');
        if (statusEl) statusEl.textContent = 'Загрузка...';

        const fileData = await getFileFromGitHub('events.json');
        const parsed = JSON.parse(fileData.content);
        
        appEvents = Array.isArray(parsed) ? parsed : (parsed.events || getDefaultEvents());
        localStorage.setItem(EVENTS_KEY, JSON.stringify(appEvents));
        renderEvents();

        if (statusEl) {
            statusEl.textContent = '✅ События загружены из GitHub';
            setTimeout(() => statusEl.textContent = '', 3000);
        }
        alert('✅ События успешно загружены из GitHub!');
    } catch (error) {
        console.error('Error:', error);
        if (statusEl) statusEl.textContent = '❌ Ошибка загрузки';
        alert('❌ Ошибка при загрузке из GitHub: ' + error.message);
    }
}

async function saveEventsToGitHub() {
    try {
        const statusEl = document.getElementById('github-status');
        if (statusEl) statusEl.textContent = 'Сохранение...';

        const content = JSON.stringify({ events: appEvents }, null, 2);
        await updateFileInGitHub('events.json', content, 'Update events from admin panel');

        if (statusEl) {
            statusEl.textContent = '✅ События сохранены в GitHub';
            setTimeout(() => statusEl.textContent = '', 3000);
        }
        alert('✅ События успешно сохранены в GitHub репозиторий!');
    } catch (error) {
        console.error('Error:', error);
        if (statusEl) statusEl.textContent = '❌ Ошибка сохранения';
        alert('❌ Ошибка при сохранении в GitHub: ' + error.message);
    }
}

async function savePasswordToGitHub(newPassword) {
    try {
        const statusEl = document.getElementById('password-github-status');
        if (statusEl) statusEl.textContent = 'Сохранение пароля...';

        // Read current main.js
        const fileData = await getFileFromGitHub('js/main.js');
        let content = fileData.content;

        // Replace password in the file
        content = content.replace(
            /const DEFAULT_ADMIN_PASSWORD = '[^']*';/,
            `const DEFAULT_ADMIN_PASSWORD = '${newPassword}';`
        );

        await updateFileInGitHub('js/main.js', content, 'Update admin password');

        if (statusEl) {
            statusEl.textContent = '✅ Пароль сохранён в GitHub';
            setTimeout(() => statusEl.textContent = '', 3000);
        }
        alert('✅ Пароль успешно сохранён в GitHub!');
    } catch (error) {
        console.error('Error:', error);
        if (statusEl) statusEl.textContent = '❌ Ошибка сохранения';
        alert('❌ Ошибка при сохранении пароля в GitHub: ' + error.message);
    }
}

function changeAdminPassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageBox = document.getElementById('password-message');

    if (!currentPassword || !newPassword || !confirmPassword) {
        messageBox.textContent = 'Заполните все поля';
        messageBox.classList.remove('hidden');
        return;
    }

    if (currentPassword !== getCurrentPassword()) {
        messageBox.textContent = 'Текущий пароль введён неверно';
        messageBox.classList.remove('hidden');
        return;
    }

    if (newPassword.length < 3) {
        messageBox.textContent = 'Новый пароль должен быть не короче 3 символов';
        messageBox.classList.remove('hidden');
        return;
    }

    if (newPassword !== confirmPassword) {
        messageBox.textContent = 'Новый пароль и подтверждение не совпадают';
        messageBox.classList.remove('hidden');
        return;
    }

    // Save to localStorage first
    localStorage.setItem(ADMIN_KEY, newPassword);
    messageBox.textContent = 'Пароль успешно изменён локально. Сохраняю в GitHub...';
    messageBox.classList.remove('hidden');

    // Save to GitHub
    savePasswordToGitHub(newPassword);

    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

document.addEventListener('DOMContentLoaded', function () {
    ensureAdminPassword();
    const isAdmin = localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    if (isAdmin) {
        showDashboard();
        loadEvents();
    }
});
