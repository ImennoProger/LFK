import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'LFK',
    password: 'root',
    port: 5432,
});

export async function GET(request: Request) {
    try {
        const result = await pool.query(`
            WITH ranked_recommendations AS (
                SELECT 
                    ur.id,
                    ur.user_id,
                    ur.body_part_id,
                    ur.symptom_id,
                    ur.created_at,
                    ur.start_date,
                    ur.end_date,
                    ur.pain_start,
                    ur.pain_end,
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
                    user_id,
                    body_part,
                    symptom,
                    exercise,
                    nutrition,
                    duration,
                    start_date,
                    end_date,
                    pain_start,
                    pain_end,
                    CASE 
                        WHEN prev_created_at IS NULL OR EXTRACT(EPOCH FROM (created_at - prev_created_at)) >= 2 THEN 1
                        ELSE 0
                    END AS is_new_course
                FROM ranked_recommendations
            )
            SELECT 
                CONCAT(u.first_name, ' ', u.last_name) as full_name,
                body_part,
                symptom,
                STRING_AGG(DISTINCT exercise, ', ') AS exercises,
                STRING_AGG(DISTINCT nutrition, ', ') AS nutrition,
                MIN(duration) AS duration,
                MIN(start_date) AS start_date,
                MAX(end_date) AS end_date,
                MIN(pain_start) AS pain_start,
                MAX(pain_end) AS pain_end,
                SUM(is_new_course) AS course_count
            FROM filtered_recommendations fr
            JOIN users u ON fr.user_id = u.id
            GROUP BY u.first_name, u.last_name, body_part, symptom
            ORDER BY start_date DESC;
        `);

        console.log('Результат запроса:', result.rows);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
