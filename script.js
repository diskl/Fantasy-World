// Загружаем сохраненных пользователей при запуске
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;
let pendingUser = null;
let isVerifying = false;

// Функция сохранения пользователей
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
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
    const uploadForm = document.querySelector('.upload-mod-form');
    const loginSection = document.getElementById('вход');
    const registerSection = document.getElementById('регистрация');

    if (isLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
        uploadForm.style.display = 'block';
        loginSection.style.display = 'none';
        registerSection.style.display = 'none';
    } else {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
        uploadForm.style.display = 'none';
        loginSection.style.display = 'block';
        registerSection.style.display = 'block';
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
document.getElementById('uploadModForm').addEventListener('submit', function(e) {
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

    const newMod = {
        id: Date.now(),
        name: modName,
        version: modVersion,
        description: modDescription,
        fileName: modFile.name,
        uploadDate: new Date().toLocaleDateString(),
        author: currentUser.username
    };

    mods.push(newMod);
    displayMods();
    e.target.reset();
    alert('Мод успешно загружен!');
});

// Обновляем функцию отображения модов
function displayMods() {
    const modsListElement = document.getElementById('modsList');
    modsListElement.innerHTML = '';

    mods.forEach(mod => {
        const modElement = document.createElement('div');
        modElement.className = 'mod-card';
        modElement.innerHTML = `
            <h4>${mod.name}</h4>
            <div class="mod-info">
                <p>Версия Minecraft: ${mod.version}</p>
                <p>Описание: ${mod.description}</p>
                <p>Автор: ${mod.author}</p>
                <p>Дата загрузки: ${mod.uploadDate}</p>
            </div>
            <button class="download-btn" onclick="downloadMod(${mod.id})">Скачать мод</button>
        `;
        modsListElement.appendChild(modElement);
    });
}

// Инициализация при загрузке страницы
checkAuth();
displayMods(); 