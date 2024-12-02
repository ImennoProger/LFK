import { NextResponse } from 'next/server';
import { verifyToken } from '../../utils/auth';
import client from '../../../../../backend/db';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Отсутствует токен авторизации' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
        }

        // Получаем данные пользователя из базы данных
        const result = await client.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        const user = result.rows[0];

        if (!user) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Токен действителен', user });
    } catch (error) {
        console.error('Ошибка при проверке токена:', error);
        return NextResponse.json({ error: 'Ошибка при проверке токена' }, { status: 500 });
    }
}
