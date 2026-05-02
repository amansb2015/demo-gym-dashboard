import Tesseract from 'tesseract.js';

export type OcrPaymentData = {
  rawText: string;
  amount?: number;
  upiId?: string;
  transactionId?: string;
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
  const compact = rawText.replace(/\s+/g, ' ').trim();
  const amountMatch =
    compact.match(/(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i) ??
    compact.match(/([0-9,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i);
  const upiMatch = compact.match(/[a-z0-9.\-_]{2,}@[a-z]{2,}/i);
  const txnMatch = compact.match(/(?:transaction|txn|utr|ref(?:erence)?)[\s#:.-]*([a-z0-9]{8,})/i);
  const dateMatch = compact.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})(?:\s+(\d{1,2}:\d{2}\s?(?:am|pm)?))?/i);
  const senderMatch = compact.match(/(?:from|paid by|sender)[:\s-]+([a-z][a-z\s.]{2,30})/i);

  return {
    rawText,
    amount: amountMatch ? Number(amountMatch[1].replaceAll(',', '')) : undefined,
    upiId: upiMatch?.[0],
    transactionId: txnMatch?.[1],
    paidAt: dateMatch ? normalizeDate(dateMatch[1], dateMatch[2]) : undefined,
    senderName: senderMatch?.[1]?.trim(),
  };
}

function normalizeDate(datePart: string, timePart?: string) {
  const [first, second, third] = datePart.split(/[/-]/).map(Number);
  const year = third < 100 ? 2000 + third : third;
  const date = new Date(year, second - 1, first);
  if (timePart) {
    const match = timePart.match(/(\d{1,2}):(\d{2})\s?(am|pm)?/i);
    if (match) {
      let hours = Number(match[1]);
      const minutes = Number(match[2]);
      const meridiem = match[3]?.toLowerCase();
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
    }
  }
  return date.toISOString();
}
