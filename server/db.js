const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 手动加载 .env 文件（避免 dotenv 包不可用的问题）
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        // 仅当环境变量未设置时才从 .env 读取（允许外部环境变量覆盖）
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '10.16.230.61',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'common',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'omnidemo',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
