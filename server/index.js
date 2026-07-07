const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// ==================== 查询列表 ====================
app.get('/api/insights', async (req, res) => {
  try {
    const {
      insight_type,
      severity,
      keyword,
      metric,
      session_id,
      domain,
      conclusion_type,
      date_from,
      date_to,
      page = 1,
      pageSize = 20,
    } = req.query;

    const conditions = [];
    const params = [];

    if (insight_type) {
      conditions.push('insight_type = ?');
      params.push(insight_type);
    }
    if (severity) {
      conditions.push('severity = ?');
      params.push(severity);
    }
    if (metric) {
      conditions.push('metric = ?');
      params.push(metric);
    }
    if (session_id) {
      conditions.push('session_id = ?');
      params.push(session_id);
    }
    if (domain) {
      conditions.push('domain = ?');
      params.push(domain);
    }
    if (conclusion_type) {
      conditions.push('conclusion_type = ?');
      params.push(conclusion_type);
    }
    if (date_from) {
      conditions.push('created_at >= ?');
      params.push(date_from);
    }
    if (date_to) {
      conditions.push('created_at < DATE_ADD(?, INTERVAL 1 DAY)');
      params.push(date_to);
    }
    if (keyword) {
      conditions.push('(title LIKE ? OR notes LIKE ? OR JSON_EXTRACT(insight_data, "$.district") LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = parseInt(String(pageSize), 10);
    const offset = (parseInt(String(page), 10) - 1) * limit;

    // 查总数
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM insights ${where}`, params);
    const total = countRows[0].total;

    // 查分页数据 — 用 query 而非 execute，避免 LIMIT/OFFSET 预编译类型不匹配
    const [rows] = await pool.query(
      `SELECT * FROM insights ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({ list: rows, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('查询列表失败:', err);
    res.status(500).json({ message: '查询失败', error: err.message });
  }
});

// ==================== 实时预警推送（必须在 :id 前面） ====================
app.get('/api/insights/latest-alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await pool.query(
      `SELECT *
       FROM insights
       WHERE severity IN ('critical', 'warning')
       ORDER BY created_at DESC
       LIMIT ${limit}`
    );
    const alerts = rows.map(row => {
      let district = null;
      if (row.insight_data) {
        try {
          const data = typeof row.insight_data === 'string' ? JSON.parse(row.insight_data) : row.insight_data;
          district = data.district || null;
        } catch { /* */ }
      }
      return {
        ...row,
        type: row.severity === 'critical' ? 'critical' : 'warning',
        tag: row.severity === 'critical' ? 'CRITICAL' : 'WARNING',
        district,
        text: row.notes || row.title,
      };
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: '查询失败', error: err.message });
  }
});

// ==================== 查询详情 ====================
app.get('/api/insights/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM insights WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('查询详情失败:', err);
    res.status(500).json({ message: '查询失败', error: err.message });
  }
});

// ==================== 新增 ====================
app.post('/api/insights', async (req, res) => {
  try {
    const {
      title, insight_type, severity, metric, domain,
      conclusion_type, session_id,
      notes, analysis, metric_value, normal_range,
      deviation, action, source, insight_data,
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO insights (title, insight_type, severity, metric, domain,
        conclusion_type, session_id, notes, analysis, metric_value,
        normal_range, deviation, action, source, insight_data, signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, insight_type, severity, metric, domain,
        conclusion_type, session_id, notes || null, analysis || null, metric_value || null,
        normal_range || null, deviation || null, action || null, source || null,
        insight_data ? JSON.stringify(insight_data) : null,
        Math.random().toString(36).slice(2, 8),
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM insights WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('新增失败:', err);
    res.status(500).json({ message: '新增失败', error: err.message });
  }
});

// ==================== 更新 ====================
app.put('/api/insights/:id', async (req, res) => {
  try {
    const {
      title, insight_type, severity, metric, domain,
      conclusion_type, session_id,
      notes, analysis, metric_value, normal_range,
      deviation, action, source, insight_data,
    } = req.body;

    await pool.execute(
      `UPDATE insights SET
        title = ?, insight_type = ?, severity = ?, metric = ?, domain = ?,
        conclusion_type = ?, session_id = ?, notes = ?, analysis = ?,
        metric_value = ?, normal_range = ?, deviation = ?,
        action = ?, source = ?, insight_data = ?
      WHERE id = ?`,
      [
        title, insight_type, severity, metric, domain,
        conclusion_type, session_id, notes || null, analysis || null,
        metric_value || null, normal_range || null, deviation || null,
        action || null, source || null,
        insight_data ? JSON.stringify(insight_data) : null,
        req.params.id,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM insights WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('更新失败:', err);
    res.status(500).json({ message: '更新失败', error: err.message });
  }
});

// ==================== 删除 ====================
app.delete('/api/insights/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM insights WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除失败:', err);
    res.status(500).json({ message: '删除失败', error: err.message });
  }
});

// ==================== 批量删除 ====================
app.post('/api/insights/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || ids.length === 0) {
      return res.status(400).json({ message: '请提供要删除的 ID 列表' });
    }
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(`DELETE FROM insights WHERE id IN (${placeholders})`, ids);
    res.json({ message: `成功删除 ${ids.length} 条记录` });
  } catch (err) {
    console.error('批量删除失败:', err);
    res.status(500).json({ message: '批量删除失败', error: err.message });
  }
});

// ==================== 会话列表 ====================
app.get('/api/sessions', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT session_id FROM insights ORDER BY session_id DESC LIMIT 50'
    );
    res.json(rows.map((r) => r.session_id));
  } catch (err) {
    console.error('查询会话失败:', err);
    res.status(500).json({ message: '查询失败', error: err.message });
  }
});

// ==================== 启动 ====================
app.listen(PORT, () => {
  console.log(`✅ 后端 API 已启动: http://localhost:${PORT}`);
  console.log(`   示例: GET http://localhost:${PORT}/api/insights?page=1&pageSize=20`);
});
