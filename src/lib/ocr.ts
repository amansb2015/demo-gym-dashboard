import Tesseract from 'tesseract.js';

export type OcrPaymentData = {
  rawText: string;
  amount?: number;
  upiId?: string;
  transactionId?: string;
  utrNumber?: string;
  paidAt?: string;
  senderName?: string;
};

export async function readPaymentScreenshot(file: File, onProgress?: (progress: number) => void): Promise<OcrPaymentData> {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.(Math.round((message.progress ?? 0) * 100));
      }
    },
  });

  return parsePaymentText(result.data.text);
}

export function parsePaymentText(rawText: string): OcrPaymentData {
  const compact = normalizeOcrText(rawText);
  const upiMatch = compact.match(/[a-z0-9.\-_]{2,}@[a-z0-9.\-_]{2,}/i);
  const senderMatch = compact.match(/(?:from|paid by|sender|debited from)[:\s-]+([a-z][a-z\s.]{2,40})(?=\s(?:to|upi|on|date|bank|account|$))/i);
  const utrNumber = extractUtrNumber(compact);
  const transactionId = extractTransactionId(compact);

  return {
    rawText,
    amount: extractAmount(compact),
    upiId: upiMatch?.[0],
    transactionId: transactionId && transactionId !== utrNumber ? transactionId : undefined,
    utrNumber,
    paidAt: extractPaidAt(compact),
    senderName: senderMatch?.[1]?.trim(),
  };
}

function normalizeOcrText(text: string) {
  return text
    .replace(/\u20b9/g, ' INR ')
    .replace(/\u00e2\u201a\u00b9/g, ' INR ')
    .replace(/\b(Rs|Rs\.|INR)\b/gi, ' INR ')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAmount(text: string) {
  const patterns = [
    /(?:amount|paid|sent|received|debited|credited|total)[\s:.-]*(?:INR\s*)?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)/i,
    /INR\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)/i,
    /([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)\s*INR/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1].replace(/,/g, ''));
  }

  return undefined;
}

function extractTransactionId(text: string) {
  const patterns = [
    /(?:google\s*transaction\s*id|transaction\s*id|transaction\s*no|txn\s*id|txn\s*no|order\s*id)[\s#:.-]*([a-z0-9-]{8,})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return cleanIdentifier(match[1]);
  }

  return undefined;
}

function extractUtrNumber(text: string) {
  const patterns = [
    /(?:utr(?:\s*no\.?|\s*number)?|upi\s*transaction\s*id|upi\s*ref(?:erence)?\s*no\.?|bank\s*ref(?:erence)?\s*no\.?|reference\s*id|rrn)[\s#:.-]*([a-z0-9-]{8,})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return cleanIdentifier(match[1]);
  }

  return undefined;
}

function cleanIdentifier(value: string) {
  return value.replace(/[^a-z0-9-]/gi, '').trim();
}

function extractPaidAt(text: string) {
  const numericDate = text.match(
    /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[,\s]*(?:at|on)?\s*(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(am|pm)?)?/i,
  );
  if (numericDate) {
    return buildDate({
      day: Number(numericDate[1]),
      month: Number(numericDate[2]),
      year: normalizeYear(Number(numericDate[3])),
      hour: numericDate[4] ? Number(numericDate[4]) : undefined,
      minute: numericDate[5] ? Number(numericDate[5]) : undefined,
      meridiem: numericDate[6],
    });
  }

  const isoDate = text.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[,\s]*(?:at|on)?\s*(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(am|pm)?)?/i);
  if (isoDate) {
    return buildDate({
      day: Number(isoDate[3]),
      month: Number(isoDate[2]),
      year: Number(isoDate[1]),
      hour: isoDate[4] ? Number(isoDate[4]) : undefined,
      minute: isoDate[5] ? Number(isoDate[5]) : undefined,
      meridiem: isoDate[6],
    });
  }

  const namedDate = text.match(
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[,]?\s+(\d{2,4})(?:[,\s]*(?:at|on)?\s*(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(am|pm)?)?/i,
  );
  if (namedDate) {
    return buildDate({
      day: Number(namedDate[1]),
      month: monthNameToNumber(namedDate[2]),
      year: normalizeYear(Number(namedDate[3])),
      hour: namedDate[4] ? Number(namedDate[4]) : undefined,
      minute: namedDate[5] ? Number(namedDate[5]) : undefined,
      meridiem: namedDate[6],
    });
  }

  const namedDateFirst = text.match(
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})[,]?\s+(\d{2,4})(?:[,\s]*(?:at|on)?\s*(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(am|pm)?)?/i,
  );
  if (namedDateFirst) {
    return buildDate({
      day: Number(namedDateFirst[2]),
      month: monthNameToNumber(namedDateFirst[1]),
      year: normalizeYear(Number(namedDateFirst[3])),
      hour: namedDateFirst[4] ? Number(namedDateFirst[4]) : undefined,
      minute: namedDateFirst[5] ? Number(namedDateFirst[5]) : undefined,
      meridiem: namedDateFirst[6],
    });
  }

  return undefined;
}

function buildDate({
  day,
  month,
  year,
  hour = 0,
  minute = 0,
  meridiem,
}: {
  day: number;
  month: number;
  year: number;
  hour?: number;
  minute?: number;
  meridiem?: string;
}) {
  if (!day || !month || !year || month > 12 || day > 31) return undefined;
  let normalizedHour = hour;
  const period = meridiem?.toLowerCase();
  if (period === 'pm' && normalizedHour < 12) normalizedHour += 12;
  if (period === 'am' && normalizedHour === 12) normalizedHour = 0;
  const date = new Date(year, month - 1, day, normalizedHour, minute, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : toDateTimeLocalValue(date);
}

function normalizeYear(year: number) {
  return year < 100 ? 2000 + year : year;
}

function monthNameToNumber(month: string) {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const normalized = month.toLowerCase().slice(0, 3);
  return months.indexOf(normalized) + 1;
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
