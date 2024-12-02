import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath1 = path.join(process.cwd(), 'points.txt');
  const data1 = fs.readFileSync(filePath1, 'utf-8');

  const filePath2 = path.join(process.cwd(), 'points2.txt');
  const data2 = fs.readFileSync(filePath2, 'utf-8');
  
  const polygons1 = data1.split('#').map(polygon => {
    const points = polygon.trim().split('\n').filter(Boolean).map(point => {
      const [x, y] = point.split(',').map(Number); // Разделяем координаты
      return `${x / 10.5},${(y / 10.5)}`; // Делим x на 5 и умножаем y на -1
    }).join(' '); // Объединяем точки в строку

    return {
      points,
      fill: 'black', // Установите нужный цвет
      stroke: 'black', // Установите нужный цвет
    };
  }).filter(polygon => polygon.points); // Удаляем пустые полигоны
  
  const offsetX = 3675; // Смещение по оси X для полигонов из второго файла
  const polygons2 = data2.split('#').map(polygon => {
    const points = polygon.trim().split('\n').filter(Boolean).map(point => {
      const [x, y] = point.split(',').map(Number);
      return `${(x + offsetX) / 10.5},${(y / 10.5)}`; // Применяем смещение к x
    }).join(' ');

    return {
      points,
      fill: 'black',
      stroke: 'black',
    };
  }).filter(polygon => polygon.points);

  const allPolygons = [...polygons1, ...polygons2];
  
  return NextResponse.json(allPolygons);
} 