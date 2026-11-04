import { resolve, sep } from 'node:path';

// Public assets are copied into dist by Vite, so room files must stay outside both.
export function roomDataPath(value, projectRoot) {
  const filename = resolve(projectRoot, value);
  const comparison = (path) => process.platform === 'win32' ? path.toLowerCase() : path;
  for (const directory of ['public', 'dist']) {
    const servedPath = resolve(projectRoot, directory);
    if (comparison(filename) === comparison(servedPath) || comparison(filename).startsWith(`${comparison(servedPath)}${sep}`)) {
      throw new Error('ROOM_DATA_FILE phải nằm ngoài thư mục public và dist để bảo vệ phiên tham gia.');
    }
  }
  return filename;
}
