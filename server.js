const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

// Разрешаем доступ к статическим файлам
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Создаем папку для хранения модов, если её нет
const modsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir);
}

// Хранилище модов (в реальном проекте должно быть в базе данных)
let mods = [];
const modsFile = path.join(__dirname, 'mods.json');

// Загружаем моды при запуске сервера
if (fs.existsSync(modsFile)) {
    mods = JSON.parse(fs.readFileSync(modsFile, 'utf8'));
}

// API для получения списка модов
app.get('/api/mods', (req, res) => {
    res.json(mods);
});

// API для добавления мода
app.post('/api/mods', (req, res) => {
    const newMod = req.body;
    mods.push(newMod);
    fs.writeFileSync(modsFile, JSON.stringify(mods));
    res.json({ success: true, mod: newMod });
});

// API для удаления мода
app.delete('/api/mods/:id', (req, res) => {
    const modId = parseInt(req.params.id);
    const index = mods.findIndex(mod => mod.id === modId);
    
    if (index !== -1) {
        mods.splice(index, 1);
        fs.writeFileSync(modsFile, JSON.stringify(mods));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Мод не найден' });
    }
});

// Отправляем index.html для всех остальных маршрутов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
}); 