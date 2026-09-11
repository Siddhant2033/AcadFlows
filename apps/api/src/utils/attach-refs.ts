import mongoose from 'mongoose';

/**
 * Manual replacement for Mongoose's `.populate()` when foreign keys
 * are stored as strings (not ObjectId + ref).
 *
 * Given an array of plain documents and a map of { fieldName → { model, fields } },
 * fetch each referenced document (batched per field) and replace the field's
 * string ID with the resolved object.
 *
 * Usage:
 *   const items = await Assignment.find({ tenantId }).lean();
 *   const withRefs = await attachRefs(items, {
 *     subjectId: { model: Subject, fields: 'name code' },
 *     sectionId: { model: Section, fields: 'name' },
 *     teacherId: { model: Teacher, fields: 'firstName lastName' },
 *   });
 */
export async function attachRefs<T extends Record<string, any>>(
  docs: T[],
  refMap: Record<string, { model: mongoose.Model<any>; fields: string }>,
): Promise<T[]> {
  if (!docs || docs.length === 0) return [];

  const keys = Object.keys(refMap);
  if (keys.length === 0) return docs;

  // Gather unique IDs per reference field
  const idSets: Record<string, Set<string>> = {};
  for (const key of keys) idSets[key] = new Set<string>();

  for (const doc of docs) {
    for (const key of keys) {
      const val = doc[key];
      if (typeof val === 'string' && val.length === 24) {
        idSets[key].add(val);
      }
    }
  }

  // Batch-fetch referenced docs
  const lookups: Record<string, Map<string, any>> = {};

  await Promise.all(
    keys.map(async (key) => {
      const ids = [...idSets[key]];
      if (ids.length === 0) {
        lookups[key] = new Map();
        return;
      }

      const { model, fields } = refMap[key];
      const found = await model
        .find({ _id: { $in: ids } })
        .select(fields)
        .lean();

      lookups[key] = new Map(
        found.map((d: any) => [d._id.toString(), d]),
      );
    }),
  );

  // Apply lookups
  return docs.map((doc) => {
    const out: any = { ...doc };
    for (const key of keys) {
      const val = out[key];
      if (typeof val === 'string' && lookups[key].has(val)) {
        out[key] = lookups[key].get(val);
      }
    }
    return out;
  });
}

/**
 * Same as attachRefs, but for a single document.
 */
export async function attachRef<T extends Record<string, any>>(
  doc: T | null,
  refMap: Record<string, { model: mongoose.Model<any>; fields: string }>,
): Promise<T | null> {
  if (!doc) return null;
  const [out] = await attachRefs([doc], refMap);
  return out ?? null;
}