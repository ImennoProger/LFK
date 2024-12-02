"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/global.css';

// Определение интерфейса User
interface User {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    gender: string;
    birthDate: string;
    // Добавьте другие поля, если необходимо
}

const UserCourses: React.FC = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'актуальные' | 'пройденные'>('актуальные');
    const [painRatings, setPainRatings] = useState<{ [key: string]: number }>({});
    const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/verify-token', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            })
            .catch(() => setUser(null));
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('Токен не найден');
                    return;
                }

                const response = await fetch('/api/user-courses', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Полученные данные:', data);
                    setCourses(data);
                } else {
                    console.error('Ошибка при загрузке курсов:', response.statusText);
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
            }
        };

        fetchCourses();
    }, [user]);

    const handleStartCourse = async (bodyPartName: string) => {
        console.log('handleStartCourse вызван для:', bodyPartName); // Отладочное сообщение
        const painStart = painRatings[bodyPartName];
        console.log('Оценка боли для', bodyPartName, ':', painStart); // Отладочное сообщение

        if (!painStart) {
            console.log('Ошибка: оценка боли не введена'); // Отладочное сообщение
            setErrorMessages((prevMessages) => ({
                ...prevMessages,
                [bodyPartName]: 'Пожалуйста, оцените боль в поле ниже.'
            }));
            return;
        }

        // Очистка сообщения об ошибке, если оценка боли введена
        setErrorMessages((prevMessages) => ({
            ...prevMessages,
            [bodyPartName]: ''
        }));

        try {
            const response = await fetch('/api/start-course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id,
                    bodyPartName,
                    painStart,
                }),
            });

            if (response.ok) {
                console.log('Курс успешно начат');
                // Обновление состояния курсов
                setCourses((prevCourses) =>
                    prevCourses.map((course) =>
                        course.body_part === bodyPartName
                            ? { ...course, start_date: new Date().toISOString(), pain_start: painStart } // Обновите нужные поля
                            : course
                    )
                );
            } else {
                console.error('Ошибка при начале курса:', response.statusText);
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
        }
    };

    console.log('Компонент UserCourses рендерится'); // Отладочное сообщение

    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Пожалуйста, войдите в систему или зарегистрируйтесь, чтобы просмотреть ваши курсы.</p>
                <button 
                    onClick={() => router.push('/')} 
                    style={{ 
                        backgroundColor: '#42CDEA', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '10px 15px', 
                        borderRadius: '5px', 
                        cursor: 'pointer' 
                    }}
                >
                    Регистрация | Вход
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#F0F4F8', color: '#000', minHeight: '100vh', position: 'relative', display: 'flex' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ textAlign: 'left', color: '#000000', marginLeft: '20px' }}>Ваши курсы</h1>
                <button onClick={() => router.push('/')} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#42CDEA', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px' }}>
                    На главную
                </button>
                <div style={{ 
                    border: '2px solid #F0F4F8',
                    borderRadius: '20px',
                    padding: '20px',
                    backgroundColor: '#F0F4F8'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <button onClick={() => setActiveTab('актуальные')} style={{ marginRight: '10px', backgroundColor: activeTab === 'актуальные' ? '#42CDEA' : '#10415F', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px' }}>
                            Актуальные
                        </button>
                        <button onClick={() => setActiveTab('пройденные')} style={{ backgroundColor: activeTab === 'пройденные' ? '#42CDEA' : '#10415F', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px' }}>
                            Пройденные
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                        {activeTab === 'актуальные' ? (
                            <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                                {courses.length > 0 ? (
                                    courses.map((course, index) => (
                                        <li key={`${course.body_part}-${index}`} style={{ 
                                            border: '1px solid #42CDEA', 
                                            borderRadius: '15px', 
                                            padding: '20px',
                                            backgroundColor: '#2c3e50',
                                            flex: '1 1 auto',
                                            height: '150px',
                                            position: 'relative'
                                        }}>
                                            <h2 style={{ margin: '0 0 10px', color: '#42CDEA' }}>Курс: {course.body_part}</h2>
                                            <p style={{ margin: '0', color: '#fff' }}>Симптомы: {course.symptoms}</p>
                                            <p style={{ margin: '0', color: '#fff' }}>Упражнения: {course.exercises}</p>
                                            <p style={{ margin: '0', color: '#fff' }}>Питание: {course.nutrition}</p>
                                            <p style={{ margin: '0', color: '#fff' }}>Продолжительность: {course.duration}</p>
                                            {course.start_date ? (
                                                <button
                                                    style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        right: '20px',
                                                        transform: 'translateY(-50%)',
                                                        backgroundColor: '#42CDEA',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '15px 30px',
                                                        borderRadius: '5px',
                                                        cursor: 'default'
                                                    }}
                                                    disabled
                                                >
                                                    Курс начат {new Date(course.start_date).toLocaleDateString()}
                                                </button>
                                            ) : (
                                                <button
                                                    style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        right: '20px',
                                                        transform: 'translateY(-50%)',
                                                        backgroundColor: '#42CDEA',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '15px 30px',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => {
                                                        console.log('Кнопка нажата для:', course.body_part); // Отладочное сообщение
                                                        handleStartCourse(course.body_part);
                                                    }}
                                                >
                                                    Начать курс
                                                </button>
                                            )}
                                            {errorMessages[course.body_part] && (
                                                <p style={{ color: 'red', marginTop: '-5px', marginBottom: '20px', textAlign: 'right' }}>
                                                    {errorMessages[course.body_part]}
                                                </p>
                                            )}
                                            <div style={{ margin: '10px 0', color: '#fff', position: 'absolute', bottom: '10px', right: '20px' }}>
                                                {course.start_date ? (
                                                    <span>Оценка боли: {course.pain_start}</span>
                                                ) : (
                                                    <label>
                                                        Оцените боль в начале своего курса от 1 до 10:
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            value={painRatings[course.body_part] || ''}
                                                            onChange={(e) => setPainRatings({
                                                                ...painRatings,
                                                                [course.body_part]: Number(e.target.value)
                                                            })}
                                                            style={{ marginLeft: '10px', width: '50px' }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <p style={{ color: '#000' }}>Нет доступных курсов.</p>
                                )}
                            </ul>
                        ) : (
                            <p style={{ textAlign: 'left', color: '#000' }}>Здесь будут пройденные курсы.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserCourses;
