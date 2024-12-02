import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'LFK',
    password: 'root',
    port: 5432,
});

export async function GET(request: Request) {
    // Получаем токен из заголовка
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    try {
        // Извлекаем токен и декодируем его
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
        const userId = decoded.userId;

        const result = await pool.query(`
            WITH ranked_recommendations AS (
                SELECT 
                    ur.id,
                    ur.body_part_id,
                    ur.symptom_id,
                    ur.created_at,
                    ur.start_date,
                    ur.pain_start,
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
                WHERE ur.user_id = $1
            ),
            course_groups AS (
                SELECT *,
                    SUM(CASE 
                        WHEN prev_created_at IS NULL OR EXTRACT(EPOCH FROM (created_at - prev_created_at)) >= 2 THEN 1
                        ELSE 0
                    END) OVER (PARTITION BY body_part_id, symptom_id ORDER BY created_at) AS course_group
                FROM ranked_recommendations
            )
            SELECT 
                body_part,
                STRING_AGG(DISTINCT symptom, ', ') AS symptoms,
                STRING_AGG(DISTINCT exercise, ', ') AS exercises,
                STRING_AGG(DISTINCT nutrition, ', ') AS nutrition,
                MIN(duration) AS duration,
                MIN(start_date) AS start_date,
                MIN(pain_start) AS pain_start,
                COUNT(DISTINCT course_group) AS course_count
            FROM course_groups
            GROUP BY body_part, course_group
        `, [userId]);

        console.log('Query result:', result.rows);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}