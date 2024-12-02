import { Client } from 'pg'; // Для TypeScript

const client = new Client({
    user: 'postgres', // замените на ваше имя пользователя 
    host: 'localhost', // или IP-адрес вашего сервера
    database: 'LFK', // имя вашей базы данных
    password: 'root', // замените на ваш пароль
    port: 5432, // порт по умолчанию для PostgreSQL
});

client.connect()
    .then(() => console.log('Подключение к базе данных успешно!'))
    .catch((err: Error) => console.error('Ошибка подключения к базе данных', err.stack));

// Экспортируйте клиент
export default client;
