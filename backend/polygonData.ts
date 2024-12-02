import fs from 'fs';
import path from 'path';

export const readPointsFromFile = () => {
  const filePath = path.join(__dirname, 'points.txt');
  const data = fs.readFileSync(filePath, 'utf-8');
  const polygons = data.split('#').map(polygon => polygon.trim().split('\n').filter(Boolean));
  return polygons;
}; 