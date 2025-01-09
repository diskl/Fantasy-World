// Загружаем сохраненных пользователей при запуске
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;
let pendingUser = null;
let isVerifying = false;

// Добавим массив для хранения модов
let mods = JSON.parse(localStorage.getItem('mods')) || [];

// Функция сохранения пользователей
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Функция сохранения модов
function saveMods() {
    localStorage.setItem('mods', JSON.stringify(mods));
}

// Функция проверки авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        const actualUsers = JSON.parse(localStorage.getItem('users')) || [];
        const actualUser = actualUsers.find(u => u.id === currentUser.id);
        if (actualUser) {
            updateAuthUI(true);
        } else {
            logout();
        }
    } else {
        updateAuthUI(false);
    }
}

// Функция обновления интерфейса в зависимости от авторизации
function updateAuthUI(isLoggedIn) {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const changePasswordLink = document.getElementById('changePasswordLink');
    const uploadForm = document.querySelector('.upload-mod-form');
    const loginSection = document.getElementById('вход');
    const registerSection = document.getElementById('регистрация');
    const changePasswordSection = document.getElementById('смена-пароля');

    if (isLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
        changePasswordLink.style.display = 'block';
        uploadForm.style.display = 'block';
        loginSection.style.display = 'none';
        registerSection.style.display = 'none';
        changePasswordSection.style.display = 'none';
    } else {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
        changePasswordLink.style.display = 'none';
        uploadForm.style.display = 'none';
        loginSection.style.display = 'block';
        registerSection.style.display = 'block';
        changePasswordSection.style.display = 'none';
    }
}

// Функция отправки кода подтверждения
async function sendVerificationCode(email) {
    try {
        const response = await fetch('/api/send-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка отправки кода');
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка:', error);
        return false;
    }
}

// Функция проверки кода
async function verifyCode() {
    const code = document.getElementById('verificationCode').value;
    
    try {
        const response = await fetch('/api/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: pendingUser.email,
                code: code
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (isVerifying) {
                // Завершаем регистрацию
                users.push(pendingUser);
                saveUsers();
                currentUser = pendingUser;
                localStorage.setItem('currentUser', JSON.stringify(pendingUser));
                alert('Регистрация успешна! Добро пожаловать, ' + pendingUser.username);
            } else {
                // Завершаем вход
                currentUser = pendingUser;
                localStorage.setItem('currentUser', JSON.stringify(pendingUser));
                alert('Вход выполнен успешно! Добро пожаловать, ' + pendingUser.username);
            }
            
            document.getElementById('verificationForm').style.display = 'none';
            updateAuthUI(true);
            window.location.hash = '#главная';
        } else {
            alert('Неверный код подтверждения');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка проверки кода');
    }
}

// Обработчик формы входа
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateAuthUI(true);
        alert('Добро пожаловать, ' + user.username + '!');
        window.location.hash = '#главная';
    } else {
        alert('Неверный email или пароль');
    }
});

// Добавляем функцию выхода
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI(false);
    window.location.hash = '#главная';
}

// Обновляем обработчик выхода
document.getElementById('logoutLink').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
});

// Обработчик регистрации
document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        alert('Пароли не совпадают!');
        return;
    }
    
    if (users.some(u => u.email === email)) {
        alert('Пользователь с таким email уже существует!');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        registrationDate: new Date().toLocaleDateString()
    };
    
    users.push(newUser);
    saveUsers();
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    alert('Регистрация успешна! Добро пожаловать, ' + username);
    updateAuthUI(true);
    window.location.hash = '#главная';
});

// Обновляем обработчик формы загрузки мода
document.getElementById('uploadModForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Для загрузки модов необходимо войти в аккаунт!');
        window.location.hash = '#вход';
        return;
    }
    
    const modName = document.getElementById('modName').value;
    const modVersion = document.getElementById('modVersion').value;
    const modDescription = document.getElementById('modDescription').value;
    const modFile = document.getElementById('modFile').files[0];

    if (!modFile) {
        alert('Выберите файл мода!');
        return;
    }

    if (!modFile.name.endsWith('.jar')) {
        alert('Можно загружать только .jar файлы!');
        return;
    }

    const newMod = {
        id: Date.now(),
        name: modName,
        version: modVersion,
        description: modDescription,
        fileName: modFile.name,
        uploadDate: new Date().toLocaleDateString(),
        author: currentUser.username,
        downloads: 0
    };

    try {
        const response = await fetch('/api/mods', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newMod)
        });

        if (response.ok) {
            displayMods();
            e.target.reset();
            alert('Мод успешно загружен!');
        } else {
            alert('Ошибка при загрузке мода');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при загрузке мода');
    }
});

// Функция отображения модов
async function displayMods() {
    try {
        const response = await fetch('/api/mods');
        const modsData = await response.json();
        
        const modsListElement = document.getElementById('modsList');
        modsListElement.innerHTML = '';

        modsData.forEach(mod => {
            const modElement = document.createElement('div');
            modElement.className = 'mod-card';
            modElement.innerHTML = `
                <h4>${mod.name}</h4>
                <div class="mod-info">
                    <p>Версия Minecraft: ${mod.version}</p>
                    <p>Описание: ${mod.description}</p>
                    <p>Автор: ${mod.author}</p>
                    <p>Дата загрузки: ${mod.uploadDate}</p>
                    <p>Скачиваний: ${mod.downloads}</p>
                </div>
                <button class="download-btn" onclick="downloadMod(${mod.id})">Скачать мод</button>
            `;
            modsListElement.appendChild(modElement);
        });
    } catch (error) {
        console.error('Ошибка загрузки модов:', error);
    }
}

// Функция скачивания мода
function downloadMod(modId) {
    const mod = mods.find(m => m.id === modId);
    if (mod) {
        mod.downloads++;
        saveMods();
        displayMods();
        alert(`Начинается скачивание мода: ${mod.name}`);
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    checkAuth();
    displayMods();
});

// Добавим обработчик формы смены пароля
document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Необходимо войти в аккаунт');
        return;
    }
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Проверяем текущий пароль
    if (currentPassword !== currentUser.password) {
        alert('Неверный текущий пароль');
        return;
    }
    
    // Проверяем совпадение новых паролей
    if (newPassword !== confirmNewPassword) {
        alert('Новые пароли не совпадают');
        return;
    }
    
    // Обновляем пароль пользователя
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        currentUser.password = newPassword;
        
        // Сохраняем изменения
        saveUsers();
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        alert('Пароль успешно изменен');
        document.getElementById('changePasswordForm').reset();
        window.location.hash = '#главная';
    }
});

// Добавим обработчик клика по ссылке смены пароля
document.getElementById('changePasswordLink').addEventListener('click', function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Необходимо войти в аккаунт');
        return;
    }
    
    const changePasswordSection = document.getElementById('смена-пароля');
    const sections = document.querySelectorAll('section');
    
    // Скрываем все секции
    sections.forEach(section => section.style.display = 'none');
    
    // Показываем форму смены пароля
    changePasswordSection.style.display = 'block';
}); 