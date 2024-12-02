import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    user: 'postgres', // Замените на ваше имя пользователя
    host: 'localhost',
    database: 'LFK', // Замените на имя вашей базы данных
    password: 'root', // Замените на ваш пароль
    port: 5432,
});

// Используем именованный экспорт для метода GET
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bodyPartFilter = searchParams.get('bodyPart');
    const courseCountFromFilter = searchParams.get('courseCountFrom');
    const courseCountToFilter = searchParams.get('courseCountTo');

    let query = `
        WITH ranked_recommendations AS (
            SELECT 
                ur.id,
                ur.body_part_id,
                ur.symptom_id,
                ur.created_at,
                bp.name AS body_part,
                s.name AS symptom,
                e.name AS exercise,
                n.name AS nutrition,
                r.duration,
                LAG(ur.created_at) OVER (PARTITION BY ur.body_part_id, ur.symptom_id ORDER BY ur.created_at) AS prev_created_at
            FROM user_recommendations ur
            JOIN recommendations r ON ur.recommendation_id = r.id
            JOIN body_parts bp ON r.body_part_id = bp.id
            JOIN symptoms s ON r.symptom_id = s.id
            JOIN exercises e ON r.exercise_id = e.id
            JOIN nutrition n ON r.nutrition_id = n.id
        ),
        filtered_recommendations AS (
            SELECT 
                body_part,
                symptom,
                exercise,
                nutrition,
                duration,
                CASE 
                    WHEN prev_created_at IS NULL OR EXTRACT(EPOCH FROM (created_at - prev_created_at)) >= 2 THEN 1
                    ELSE 0
                END AS is_new_course
            FROM ranked_recommendations
        )
        SELECT 
            body_part,
            symptom,
            STRING_AGG(DISTINCT exercise, ', ') AS exercises,
            STRING_AGG(DISTINCT nutrition, ', ') AS nutrition,
            MIN(duration) AS duration,
            SUM(is_new_course) AS course_count
        FROM filtered_recommendations
        GROUP BY body_part, symptom
    `;

    const conditions = [];
    const values = [];

    if (bodyPartFilter) {
        conditions.push(`body_part = ANY(string_to_array($${conditions.length + 1}, ','))`);
        values.push(bodyPartFilter);
    }
    if (courseCountFromFilter) {
        conditions.push(`SUM(is_new_course) >= $${conditions.length + 1}`);
        values.push(courseCountFromFilter);
    }
    if (courseCountToFilter) {
        conditions.push(`SUM(is_new_course) <= $${conditions.length + 1}`);
        values.push(courseCountToFilter);
    }

    if (conditions.length > 0) {
        query += ` HAVING ` + conditions.join(' AND ');
    }

    console.log('Executing query:', query, 'with values:', values); // Логируем запрос и значения

    try {
        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
