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

// Эндпоинт для получения рекомендаций
export async function POST(req: Request) {
    const { bodyPart, symptoms, userId } = await req.json();

    try {
        // Получаем id части тела
        const bodyPartResult = await pool.query('SELECT id FROM body_parts WHERE name = $1', [bodyPart]);
        const bodyPartId = bodyPartResult.rows[0]?.id;

        if (!bodyPartId) {
            return NextResponse.json({ error: 'Часть тела не найдена' }, { status: 400 });
        }

        // Получаем id симптомов
        const symptomIds = await Promise.all(symptoms.map(async (symptom: string) => {
            const result = await pool.query('SELECT id FROM symptoms WHERE name = $1', [symptom]);
            return result.rows[0]?.id;
        }));

        // Получаем рекомендации на основе части тела и симптомов
        const recommendationsQuery = `
            SELECT r.duration, e.name AS exercise, n.name AS nutrition, n.description AS nutrition_description, r.symptom_id, r.id AS recommendation_id
            FROM recommendations r
            JOIN exercises e ON r.exercise_id = e.id
            JOIN nutrition n ON r.nutrition_id = n.id
            WHERE r.body_part_id = $1 AND r.symptom_id = ANY($2)
        `;

        const recommendationsResult = await pool.query(recommendationsQuery, [bodyPartId, symptomIds]);

        // Отладочный вывод
        console.log('Результаты рекомендаций:', recommendationsResult.rows);

        // Формируем ответ
        const uniqueNutrition = new Map();
        recommendationsResult.rows.forEach(row => {
            if (!uniqueNutrition.has(row.nutrition)) {
                uniqueNutrition.set(row.nutrition, row.nutrition_description);
            }
        });

        const recommendations = {
            duration: recommendationsResult.rows[0]?.duration || 'Не указано',
            exercises: recommendationsResult.rows.map(row => row.exercise),
            nutrition: Array.from(uniqueNutrition.entries()).map(([name, description]) => ({ name, description })),
        };

        // Записываем выбор пользователя в таблицу user_recommendations
        if (userId) {
            await Promise.all(recommendationsResult.rows.map(async (row) => {
                await pool.query(
                    'INSERT INTO user_recommendations (user_id, body_part_id, symptom_id, recommendation_id, created_at) VALUES ($1, $2, $3, $4, NOW())',
                    [userId, bodyPartId, row.symptom_id, row.recommendation_id]
                );
            }));
        }

        return NextResponse.json(recommendations);
    } catch (error) {
        console.error('Ошибка при получении рекомендаций:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
