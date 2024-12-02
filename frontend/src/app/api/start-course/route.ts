import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    user: 'postgres', // Замените на ваше имя пользователя
    host: 'localhost',
    database: 'LFK', // Замените на имя вашей базы данных
    password: 'root', // Замените на ваш пароль
    port: 5432,
});

export async function POST(request: Request) {
    const { userId, bodyPartName, painStart } = await request.json();

    if (!userId || !bodyPartName || painStart === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        // Получаем ID части тела по названию
        const bodyPartResult = await pool.query(`
            SELECT id FROM body_parts WHERE name = $1
        `, [bodyPartName]);

        if (bodyPartResult.rows.length === 0) {
            return NextResponse.json({ error: 'Body part not found' }, { status: 404 });
        }

        const bodyPartId = bodyPartResult.rows[0].id;

        // Обновляем запись в user_recommendations
        const result = await pool.query(`
            UPDATE user_recommendations
            SET pain_start = $1, start_date = NOW()
            WHERE user_id = $2 AND body_part_id = $3
        `, [painStart, userId, bodyPartId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Ошибка при обновлении записи:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}