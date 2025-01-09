const express = require('express');
const app = express();
const path = require('path');

// Разрешаем доступ к статическим файлам
app.use(express.static(path.join(__dirname)));

// Отправляем index.html для всех маршрутов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
}); 