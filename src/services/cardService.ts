import { CARDS_COLLECTION, FIRESTORE_BASE_URL, firebaseConfig } from '../config/firebase';
import { Card, IntensityLevel } from '../types/game';

export const REMOTE_DECK_ERROR_FLAG = '__remoteDeckError__' as const;

export type CardFetchResult = Card[] & { [REMOTE_DECK_ERROR_FLAG]?: true };

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

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Resposta inválida do servidor (${res.status})`);
  }
}

const createRemoteErrorFallback = (): CardFetchResult => {
  const fallback = [] as CardFetchResult;
  fallback[REMOTE_DECK_ERROR_FLAG] = true;
  return fallback;
};

export const fetchCardsByIntensity = async (intensity: IntensityLevel): Promise<CardFetchResult> => {
  try {
    const url = `${FIRESTORE_BASE_URL}/${CARDS_COLLECTION}?key=${firebaseConfig.apiKey}&pageSize=500&orderBy=createTime desc`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Firestore ${response.status}`);
    }

    const data = await safeJson<{ documents?: FirestoreDocument[] }>(response);
    const documents = data.documents ?? [];

    const cards = documents
      .map(document => mapDocumentToCard(document))
      .filter((card): card is Card => Boolean(card));

    return cards as CardFetchResult;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[cardService] Erro ao buscar cartas remotas:', error);
    }
    return createRemoteErrorFallback();
  }
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
  try {
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

    const response = await fetch(
      `${FIRESTORE_BASE_URL}/${CARDS_COLLECTION}?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      }
    );

    if (!response.ok) {
      throw new Error(`Não foi possível salvar a carta (${response.status})`);
    }

    const data = await safeJson<CreateCardResponse>(response);
    const id = data.name ? data.name.split('/').pop() : null;

    if (!id) {
      throw new Error('Resposta inválida ao criar carta.');
    }

    return id;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[cardService] Erro ao criar carta remota:', error);
    }
    throw error instanceof Error
      ? error
      : new Error('Não foi possível salvar a carta no momento.');
  }
};
