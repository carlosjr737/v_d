import { CARDS_COLLECTION, FIRESTORE_BASE_URL, firebaseConfig } from '../config/firebase';
import { Card, IntensityLevel } from '../types/game';

interface FirestoreFieldValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  mapValue?: {
    fields?: Record<string, FirestoreFieldValue>;
  };
  arrayValue?: {
    values?: FirestoreFieldValue[];
  };
  timestampValue?: string;
}

interface FirestoreDocument {
  name?: string;
  fields?: Record<string, FirestoreFieldValue>;
}

interface RunQueryResponseItem {
  document?: FirestoreDocument;
}

const getDocumentId = (document: FirestoreDocument): string => {
  const fullName = document.name ?? '';
  const segments = fullName.split('/');
  return segments[segments.length - 1] || fullName;
};

const getString = (field?: FirestoreFieldValue): string | undefined => field?.stringValue;

const getBoolean = (field?: FirestoreFieldValue): boolean => Boolean(field?.booleanValue);

const mapDocumentToCard = (document: FirestoreDocument): Card | null => {
  const fields = document.fields;

  if (!fields) {
    return null;
  }

  const type = getString(fields.type);
  const text = getString(fields.text);
  const level = getString(fields.level) as IntensityLevel | undefined;

  if ((type !== 'truth' && type !== 'dare') || !text || !level) {
    return null;
  }

  return {
    id: getDocumentId(document),
    type,
    text,
    level,
    isBoosted: getBoolean(fields.isBoosted),
    isCustom: getBoolean(fields.isCustom),
  };
};

export const fetchCardsByIntensity = async (intensity: IntensityLevel): Promise<Card[]> => {
  const body = {
    structuredQuery: {
      from: [{ collectionId: CARDS_COLLECTION }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'level' },
          op: 'EQUAL',
          value: { stringValue: intensity },
        },
      },
      orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
    },
  };

  const response = await fetch(`${FIRESTORE_BASE_URL}:runQuery?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Não foi possível carregar as cartas (${response.status})`);
  }

  const data = (await response.json()) as RunQueryResponseItem[];

  return data
    .map(item => (item.document ? mapDocumentToCard(item.document) : null))
    .filter((card): card is Card => Boolean(card));
};

interface CreateCardInput {
  type: 'truth' | 'dare';
  text: string;
  level: IntensityLevel;
  isCustom?: boolean;
}

interface CreateCardResponse {
  name?: string;
}

export const createRemoteCard = async (input: CreateCardInput): Promise<string> => {
  const document = {
    fields: {
      type: { stringValue: input.type },
      text: { stringValue: input.text },
      level: { stringValue: input.level },
      isCustom: { booleanValue: input.isCustom ?? false },
      isBoosted: { booleanValue: false },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };

  const response = await fetch(`${FIRESTORE_BASE_URL}/${CARDS_COLLECTION}?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error(`Não foi possível salvar a carta (${response.status})`);
  }

  const data = (await response.json()) as CreateCardResponse;
  const id = data.name ? data.name.split('/').pop() : null;

  if (!id) {
    throw new Error('Resposta inválida ao criar carta.');
  }

  return id;
};
