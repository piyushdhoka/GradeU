import { QdrantClient } from '@qdrant/js-client-rest';

const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API_KEY;

export const qdrant = qdrantUrl
    ? new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey })
    : null;

export const COLLECTION_NAME = 'course_concepts';
