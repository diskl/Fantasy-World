const express = require('express');
const app = express();
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Создаем транспорт для отправки email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ваш.email@gmail.com',        // Ваш Gmail адрес
        pass: 'xxxxxxxxxxxxxx'              // Пароль приложения, который вы получили
    }
});

// Хранилище временных кодов
const verificationCodes = new Map();

// Генерация случайного кода
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000);
}

// API для отправки кода подтверждения
app.post('/api/send-code', async (req, res) => {
    const { email } = req.body;
    const code = generateCode();
    
    const mailOptions = {
        from: 'ваш.email@gmail.com',
        to: email,
        subject: 'Код подтверждения Fantasy World',
        text: `Ваш код подтверждения: ${code}`
    };

    try {
        await transporter.sendMail(mailOptions);
        verificationCodes.set(email, {
            code: code.toString(),
            timestamp: Date.now()
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка отправки email:', error);
        res.status(500).json({ error: 'Ошибка отправки кода' });
    }
});

// API для проверки кода
app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
        return res.status(400).json({ error: 'Код не найден' });
    }
    
    if (Date.now() - storedData.timestamp > 300000) { // 5 минут
        verificationCodes.delete(email);
        return res.status(400).json({ error: 'Код устарел' });
    }
    
    if (storedData.code !== code) {
        return res.status(400).json({ error: 'Неверный код' });
    }
    
    verificationCodes.delete(email);
    res.json({ success: true });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
}); 