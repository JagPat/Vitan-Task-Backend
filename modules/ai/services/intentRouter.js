/**
 * Basic intent extraction for WhatsApp/AI text
 * Supported intents: create_task, status_check, help, unknown
 * Extracts a naive task title after trigger phrase for create_task
 */
function extractIntent(text = '', lang = 'en') {
  const t = (text || '').trim();
  const l = (lang || 'en').toLowerCase();
  const lowered = t.toLowerCase();

  // Help
  if (/^help$|^\?$|^menu$/.test(lowered)) return { intent: 'help', payload: {} };

  // Status check keywords
  if (/(status|progress|estado|haalat)/i.test(lowered)) return { intent: 'status_check', payload: {} };

  // Create task — multilingual triggers
  const triggers = [
    'create task', 'add task', 'new task',
    'crear tarea', 'agregar tarea',
    'kaam banao', 'kaam banana', 'task banao'
  ];
  const trigger = triggers.find(tr => lowered.includes(tr));
  if (trigger) {
    const idx = lowered.indexOf(trigger) + trigger.length;
    const title = t.slice(idx).trim() || t;
    return { intent: 'create_task', payload: { title } };
  }

  // Simple imperative like: "Task: ..." or "Todo: ..."
  const colonMatch = lowered.match(/^(task|todo|tarea)[:\-]\s*(.+)$/i);
  if (colonMatch) {
    return { intent: 'create_task', payload: { title: colonMatch[2].trim() } };
  }

  return { intent: 'unknown', payload: {} };
}

module.exports = { extractIntent };

