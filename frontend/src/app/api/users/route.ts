import { NextResponse } from 'next/server';
import client from '../../../../../backend/db'; // Убедитесь, что путь к вашему клиенту правильный
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
    const { action, firstName, lastName, phone, email, gender, birthDate, password } = await req.json();

    if (action === 'register') {
        // Регистрация пользователя
        if (!firstName || !lastName || !phone || !email || !password) {
            return NextResponse.json({ error: 'Все поля обязательны для заполнения' }, { status: 400 });
        }

        try {
            const result = await client.query(
                'INSERT INTO users (first_name, last_name, phone, email, gender, birth_date, password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [firstName, lastName, phone, email, gender, birthDate, password]
            );
            return NextResponse.json(result.rows[0], { status: 201 });
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('Ошибка при регистрации пользователя', err.stack);
                // Проверяем конкретные ошибки PostgreSQL
                if (err.message.includes('users_email_key')) {
                    return NextResponse.json({ error: 'email_exists' }, { status: 400 });
                } else if (err.message.includes('users_phone_key')) {
                    return NextResponse.json({ error: 'phone_exists' }, { status: 400 });
                }
                return NextResponse.json({ error: err.message }, { status: 400 });
            }
            console.error('Неизвестная ошибка', err);
            return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
        }
    } else if (action === 'login') {
        // Логика для логина пользователя
        if (!email || !password) {
            return NextResponse.json({ error: 'Email и пароль обязательны для входа' }, { status: 400 });
        }

        try {
            const result = await client.query(
                'SELECT * FROM users WHERE email = $1 AND password = $2',
                [email, password]
            );

            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Неверные учетные данные' }, { status: 401 });
            }

            const user = result.rows[0];
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

            return NextResponse.json({
                user,
                token
            }, { status: 200 });
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('Ошибка при входе пользователя', err.stack);
                return NextResponse.json({ error: err.message }, { status: 500 });
            }
            console.error('Неизвестная ошибка', err);
            return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
    }
}

// Если вы хотите обработать другие методы, добавьте их аналогично
export async function GET(req: Request) {
    // Логика для обработки GET-запроса
}
