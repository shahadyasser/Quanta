import { MongoClient } from 'npm:mongodb@6';

Deno.serve(async (req) => {
  const client = new MongoClient(Deno.env.get("MONGODB_URI"));
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const info = await adminDb.serverInfo();
    return Response.json({ success: true, version: info.version });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
});