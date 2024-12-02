'use client';

import { User, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import '../styles/header.css';    // Для стилей хедера
import '../styles/global.css';     // Добавьте этот импорт для глобальных стилей
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Polygon = { points: string; fill: string; stroke: string; onClick?: () => void };

const symptomsList = [
  "Тянущая боль", "Ноющая боль", "Отёк", "Спазмы", "Ограничение движений"
];

// Обновление списка симптомов в зависимости от выбранной части тела
const getSymptomsForBodyPart = (bodyPart: string) => {
    return symptomsList;
};

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

export default function Page() {
  const router = useRouter();
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{ exercises: string[]; nutrition: string[]; duration: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null); // Указываем тип для user
  const [exercises, setExercises] = useState<string[]>([]); // Состояние для хранения упражнений
  const [nutrition, setNutrition] = useState<{ name: string; description: string }[]>([]); // Состояние для хранения питания
  const [duration, setDuration] = useState<string>("1 месяц"); // Состояние для хранения продолжительности курса

  useEffect(() => {
    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        console.log('Токен из localStorage:', token); // Проверяем токен при загрузке

        if (token) {
            try {
                const response = await fetch('/api/verify-token', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                console.log('Ответ от сервера:', data); // Проверяем ответ

                if (response.ok && data.user) {
                    setUser(data.user);
                } else {
                    console.log('Токен недействителен'); // Логируем ошибку
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } catch (error) {
                console.error('Ошибка при проверке токена:', error);
                localStorage.removeItem('token');
                setUser(null);
            }
        }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchPolygons = async () => {
      const response = await fetch('/api/points');
      const data = await response.json();
      console.log(data);
      setPolygons(data);
    };

    fetchPolygons();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('User ID:', user.id, 'Type:', typeof user.id);
    }
  }, [user]);

  const handlePolygonClick = (bodyPart: string, index: number) => {
    console.log(`Выбран полигон с индексом: ${index}`);
    setSelectedBodyPart(bodyPart);
    setIsModalOpen(true);
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const updateRecommendations = async () => {
    if (selectedBodyPart && selectedSymptoms.length > 0) {
        let exercisesSet = new Set<string>();
        let nutritionSet = new Set<string>();
        let duration = "1 месяц"; // По умолчанию

        try {
            const response = await fetch('/api/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bodyPart: selectedBodyPart,
                    symptoms: selectedSymptoms,
                    userId: user?.id, // Передаем userId, если пользователь залогинен
                }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при получении рекомендаций');
            }

            const data = await response.json();

            // Отладочный вывод
            console.log('Полученные данные:', data);

            // Обработка полученных данных
            duration = data.duration; // Устанавливаем продолжительность курса
            data.exercises.forEach((exercise: string) => exercisesSet.add(exercise));
            data.nutrition.forEach((nutrient: { name: string; description: string }) => {
                nutritionSet.add(JSON.stringify(nutrient));
            });

            const nutritionArray = Array.from(nutritionSet).map(nutrition => JSON.parse(nutrition));

            setNutrition(nutritionArray);
            setExercises(Array.from(exercisesSet));
            setDuration(duration); // Убедитесь, что вы сохраняете продолжительность курса

        } catch (error) {
            console.error('Ошибка при обновлении рекомендаций:', error);
        }
    }
  };

  const handleConfirm = () => {
    console.log("Выбранные симптомы:", selectedSymptoms);
    setIsModalOpen(false);
    setSelectedSymptoms([]); // Сбросить выбранные симптомы после подтверждения
    setSelectedBodyPart(null);
    
    // Обновление рекомендаций
    updateRecommendations();

    // Прокрутка до раздела рекомендаций
    const recommendationsSection = document.getElementById('recommendations');
    if (recommendationsSection) {
        recommendationsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBodyPart(null); // Сбросить выбранную часть тела при закрытии
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const openRegistrationModal = () => {
    setIsLoginModalOpen(false);
    setIsRegistrationModalOpen(true);
  };

  const textMapping: { [key: number]: string } = {
    0: "Стопа", 1: "Стопа", 2: "Стопа", 3: "Стопа",
    4: "Передние мышцы голени", 5: "Передние мышцы голени", 6: "Передние мышцы голени", 7: "Передние мышцы голени",
    8: "Передние мышцы голени", 9: "Передние мышцы голени", 10: "Передние мышцы голени", 11: "Передние мышцы голени",
    12: "Передние мышцы голени", 13: "Передние мышцы голени", 14: "Передние мышцы голени", 15: "Передние мышцы голени",
    16: "Колено", 17: "Колено",
    18: "Передние мышцы бедра", 19: "Передние мышцы бедра", 20: "Передние мышцы бедра", 21: "Передние мышцы бедра",
    22: "Передние мышцы бедра", 23: "Передние мышцы бедра", 24: "Передние мышцы бедра", 25: "Передние мышцы бедра",
    26: "Передние мшцы бедра", 27: "Передние мышцы бедра", 28: "Кисть", 29: "Кисть", 30: "Кисть",
    31: "Кисть", 32: "Кисть", 33: "Кисть", 34: "Кисть", 35: "Кисть", 36: "Передние мышцы бедра", 
    37: "Передние мышцы бедра", 38: "Кисть", 39: "Кисть", 40: "Кисть", 41: "Кисть",
    42: "Прямые мышцы живота", 43: "Прямые мышцы живота", 44: "Предплечье", 45: "Предплечье", 46: "Предплечье",
    47: "Предплечье", 48: "Предплечье", 49: "Предплечье", 50: "Косые мышцы живота", 51: "Косые мышцы живота", 52: "Прямые мышцы живота", 53: "Прямые мышцы живота",
    54: "Косые мышцы живота", 55: "Косые мышцы живота", 56: "Косые мышцы живота", 57: "Косые мышцы живота",
    58: "Прямые мышцы живота", 59: "Прямые мышцы живота", 60: "Трицепс", 61: "Трицепс",
    62: "Косые мышцы живота", 63: "Косые мышцы живота", 64: "Прямые мышцы живота", 65: "Прямые мышцы живота",
    66: "Бицепс", 67: "Бицепс", 68: "Зубчатые мышцы", 69: "Зубчатые мышцы", 70: "Косые мышцы живота",
    71: "Косые мышцы живота", 72: "Зубчатые ышцы", 73: "Зубчатые мышцы", 74: "Зубчатые мышцы",
    75: "Зубчатые мышцы", 76: "Грудь", 77: "Грудь", 78: "Дельта (Плечо)", 79: "Дельта (Плечо)",
    80: "Шея", 81: "Шея", 82: "Шея", 83: "Шея", 84: "Трапеция", 85: "Трапеция",
    86: "Шея", 87: "Голова", 89: "Стопы", 90: "Стопы", 91: "Задние мышцы голени", 92: "Задние мышцы голени",
    93: "Задние мышцы голени", 94: "Задние мышцы голени", 95: "Задние мышцы голени", 96: "Задние мышцы голени",
    97: "Задние мышцы голени", 98: "Задние мышцы голени", 99: "Задние мышцы бедра", 100: "Задние мышцы бедра",
    102: "Задние мышцы бедра", 103: "Задние мышцы бедра", 104: "Задние мышцы бедра", 105: "Задние мышцы бедра",
    106: "Задние мышцы бедра", 107: "Задние мышцы бедра", 108: "Задние мышцы бедра", 109: "Кисть",
    110: "Кисть", 111: "Кисть", 112: "Кисть", 113: "Кисть", 114: "Кисть", 115: "Кисть",
    116: "Кисть", 117: "Ягодичная мышца", 118: "Ягодичная мышца", 119: "Кисть", 120: "Кисть",
    121: "Кисть", 122: "Кисть", 123: "Предплечье", 124: "Предплечье", 125: "Предплечье", 126: "Предплечье",
    127: "Предплечье", 128: "Предплечье", 129: "Ягодичная мышца", 130: "Ягодичная мышца", 131: "Грудопоясничная мышца",
    132: "Грудопоясничная мышца", 133: "Внутренняя косая мышца живота", 134: "Внутренняя косая мышца живота",
    135: "Широчайшая мышца", 136: "Широчайшая мышца", 137: "Локоть", 138: "Локоть", 139: "Трицепс",
    140: "Трицепс", 141: "Трицепс", 142: "Трицепс", 143: "Трапецевидная мышца", 144: "Трапецевидная мышца",
    145: "Трицепс", 146: "Трицепс", 147: "Подостная мышца", 148: "Подостная мышца", 149: "Дельта (Плечо)",
    150: "Подостная мышца", 151: "Подостная мышца", 152: "Дельта (Плечо)", 153: "Затылок", 154: "Затылок"
  };

  const exerciseGifs: { [key: string]: string } = {
    "Упражнение на растяжку стопы": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на расслабление стопы": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Подъем на носки": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на поднятие ног": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость стопы": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упражнение на растяжку колена": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Растяжка квадрицепса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на баланс": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость колена": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упражнение на растяжку голени": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на расслабление голени": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на укрепление голени": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость голени": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упражнение на растяжку бедра": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Растяжка передних мышц бедра": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на укрепление бедра": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость бедра": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упражнение на расслабление кисти": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на укрепление кисти": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на растяжку кисти": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость кисти": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упражнение на укрепление пресса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Планка": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на растяжку живота": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на расслабление живота": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость живота": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упражнение на расслабление трицепса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на укрепление трицепса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на растяжку трицепса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость трицепса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упражнение на растяжку бицепса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на расслабление бицепса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость бицепса": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упражнение на растяжку груди": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на расслабление груди": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Отжимания": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость груди": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    
    "Упажнение на расслабление шеи": "https://i.pinimg.com/originals/85/8c/33/858c33f12117cd8ac5b064b232a6ab49.gif",
    "Упражнение на растяжку шеи": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Упражнение на гибкость шеи": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
    "Повороты головы": "https://i.pinimg.com/originals/49/63/96/496396be8507894805138c6a13fec7fc.gif",
};

  const handleRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    const formData = {
        firstName: form.firstName.value,
        lastName: form.lastName.value,
        phone: form.phone.value,
        email: form.email.value,
        gender: form.gender.value,
        birthDate: form.birthDate.value,
        password: form.password.value,
    };

    const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'register', ...formData }),
    });

    if (response.ok) {
        const user = await response.json();
        console.log('Пользователь зарегистрирован:', user);
        setIsRegistrationModalOpen(false);
    } else {
        const error = await response.json();
        console.error('Ошибка регистрации:', error);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    const loginData = {
        email: form.email.value,
        password: form.password.value,
    };

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'login', ...loginData }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Данные после логина:', data); // Проверяем данные
            localStorage.setItem('token', data.token);
            console.log('Токен сохранен:', localStorage.getItem('token')); // Проверяем сохранение
            setUser(data.user);
            setIsLoginModalOpen(false);
        } else {
            console.error('Ошибка входа');
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 0, fontFamily: "'Nunito', sans-serif", fontWeight: 300 }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#FFFFFF', color: '#10415F', marginBottom: 0, fontFamily: "'Nunito', sans-serif", textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, textRendering: 'optimizeLegibility', textAlign: 'center', marginTop: '-8px' }}>ЛФК центр</span>
        </div>
        <nav style={{ display: 'flex', gap: '30px', textAlign: 'center' }}>
          {['Витамины', 'Консультация', 'Физические упражнения', 'Питание'].map((category) => (
            <Link key={category} href={`/${category.toLowerCase()}`} style={{ color: '#10415F', textDecoration: 'none', fontWeight: 700, textRendering: 'optimizeLegibility', textAlign: 'center' }}>
              {category}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
          <Link href="/help" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10415F', fontWeight: 800, backgroundColor: 'transparent', border: 'none', textAlign: 'center', textDecoration: 'none' }}>
            <HelpCircle size={20} />
            <span style={{ textRendering: 'optimizeLegibility', textAlign: 'center', fontSize: '0.875rem' }}>Помощь</span>
          </Link>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {Number(user.id) === 1 && (
                <Link 
                  href="/admin"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    color: 'white', 
                    fontWeight: 800, 
                    backgroundColor: '#FF6B6B',
                    border: 'none', 
                    borderRadius: '20px', 
                    padding: '7px 18px', 
                    fontSize: '1.25rem', 
                    textDecoration: 'none',
                    cursor: 'pointer',
                    zIndex: 1000
                  }}
                >
                  Админ-панель
                </Link>
              )}
              <Link 
                href="/user-courses"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: 'white', 
                  fontWeight: 800, 
                  backgroundColor: '#4CAF50',
                  border: 'none', 
                  borderRadius: '20px', 
                  padding: '7px 18px', 
                  fontSize: '1.25rem', 
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Мои курсы
              </Link>
              <span style={{ color: '#10415F', fontWeight: 700 }}>
                Добро пожаловать, {user.first_name}!
              </span>
              <button 
                onClick={handleLogout} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: 'white', 
                  fontWeight: 800, 
                  backgroundColor: '#42CDEA', 
                  border: 'none', 
                  borderRadius: '20px', 
                  padding: '7px 18px', 
                  fontSize: '1.25rem', 
                  cursor: 'pointer' 
                }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <button onClick={openLoginModal} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontWeight: 800, backgroundColor: '#42CDEA', border: 'none', borderRadius: '20px', padding: '7px 18px', fontSize: '1.25rem', textAlign: 'center', cursor: 'pointer' }}>
              Регистрация | Вход
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: 0 }}>
        {/* Search Section */}
        <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '32px', textAlign: 'center', backgroundImage: "url('/backgroundmain.png')", backgroundSize: 'cover', minHeight: '70vh', padding: '32px' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '3.75rem', color: 'white', textRendering: 'optimizeLegibility', textShadow: '0 0 2px rgba(0, 0, 0, 0.5)', marginBottom: '0' }}>
              Начните с выбора проблемы, и мы покажем
              <span style={{ display: 'block', textAlign: 'center', color: 'white' }}>путь к здоровью.</span>
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '900px', position: 'relative', marginTop: '0' }}>
            <input
              type="text"
              placeholder="Поиск по сайту"
              style={{ padding: '22px', color: '#4B5563', borderRadius: '9999px', width: '100%', border: '1px solid #D1D5DB' }}
            />
            <button style={{ backgroundColor: '#00D7FF', padding: '22px', color: 'white', borderRadius: '9999px', position: 'absolute', right: '0', cursor: 'pointer' }}>
              Найти
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '1.875rem', color: 'white', marginTop: '0', marginBottom: '0', fontFamily: "'Nunito', sans-serif", fontWeight: 300 }}>
            Персональные советы для вашего здоровья и комфорта
          </p>
        </section>
        {/* Category Buttons */}
        <section style={{ display: 'flex', justifyContent: 'center', gap: '24px', margin: '32px 0' }}>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: '36px 72px', color: '#4B5563', borderRadius: '9999px', border: '1px solid #D1D5DB', boxShadow: 'none', transition: 'background-color 0.2s', cursor: 'pointer', fontSize: '1.25rem', width: '290px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <img src="/vitamins.png" alt="Витамины" style={{ marginRight: '8px', width: '32px', height: '32px' }} />
            Витамины
          </button>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: '36px 72px', color: '#4B5563', borderRadius: '9999px', border: '1px solid #D1D5DB', boxShadow: 'none', transition: 'background-color 0.2s', cursor: 'pointer', fontSize: '1.25rem', width: '290px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <img src="/consulting.png" alt="Консультация" style={{ marginRight: '8px', width: '32px', height: '32px' }} />
            Консультация
          </button>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: '36px 72px', color: '#4B5563', borderRadius: '9999px', border: '1px solid #D1D5DB', boxShadow: 'none', transition: 'background-color 0.2s', cursor: 'pointer', fontSize: '1.25rem', width: '290px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <img src="/exercise.png" alt="Физическе упражнения" style={{ marginRight: '8px', width: '32px', height: '32px' }} />
            Физические упражнения
          </button>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: '36px 72px', color: '#4B5563', borderRadius: '9999px', border: '1px solid #D1D5DB', boxShadow: 'none', transition: 'background-color 0.2s', cursor: 'pointer', fontSize: '1.25rem', width: '290px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <img src="/products.png" alt="Питание" style={{ marginRight: '8px', width: '32px', height: '32px' }} />
            Питание
          </button>
        </section>

        {/* Body Selection */}
        <section style={{ display: 'flex', justifyContent: 'center', gap: '64px' }}>
          <div>
            <h2 style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Выберите часть тела</h2>
            <div style={{ gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <img src="https://habrastorage.org/webt/pd/3k/dr/pd3kdr4onegu2c2-tewswou9vai.png" alt="Тело" style={{ width: '700px', height: 'auto' }} />
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {polygons.length > 0 ? (
                    polygons.map((polygon, index) => (
                      <polygon 
                        key={index}
                        points={polygon.points} 
                        fill={polygon.fill} 
                        stroke={polygon.stroke} 
                        onMouseEnter={(e) => {
                          e.currentTarget.setAttribute('fill', 'red');
                          const text = textMapping[index];
                          if (text) {
                            setHoveredText(text);
                          }
                        }} 
                        onMouseLeave={(e) => {
                          e.currentTarget.setAttribute('fill', 'black');
                          setHoveredText(null);
                        }} 
                        onClick={() => handlePolygonClick(textMapping[index], index)}
                      />
                    ))
                  ) : (
                    <text x="50%" y="50%" textAnchor="middle" fill="black">Нет полигонов для отображения</text>
                  )}
                  {hoveredText && (
                    <text x="50%" y="20%" textAnchor="middle" fill="black">{hoveredText}</text>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Модальное окно для выбора симптомов */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', width: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: '0' }}>{selectedBodyPart}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#aaa' }}>✖</button> {/* Кнопка закрытия */}
            </div>
            {selectedBodyPart && getSymptomsForBodyPart(selectedBodyPart).map(symptom => (
              <div key={symptom}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={selectedSymptoms.includes(symptom)} 
                    onChange={() => toggleSymptom(symptom)} 
                  />
                  {symptom}
                </label>
              </div>
            ))}
            <button 
              onClick={handleConfirm} 
              style={{ 
                marginTop: '10px', 
                backgroundColor: '#42CDEA', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                padding: '10px',
                cursor: 'pointer'
              }}
            >
              Подтвердить
            </button>
          </div>
        )}

        {/* Recommendations */}
        <section id="recommendations" style={{ margin: '32px 0', padding: '20px', backgroundColor: '#F0F4F8', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px', color: '#1E3A8A' }}>
            Рекомендуемые упражнения, питание и витамины
            {exercises.length > 0 && (
              <div style={{ 
                marginTop: '10px',
                padding: '15px',
                backgroundColor: '#E3F2FD',
                borderRadius: '8px',
                fontSize: '1rem'
              }}>
                Хотите посмотреть этот курс у себя в профиле? 
                <Link 
                  href="/user-courses" 
                  style={{ 
                    marginLeft: '10px',
                    color: 'white',
                    backgroundColor: '#4CAF50',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  Перейти в мои курсы
                </Link>
              </div>
            )}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {/* Упражнения */}
            <div style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: 'white' }}>
                <h3 style={{ fontWeight: 'semibold', color: '#1E3A8A', textAlign: 'center' }}>Упражнения</h3>
                <ul>
                    {exercises.length > 0 ? (
                        exercises.map((exercise, index) => (
                            <li key={index} style={{ textAlign: 'center', marginBottom: '20px' }}>
                                {exerciseGifs[exercise] && (
                                    <img 
                                        src={exerciseGifs[exercise]} 
                                        alt={exercise} 
                                        style={{ width: '150px', height: 'auto', display: 'block', margin: '0 auto 10px' }} 
                                    />
                                )}
                                <span>{exercise}</span>
                            </li>
                        ))
                    ) : (
                        <li>Нет рекомендаций</li>
                    )}
                </ul>
            </div>
            {/* Рекомендуемое питание и витамины */}
            <div style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: 'white' }}>
                <h3 style={{ fontWeight: 'semibold', color: '#1E3A8A', textAlign: 'center' }}>Питание и витамины</h3>
                <ul>
                    {nutrition.length > 0 ? (
                        nutrition.map((item, index) => (
                            <li key={index}>
                                {item.name} {item.description}
                            </li>
                        ))
                    ) : (
                        <li>Нет рекомендаций по питанию</li>
                    )}
                </ul>
            </div>
            {/* Продолжительность курса */}
            <div style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: 'white' }}>
                <h3 style={{ fontWeight: 'semibold', color: '#1E3A8A', textAlign: 'center' }}>Рекомендуемая продолжительность курса</h3>
                <p style={{ fontSize: '2.5em', textAlign: 'center' }}>{duration}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#10415F', color: 'white', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, textAlign: 'left', paddingLeft: '20px' }}>
          <h2>ЛФК Центр</h2>
          <p>+1 (7635) 547-12-97</p>
          <p>support@LFK.Center</p>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <nav style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <Link href="/vitamins" style={{ color: 'white', textDecoration: 'none' }}>Витамины</Link>
            <Link href="/consulting" style={{ color: 'white', textDecoration: 'none' }}>Консультации</Link>
            <Link href="/exercises" style={{ color: 'white', textDecoration: 'none' }}>Физические упражнения</Link>
            <Link href="/nutrition" style={{ color: 'white', textDecoration: 'none' }}>Питание</Link>
          </nav>
        </div>
        <div style={{ flex: 1, textAlign: 'center', paddingRight: '20px', marginTop: '-20px' }}>
          <h3>Подписаться на рассылку</h3>
          <input 
            type="email" 
            placeholder="Получать обновления по почте" 
            style={{ 
              padding: '12px',
              borderRadius: '5px', 
              border: 'none',
              width: '300px',
              marginRight: '10px'
            }} 
          />
          <button style={{ backgroundColor: '#42CDEA', color: 'white', border: 'none', borderRadius: '5px', padding: '12px 20px' }}>→</button>
        </div>
      </footer>

      {/* Модальное окно для входа */}
      {isLoginModalOpen && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', width: '350px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', marginTop: '0px', fontSize: '2rem' }}>Вход</h2>
          <form onSubmit={handleLogin}>
            <div>
              <input 
                type="text" 
                name="email"
                placeholder="Телефон | Почта" 
                style={{ 
                  width: '93%', 
                  padding: '10px', 
                  marginBottom: '15px', 
                  borderWidth: '0 0 2px 0',
                  borderColor: '#D1D5DB',
                  borderStyle: 'solid',
                  outline: 'none',
                  fontSize: '14px'
                }} 
              />
              <input 
                type="password" 
                name="password"
                placeholder="Пароль" 
                style={{ 
                  width: '93%', 
                  padding: '10px', 
                  marginBottom: '15px', 
                  borderWidth: '0 0 2px 0',
                  borderColor: '#D1D5DB',
                  borderStyle: 'solid',
                  outline: 'none',
                  fontSize: '14px'
                }} 
              />
              <p style={{ textAlign: 'right', marginBottom: '15px', fontSize: '12px' }}>
                <a href="#" style={{ color: '#42CDEA' }}>Забыли пароль?</a>
              </p>
              <button 
                type="submit" 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: '#42CDEA', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontSize: '23px',
                  cursor: 'pointer'
                }}
              >
                Войти
              </button>
            </div>
          </form>
          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px' }}>
            Нет аккаунта? <a href="#" onClick={openRegistrationModal} style={{ color: '#42CDEA' }}>Зарегистрироваться</a>
          </p>
          <button onClick={closeLoginModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#aaa', position: 'absolute', top: '10px', right: '10px' }}>✖</button>
        </div>
      )}

      {/* Модальное окно для регистрации */}
      {isRegistrationModalOpen && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', width: '350px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', marginTop: '0px', fontSize: '2rem' }}>Регистрация</h2>
            <form onSubmit={handleRegistration}>
                <div>
                    <input type="text" name="firstName" placeholder="Имя" required style={{ width: '93%', padding: '10px', marginBottom: '15px', borderWidth: '0 0 2px 0', borderColor: '#D1D5DB', borderStyle: 'solid', outline: 'none', fontSize: '14px' }} />
                    <input type="text" name="lastName" placeholder="Фамилия" required style={{ width: '93%', padding: '10px', marginBottom: '15px', borderWidth: '0 0 2px 0', borderColor: '#D1D5DB', borderStyle: 'solid', outline: 'none', fontSize: '14px' }} />
                    <input type="text" name="phone" placeholder="Телефон" required style={{ width: '93%', padding: '10px', marginBottom: '15px', borderWidth: '0 0 2px 0', borderColor: '#D1D5DB', borderStyle: 'solid', outline: 'none', fontSize: '14px' }} />
                    <input type="email" name="email" placeholder="Почта" required style={{ width: '93%', padding: '10px', marginBottom: '15px', borderWidth: '0 0 2px 0', borderColor: '#D1D5DB', borderStyle: 'solid', outline: 'none', fontSize: '14px' }} />
                    <select name="gender" required aria-label="Выбор пола" style={{ width: '98.7%', padding: '10px', marginBottom: '15px', borderWidth: '0 0 2px 0', borderColor: '#D1D5DB', borderStyle: 'solid', outline: 'none', fontSize: '14px' }}>
                        <option value="">Выбрать пол</option>
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                    </select>
                    <input type="date" name="birthDate" placeholder="Дата рождения" required style={{ width: '93%', padding: '10px', marginBottom: '15px', borderWidth: '0 0 2px 0', borderColor: '#D1D5DB', borderStyle: 'solid', outline: 'none', fontSize: '14px' }} />
                    <input type="password" name="password" placeholder="Пароль" required style={{ width: '93%', padding: '10px', marginBottom: '15px', borderWidth: '0 0 2px 0', borderColor: '#D1D5DB', borderStyle: 'solid', outline: 'none', fontSize: '14px' }} />
                    <input type="password" name="confirmPassword" placeholder="Повторите пароль" required style={{ width: '93%', padding: '10px', marginBottom: '15px', borderWidth: '0 0 2px 0', borderColor: '#D1D5DB', borderStyle: 'solid', outline: 'none', fontSize: '14px' }} />
                    <button 
                      type="submit" 
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        backgroundColor: '#42CDEA', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '10px', 
                        fontSize: '23px', 
                        marginBottom: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Зарегистрироваться
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '14px' }}>
                        <span>Уже есть аккаунт? </span>
                        <a href="#" onClick={() => { setIsRegistrationModalOpen(false); setIsLoginModalOpen(true); }} style={{ color: '#42CDEA', textDecoration: 'none' }}>Войти</a>
                    </div>
                </div>
            </form>
            <button onClick={() => { setIsRegistrationModalOpen(false); setIsLoginModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#aaa', position: 'absolute', top: '10px', right: '10px' }}>✖</button>
        </div>
      )}
    </div>
  );
}
