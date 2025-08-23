const { app } = require('@azure/functions');

let tasks = [];

app.http('tasks', {
  route: 'tasks/{id?}',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const method = request.method.toUpperCase();
    const id = request.params?.id || null;

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

    if (method === 'GET') {
      const name = request.query.get('name');
      const data = name
        ? tasks.filter(t => (t.name || '').toLowerCase() === name.toLowerCase())
        : tasks;
      return { status: 200, jsonBody: data, headers: { 'Access-Control-Allow-Origin': '*' } };
    }

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
      if (!task.title) return { status: 400, jsonBody: { error: 'title is required' } };
      tasks.push(task);
      return { status: 201, jsonBody: task, headers: { 'Access-Control-Allow-Origin': '*' } };
    }

    if (method === 'PUT') {
      if (!id) return { status: 400, jsonBody: { error: 'id required' } };
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) return { status: 404, jsonBody: { error: 'Not found' } };
      const body = await request.json();
      tasks[idx] = { ...tasks[idx], ...body, id: tasks[idx].id, createdAt: tasks[idx].createdAt };
      return { status: 200, jsonBody: tasks[idx], headers: { 'Access-Control-Allow-Origin': '*' } };
    }

    if (method === 'DELETE') {
      if (!id) return { status: 400, jsonBody: { error: 'id required' } };
      const before = tasks.length;
      tasks = tasks.filter(t => t.id !== id);
      return before === tasks.length
        ? { status: 404, jsonBody: { error: 'Not found' } }
        : { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } };
    }

    return { status: 405, jsonBody: { error: 'Method Not Allowed' } };
  }
});
