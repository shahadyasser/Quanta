import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { MongoClient } from 'npm:mongodb@6';

const ENTITIES = [
  "Job",
  "Application",
  "RecruiterProfile",
  "Candidate",
  "CandidateProfile",
  "AdminProfile",
  "PsychQuestion",
  "JobProfile",
  "AssessmentResult",
  "CVEmbedding",
  "InterviewSlot",
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const mongo = new MongoClient(Deno.env.get("MONGODB_URI"));
  await mongo.connect();
  const db = mongo.db("QuantaHire");

  const results = {};

  for (const entityName of ENTITIES) {
    try {
      const records = await base44.asServiceRole.entities[entityName].list();
      const collection = db.collection(entityName);

      if (!records || records.length === 0) {
        results[entityName] = { synced: 0 };
        continue;
      }

      // Upsert each record using Base44 id as _id
      const ops = records.map(record => ({
        updateOne: {
          filter: { _id: record.id },
          update: { $set: { ...record, _id: record.id } },
          upsert: true,
        }
      }));

      const res = await collection.bulkWrite(ops);
      results[entityName] = {
        synced: records.length,
        upserted: res.upsertedCount,
        modified: res.modifiedCount,
      };
    } catch (err) {
      results[entityName] = { error: err.message };
    }
  }

  await mongo.close();
  return Response.json({ success: true, database: "QuantaHire", results });
});