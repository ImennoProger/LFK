import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Создаем пул соединений с базой данных
const pool = new Pool({
    user: 'postgres', // Замените на ваше имя пользователя
    host: 'localhost',
    database: 'LFK', // Замените на имя вашей базы данных
    password: 'root', // Замените на ваш пароль
    port: 5432,
});

// Эндпоинт для получения данных пациентов
export async function GET() {
    try {
        const result = await pool.query(`
            SELECT users.id AS user_id, users.first_name, users.last_name, users.phone, users.email, users.gender, users.birth_date
            FROM users
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении данных пациентов:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
