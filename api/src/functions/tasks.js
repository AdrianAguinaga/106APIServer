const { app } = require('@azure/functions');

let tasks = []; // demo en memoria (no persistente)

app.http('tasks', {
  route: 'tasks/{id?}',                 // <-- ruta con id opcional
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const method = request.method.toUpperCase();
    const id = request.params?.id || null;

    // CORS preflight
    if (method === 'OPTIONS') {
      return {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }

    // GET /api/tasks[?name=...]
    if (method === 'GET') {
      const name = request.query.get('name');
      const data = name
        ? tasks.filter(t => (t.name || '').toLowerCase() === name.toLowerCase())
        : tasks;
      return { status: 200, body: data, headers: { 'Access-Control-Allow-Origin': '*' } };
    }

    // POST /api/tasks
    if (method === 'POST') {
      const b = await request.json();
      const task = {
        id: Date.now().toString(),
        isImportant: !!(b.isImportant ?? b.important),
        title: b.title || '',
        desc: b.desc ?? b.description ?? '',
        color: b.color || '#000',
        date: b.date ?? b.startDate ?? new Date().toISOString().slice(0,10),
        status: b.status || 'pending',
        budget: Number(b.budget ?? 0),
        name: b.name ?? b.user ?? b.owner ?? null,
        createdAt: new Date().toISOString()
      };
      if (!task.title) return { status: 400, body: { error: 'title is required' } };
      tasks.push(task);
      return { status: 201, body: task, headers: { 'Access-Control-Allow-Origin': '*' } };
    }

    // PUT /api/tasks/{id}
    if (method === 'PUT') {
      if (!id) return { status: 400, body: { error: 'id required' } };
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) return { status: 404, body: { error: 'Not found' } };
      const body = await request.json();
      tasks[idx] = { ...tasks[idx], ...body, id: tasks[idx].id, createdAt: tasks[idx].createdAt };
      return { status: 200, body: tasks[idx], headers: { 'Access-Control-Allow-Origin': '*' } };
    }

    // DELETE /api/tasks/{id}
    if (method === 'DELETE') {
      if (!id) return { status: 400, body: { error: 'id required' } };
      const before = tasks.length;
      tasks = tasks.filter(t => t.id !== id);
      return before === tasks.length
        ? { status: 404, body: { error: 'Not found' } }
        : { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } };
    }

    return { status: 405, body: { error: 'Method Not Allowed' } };
  }
});
