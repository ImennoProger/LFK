"use client"
import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { useRouter } from 'next/navigation';
import '../../styles/admin.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Filter {
    dateFrom: string;
    dateTo: string;
    gender: string;
    bodyParts: string[];
    courseCountFrom: string;
    courseCountTo: string;
}

const AdminPanel: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('patients');
    const [patientsData, setPatientsData] = useState<any[]>([]); // Состояние для хранения данных пациентов
    const [filteredData, setFilteredData] = useState<any[]>([]); // Состояние для хранения отфильтрованных данных
    const [genderData, setGenderData] = useState<{ labels: string[]; datasets: { data: number[]; backgroundColor: string[] }[] }>({ labels: [], datasets: [] });
    const [ageData, setAgeData] = useState<{ labels: string[]; datasets: { data: number[]; backgroundColor: string[] }[] }>({ labels: [], datasets: [] });
    const [filter, setFilter] = useState<Filter>({
        dateFrom: '',
        dateTo: '',
        gender: 'Все',
        bodyParts: [],
        courseCountFrom: '',
        courseCountTo: '',
    });
    const [statisticsData, setStatisticsData] = useState<any[]>([]);
    const [isBodyPartsOpen, setIsBodyPartsOpen] = useState(false); // Состояние для управления раскрытием
    const [userCoursesData, setUserCoursesData] = useState<any[]>([]);
    const [courseFilter, setCourseFilter] = useState({
        startDateFrom: '',
        startDateTo: '',
        endDateFrom: '',
        endDateTo: '',
        painStartFrom: '',
        painStartTo: '',
        painEndFrom: '',
        painEndTo: '',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [displayLimit, setDisplayLimit] = useState(5);

    const bodyPartsOptions = [
        { value: 'Стопа', label: 'Стопа' },
        { value: 'Передние мышцы голени', label: 'Передние мышцы голени' },
        { value: 'Колено', label: 'Колено' },
        { value: 'Передние мышцы бедра', label: 'Передние мышцы бедра' },
        { value: 'Кисть', label: 'Кисть' },
        { value: 'Прямые мышцы живота', label: 'Прямые мышцы живота' },
        { value: 'Предплечье', label: 'Предплечье' },
        { value: 'Косые мышцы живота', label: 'Косые мышцы живота' },
        { value: 'Трицепс', label: 'Трицепс' },
        { value: 'Бицепс', label: 'Бицепс' },
        { value: 'Зубчатые мышцы', label: 'Зубчатые мышцы' },
        { value: 'Грудь', label: 'Грудь' },
        { value: 'Дельта (Плечо)', label: 'Дельта (Плечо)' },
        { value: 'Шея', label: 'Шея' },
        { value: 'Трапеция', label: 'Трапеция' },
        { value: 'Голова', label: 'Голова' }
    ];

    useEffect(() => {
        const fetchPatientsData = async () => {
            const response = await fetch('/api/patients');
            if (response.ok) {
                const data = await response.json();
                const filteredPatients = data.filter((patient: { user_id: string | number }) => Number(patient.user_id) !== 1);
                setPatientsData(filteredPatients);
                setFilteredData(filteredPatients); // Изначально показываем все отфильтрованные данные
                calculateGenderData(filteredPatients);
                calculateAgeData(filteredPatients);
            } else {
                console.error('Ошибка при загрузке данных пациентов');
            }
        };

        if (activeTab === 'patients') {
            fetchPatientsData();
        }
    }, [activeTab]);

    useEffect(() => {
        const fetchStatisticsData = async () => {
            const params = new URLSearchParams();
            
            // Добавляем фильтр по частям тела
            if (filter.bodyParts.length > 0) {
                params.append('bodyPart', filter.bodyParts.join(','));
            }
            
            // Добавляем фильтр по количеству курсов
            if (filter.courseCountFrom) {
                params.append('courseCountFrom', filter.courseCountFrom);
            }
            if (filter.courseCountTo) {
                params.append('courseCountTo', filter.courseCountTo);
            }

            try {
                const response = await fetch(`/api/statistics?${params.toString()}`, {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Полученные данные:', data);
                    setStatisticsData(data);
                } else {
                    const errorData = await response.json();
                    console.error('Ошибка при загрузке статистики:', errorData);
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
            }
        };

        if (activeTab === 'statistics') {
            fetchStatisticsData();
        }
    }, [activeTab, filter]);

    useEffect(() => {
        const fetchUserCoursesData = async () => {
            try {
                const response = await fetch('/api/user-recommendations');
                if (response.ok) {
                    const data = await response.json();

                    const filteredCourses = data.filter((course: any) => {
                        // Исключаем записи, где full_name содержит "Админ"
                        return !course.full_name.includes('Админ');
                    });

                    setUserCoursesData(filteredCourses);
                    updateChartsData(filteredCourses);
                }
            } catch (error) {
                console.error('Ошибка при выполнении запроса:', error);
            }
        };

        if (activeTab === 'completed') {
            fetchUserCoursesData();
        }
    }, [activeTab]);

    const calculateGenderData = (data: any[]) => {
        const maleCount = data.filter(patient => patient.gender === 'Мужской').length;
        const femaleCount = data.filter(patient => patient.gender === 'Женский').length;
        setGenderData({
            labels: ['Мужской', 'Женский'],
            datasets: [
                {
                    data: [maleCount, femaleCount],
                    backgroundColor: ['#3498db', '#e74c3c'],
                },
            ],
        });
    };

    const calculateAgeData = (data: any[]) => {
        const ageGroups = {
            '0-10 лет': 0,
            '11-20 лет': 0,
            '21-30 лет': 0,
            '31-40 лет': 0,
            '41-50 лет': 0,
            '51+ лет': 0,
        };

        data.forEach(patient => {
            const age = new Date().getFullYear() - new Date(patient.birth_date).getFullYear();
            if (age <= 10) ageGroups['0-10 лет']++;
            else if (age <= 20) ageGroups['11-20 лет']++;
            else if (age <= 30) ageGroups['21-30 лет']++;
            else if (age <= 40) ageGroups['31-40 лет']++;
            else if (age <= 50) ageGroups['41-50 лет']++;
            else ageGroups['51+ лет']++;
        });

        setAgeData({
            labels: Object.keys(ageGroups) as string[],
            datasets: [
                {
                    data: Object.values(ageGroups) as number[],
                    backgroundColor: ['#9b59b6', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#34495e'],
                },
            ],
        });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        let filtered = patientsData;

        // Фильтрация по полу
        if (filter.gender !== 'Все') {
            filtered = filtered.filter(patient => patient.gender === filter.gender);
        }

        // Фильтрация по дате
        if (filter.dateFrom) {
            filtered = filtered.filter(patient => new Date(patient.birth_date) >= new Date(filter.dateFrom));
        }
        if (filter.dateTo) {
            filtered = filtered.filter(patient => new Date(patient.birth_date) <= new Date(filter.dateTo));
        }

        setFilteredData(filtered);
    };

    useEffect(() => {
        applyFilters();
    }, [filter, patientsData]);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFilter(prev => {
            const newBodyParts = checked
                ? [...prev.bodyParts, value] // Добавляем часть тела, если чекбокс отмечен
                : prev.bodyParts.filter(part => part !== value); // Удаляем часть тела, если чекбокс снят
            return { ...prev, bodyParts: newBodyParts };
        });
    };

    const updateChartsData = (data: any[]) => {
        // Фильтрация курсов, где есть текущая оценка боли
        const completedCourses = data.filter(course => course.pain_end !== undefined && course.pain_end !== null);

        // Подсчет средней оценки боли до и после курса
        const avgPainBefore = completedCourses.length > 0 
            ? completedCourses.reduce((sum, course) => sum + course.pain_start, 0) / completedCourses.length
            : 0;
        
        const avgPainAfter = completedCourses.length > 0
            ? completedCourses.reduce((sum, course) => sum + course.pain_end, 0) / completedCourses.length
            : 0;

        setGenderData({
            labels: ['Средняя оценка боли до курса', 'Средняя оценка боли после курса'],
            datasets: [{
                data: [avgPainBefore, avgPainAfter],
                backgroundColor: ['#e74c3c', '#2ecc71'],
            }],
        });

        // Группировка по степени улучшения
        const painReductionGroups = {
            'Значительное улучшение (>5)': 0,
            'Хорошее улучшение (3-5)': 0,
            'Умеренное улучшение (1-2)': 0,
            'Без изменений (0)': 0,
            'Ухудшение (<0)': 0
        };

        completedCourses.forEach(course => {
            const improvement = course.pain_start - course.pain_end;
            
            if (improvement > 5) {
                painReductionGroups['Значительное улучшение (>5)']++;
            } else if (improvement >= 3) {
                painReductionGroups['Хорошее улучшение (3-5)']++;
            } else if (improvement >= 1) {
                painReductionGroups['Умеренное улучшение (1-2)']++;
            } else if (improvement === 0) {
                painReductionGroups['Без изменений (0)']++;
            } else {
                painReductionGroups['Ухудшение (<0)']++;
            }
        });

        setAgeData({
            labels: Object.keys(painReductionGroups),
            datasets: [{
                data: Object.values(painReductionGroups),
                backgroundColor: [
                    '#2ecc71', // зеленый для значительного улучшения
                    '#27ae60', // темно-зеленый для хорошего улучшения
                    '#f1c40f', // желтый для умеренного улучшения
                    '#95a5a6', // серый для отсутствия изменений
                    '#e74c3c'  // красный для ухудшения
                ]
            }]
        });
    };

    const handleCourseFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCourseFilter(prev => ({ ...prev, [name]: value }));
    };

    const applyCourseFilters = () => {
        let filtered = userCoursesData;

        // Фильтрация по дате начала курса
        if (courseFilter.startDateFrom) {
            filtered = filtered.filter(course => new Date(course.start_date) >= new Date(courseFilter.startDateFrom));
        }
        if (courseFilter.startDateTo) {
            filtered = filtered.filter(course => new Date(course.start_date) <= new Date(courseFilter.startDateTo));
        }

        // Фильтрация по дате окончания курса
        if (courseFilter.endDateFrom) {
            filtered = filtered.filter(course => new Date(course.end_date) >= new Date(courseFilter.endDateFrom));
        }
        if (courseFilter.endDateTo) {
            filtered = filtered.filter(course => new Date(course.end_date) <= new Date(courseFilter.endDateTo));
        }

        // Фильтрация по оценке боли в начале курса
        if (courseFilter.painStartFrom) {
            filtered = filtered.filter(course => course.pain_start >= parseInt(courseFilter.painStartFrom));
        }
        if (courseFilter.painStartTo) {
            filtered = filtered.filter(course => course.pain_start <= parseInt(courseFilter.painStartTo));
        }

        // Филь��рация по текущей оценке боли
        if (courseFilter.painEndFrom) {
            filtered = filtered.filter(course => course.pain_end >= parseInt(courseFilter.painEndFrom));
        }
        if (courseFilter.painEndTo) {
            filtered = filtered.filter(course => course.pain_end <= parseInt(courseFilter.painEndTo));
        }

        return filtered;
    };

    const filteredCoursesData = applyCourseFilters();

    const handleShowMore = () => {
        setDisplayLimit(prevLimit => prevLimit + 10);
    };

    // Добавляем проверку авторизации при загрузке страницы
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const response = await fetch('/api/verify-token', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    localStorage.removeItem('token');
                    router.push('/login');
                }
            } catch (error) {
                console.error('Ошибка при проверке токена:', error);
                localStorage.removeItem('token');
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    return (
        <div className="container">
            <nav className="sidebar">
                <h2>ЛФК Центр</h2>
                <div>
                    <h3>Анализ результатов ЛФК</h3>
                    <ul>
                        <li onClick={() => setActiveTab('patients')}>Анализ пациентов</li>
                        <li onClick={() => setActiveTab('statistics')}>Статистика ЛФК курсов</li>
                        <li onClick={() => setActiveTab('completed')}>Анализ курсов пациентов</li>
                    </ul>
                </div>
            </nav>
            <main className="main-content">
                <div className="header-block">
                    <h1>Админ-панель</h1>
                    <button onClick={() => router.push('/')} className="home-button">На главную</button>
                </div>

                {activeTab === 'patients' && (
                    <>
                        <h2>Анализ пациентов</h2>
                        <div className="filter">
                            <label htmlFor="date-from">С:</label>
                            <input type="date" id="date-from" name="dateFrom" value={filter.dateFrom} onChange={handleFilterChange} />
                            <label htmlFor="date-to">До:</label>
                            <input type="date" id="date-to" name="dateTo" value={filter.dateTo} onChange={handleFilterChange} />
                            <label htmlFor="gender">Пол:</label>
                            <select id="gender" name="gender" value={filter.gender} onChange={handleFilterChange}>
                                <option>Все</option>
                                <option>Мужской</option>
                                <option>Женский</option>
                            </select>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ФИО</th>
                                    <th>Дата рождения</th>
                                    <th>Номер телефона</th>
                                    <th>Адрес электронной почты</th>
                                    <th>Пол</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.slice(0, displayLimit).map((patient, index) => (
                                        <tr key={patient.user_id || index}>
                                            <td>{`${patient.first_name} ${patient.last_name}`}</td>
                                            <td>{new Date(patient.birth_date).toLocaleDateString('ru-RU')}</td>
                                            <td>{patient.phone}</td>
                                            <td>{patient.email}</td>
                                            <td>{patient.gender}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5}>Нет данных для отображения</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {filteredData.length > displayLimit && (
                            <button 
                                onClick={handleShowMore}
                                className="show-more-button"
                                style={{
                                    margin: '20px 0',
                                    padding: '8px 16px',
                                    backgroundColor: '#42CDEA',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Показать ещё
                            </button>
                        )}
                        <div className="charts">
                            <div className="chart-container">
                                <h3>Соотношение полов</h3>
                                <div className="chart">
                                    <Pie data={genderData} />
                                </div>
                            </div>
                            <div className="chart-container">
                                <h3>Соотношение возрастов пациентов</h3>
                                <div className="chart">
                                    <Pie data={ageData} />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'results' && <h2>Анализ результатов ЛФК</h2>}
                {activeTab === 'statistics' && (
                    <>
                        <h2>Статистика ЛФК курсов</h2>
                        <div className="filter" style={{ position: 'relative' }}>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsBodyPartsOpen(prev => !prev);
                                }} 
                                style={{ 
                                    cursor: 'pointer',
                                    padding: '8px 16px',
                                    backgroundColor: '#42CDEA',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                Часть тела ▼
                            </button>
                            {isBodyPartsOpen && (
                                <div 
                                    ref={(node) => {
                                        if (node) {
                                            const handleClickOutside = (e: MouseEvent) => {
                                                if (node && !node.contains(e.target as Node)) {
                                                    setIsBodyPartsOpen(false);
                                                }
                                            };
                                            document.addEventListener('click', handleClickOutside);
                                            return () => {
                                                document.removeEventListener('click', handleClickOutside);
                                            };
                                        }
                                    }}
                                    style={{ 
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        zIndex: 1,
                                        width: '200px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        marginTop: '0px',
                                        padding: '8px 0'
                                    }}
                                >
                                    <input 
                                        type="text" 
                                        placeholder="Поиск..." 
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            boxSizing: 'border-box' 
                                        }} 
                                    />
                                    {bodyPartsOptions
                                        .filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(option => (
                                            <div 
                                                key={option.value}
                                                style={{
                                                    padding: '8px 16px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <label style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        value={option.value}
                                                        checked={filter.bodyParts.includes(option.value)}
                                                        onChange={handleCheckboxChange}
                                                        style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                    {option.label}
                                                </label>
                                            </div>
                                        ))}
                                </div>
                            )}
                            <label htmlFor="course-count-from">Количество курсов от:</label>
                            <input 
                                type="number" 
                                id="course-count-from"
                                name="courseCountFrom" 
                                min="0" 
                                value={filter.courseCountFrom} 
                                onChange={e => setFilter(prev => ({ ...prev, courseCountFrom: e.target.value }))} 
                                style={{ width: '40px', marginLeft: '-15px' }} // Уменьшение ширины
                            />
                            <label htmlFor="course-count-to"> до:</label>
                            <input 
                                type="number" 
                                id="course-count-to" 
                                name="courseCountTo" 
                                min="0" 
                                value={filter.courseCountTo} 
                                onChange={e => setFilter(prev => ({ ...prev, courseCountTo: e.target.value }))} 
                                style={{ width: '40px', marginLeft: '-15px' }} // Уменьшение ширины
                            />
                        </div>
                        <div className="statistics-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Часть тела</th>
                                        <th>Симптомы</th>
                                        <th>Рекомендуемые упражнения</th>
                                        <th>Рекомендуемое питание и витамины</th>
                                        <th>Рекомендуемая продолжительность курса</th>
                                        <th>Количество курсов</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statisticsData.slice(0, displayLimit).map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.body_part}</td>
                                            <td>{item.symptom}</td>
                                            <td>{item.exercises}</td>
                                            <td>{item.nutrition}</td>
                                            <td>{item.duration}</td>
                                            <td>{item.course_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {statisticsData.length > displayLimit && (
                                <button 
                                    onClick={handleShowMore}
                                    className="show-more-button"
                                    style={{
                                        margin: '20px 0',
                                        padding: '8px 16px',
                                        backgroundColor: '#42CDEA',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Показать ещё
                                </button>
                            )}
                        </div>
                    </>
                )}
                {activeTab === 'completed' && (
                    <>
                        <h2>Анализ курсов пациентов</h2>
                        <div className="filter">
                            <label htmlFor="startDateFrom">Дата начала курса</label>
                            <label htmlFor="startDateFrom">от</label>
                            <input 
                                type="date" 
                                id="startDateFrom"
                                name="startDateFrom" 
                                value={courseFilter.startDateFrom} 
                                onChange={handleCourseFilterChange}
                                title="Выберите начальную дату начала курса" 
                            />
                            <label htmlFor="startDateFrom">до</label>
                            <input 
                                type="date" 
                                id="startDateTo"
                                name="startDateTo" 
                                value={courseFilter.startDateTo}
                                onChange={handleCourseFilterChange}
                                title="Выберите конечную дату начала курса"
                            />
                            <label htmlFor="endDateFrom">Окончание курса</label>
                            <label htmlFor="endDateFrom">от</label>
                            <input 
                                type="date" 
                                name="endDateFrom" 
                                value={courseFilter.endDateFrom} 
                                onChange={handleCourseFilterChange}
                                title="Выберите начальную дату окончания курса"
                            />
                            <label htmlFor="endDateTo">до</label>
                            <input 
                                type="date" 
                                name="endDateTo" 
                                value={courseFilter.endDateTo} 
                                onChange={handleCourseFilterChange}
                                title="Выберите конечную дату окончания курса"
                            />
                            <div style={{ marginTop: '20px' }}></div>
                            <div className="pain-filter-group" style={{ display: 'flex', gap: '20px' }}>
                                <div className="pain-filter-item">
                                    <span className="pain-label">Оценка боли в начале:</span>
                                    <div className="pain-inputs">
                                        <input 
                                            type="number"
                                            name="painStartFrom"
                                            min="0"
                                            max="10"
                                            value={courseFilter.painStartFrom}
                                            onChange={handleCourseFilterChange} 
                                            title="Введите минимальное значение начальной оценки боли"
                                            className="pain-input"
                                            placeholder="От"
                                        />
                                        <span className="pain-separator">—</span>
                                        <input
                                            type="number"
                                            name="painStartTo"
                                            min="0" 
                                            max="10"
                                            value={courseFilter.painStartTo}
                                            onChange={handleCourseFilterChange}
                                            title="Введите максимальное значение начальной оценки боли"
                                            className="pain-input"
                                            placeholder="До"
                                        />
                                    </div>
                                </div>

                                <div className="pain-filter-item">
                                    <span className="pain-label">Оценка боли в конце курса:</span>
                                    <div className="pain-inputs">
                                        <input
                                            type="number" 
                                            name="painEndFrom"
                                            min="0"
                                            max="10"
                                            value={courseFilter.painEndFrom}
                                            onChange={handleCourseFilterChange}
                                            title="Введите минимальное значение текущей оценки боли"
                                            className="pain-input"
                                            placeholder="От"
                                        />
                                        <span className="pain-separator">—</span>
                                        <input
                                            type="number"
                                            name="painEndTo"
                                            min="0"
                                            max="10" 
                                            value={courseFilter.painEndTo}
                                            onChange={handleCourseFilterChange}
                                            title="Введите максимальное значение текущей оценки боли"
                                            className="pain-input"
                                            placeholder="До"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ФИО</th>
                                    <th>Дата начала курса</th>
                                    <th>Дата окончания курса</th>
                                    <th>Оценка боли в начале курса</th>
                                    <th>Текущая оценка боли</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCoursesData.slice(0, displayLimit).map((course, index) => (
                                    <tr key={index}>
                                        <td style={{ width: '15%' }}>{course.full_name}</td>
                                        <td style={{ width: '15%' }}>{new Date(course.start_date).toLocaleDateString('ru-RU')}</td>
                                        <td style={{ width: '15%' }}>
                                            {course.end_date 
                                                ? new Date(course.end_date).toLocaleDateString('ru-RU')
                                                : '—'}
                                        </td>
                                        <td style={{ width: '11%' }}>{course.pain_start}</td>
                                        <td style={{ width: '10%' }}>{course.pain_end ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredCoursesData.length > displayLimit && (
                            <button 
                                onClick={handleShowMore}
                                className="show-more-button"
                                style={{
                                    margin: '20px 0',
                                    padding: '8px 16px',
                                    backgroundColor: '#42CDEA',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Показать ещё
                            </button>
                        )}
                        <div className="charts">
                            <div className="chart-container">
                                <h3>Общая оценка боли до и после курса</h3>
                                <div className="chart">
                                    <Pie data={genderData} />
                                </div>
                            </div>
                            <div className="chart-container" style={{ width: '50%', height: '400px', margin: '0 auto' }}>
                                <h3>Распределение групп пациентов по степени уменьшения боли</h3>
                                <div className="chart" style={{ height: '100%' }}>
                                    <Bar 
                                        data={ageData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        stepSize: 1
                                                    }
                                                }
                                            },
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(context) {
                                                            return `Количество пациентов: ${context.raw}`;
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;