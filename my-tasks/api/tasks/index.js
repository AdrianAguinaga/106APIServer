let DB = [];
let NEXT_ID = 1;

module.exports = async function (context, req) {
  const method = (req.method || "GET").toUpperCase();
  const id = req.params.id ? String(req.params.id) : null;
  context.res = { headers: { "Content-Type": "application/json" } };

  try {
    if (method === "GET") {
      if (id) {
        const found = DB.find(t => String(t.id) === id);
        return context.res = found
          ? { status: 200, body: JSON.stringify(found) }
          : { status: 404, body: JSON.stringify({ error: "Not found" }) };
      }
      return context.res = { status: 200, body: JSON.stringify(DB) };
    }

    if (method === "POST") {
      const body = req.body || {};
      // Validación mínima
      if (!body.title) {
        return context.res = { status: 400, body: JSON.stringify({ error: "title is required" }) };
      }
      const created = { ...body, id: NEXT_ID++ };
      DB.unshift(created);
      return context.res = { status: 201, body: JSON.stringify(created) };
    }

    if (method === "PUT" && id) {
      const idx = DB.findIndex(t => String(t.id) === id);
      if (idx === -1) return context.res = { status: 404, body: JSON.stringify({ error: "Not found" }) };
      DB[idx] = { ...DB[idx], ...(req.body || {}) };
      return context.res = { status: 200, body: JSON.stringify(DB[idx]) };
    }

    if (method === "DELETE" && id) {
      const before = DB.length;
      DB = DB.filter(t => String(t.id) !== id);
      return context.res = (DB.length < before)
        ? { status: 204, body: null }
        : { status: 404, body: JSON.stringify({ error: "Not found" }) };
    }

    context.res = { status: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    context.log(err);
    context.res = { status: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
