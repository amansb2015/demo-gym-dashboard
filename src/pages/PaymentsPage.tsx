import { FormEvent, useEffect, useState } from 'react';
import { Camera, FileImage, Images, ReceiptText, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '../lib/dates';
import { readPaymentScreenshot } from '../lib/ocr';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import type { Member, Payment, PaymentMethod } from '../types/database';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('online');
  const [paidAt, setPaidAt] = useState(toDateTimeLocalValue(new Date()));
  const [transactionId, setTransactionId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [memberResult, paymentResult] = await Promise.all([
      supabase.from('members').select('*').eq('status', 'active').order('full_name'),
      supabase.from('payments').select('*, members(full_name, phone)').order('paid_at', { ascending: false }).limit(30),
    ]);
    setMembers(memberResult.data ?? []);
    setPayments((paymentResult.data ?? []) as unknown as Payment[]);
  }

  async function handleFile(nextFile: File | null) {
    setFile(nextFile);
    setOcrText('');
    setProgress(0);
    setPaidAt('');
    if (!nextFile) return;
    try {
      const result = await readPaymentScreenshot(nextFile, setProgress);
      setOcrText(result.rawText);
      if (result.amount) setAmount(String(result.amount));
      if (result.transactionId) setTransactionId(result.transactionId);
      if (result.utrNumber) setUtrNumber(result.utrNumber);
      if (result.upiId) setUpiId(result.upiId);
      if (result.senderName) setSenderName(result.senderName);
      if (result.paidAt) {
        setPaidAt(result.paidAt);
        toast.success('Screenshot scanned. Please review before saving.');
      } else {
        toast.warning('Screenshot scanned, but no receipt date was found. Please enter the date from the receipt.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'OCR failed');
    } finally {
      setProgress(100);
    }
  }

  async function savePayment(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    let screenshotUrl: string | null = null;

    try {
      if (file) {
        const extension = file.name.split('.').pop() ?? 'jpg';
        const path = `${memberId}/${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('payment-screenshots').upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        screenshotUrl = path;
      }

      const receiptId = `GYM-${Date.now().toString(36).toUpperCase()}`;
      const paymentPayload = {
        member_id: memberId,
        amount: Number(amount),
        method,
        paid_at: localDateTimeToIso(paidAt),
        added_by: user.id,
        notes: notes || null,
        receipt_id: receiptId,
        screenshot_url: screenshotUrl,
        transaction_id: transactionId || null,
        utr_number: utrNumber || null,
        upi_id: upiId || null,
        sender_name: senderName || null,
      };
      let { data: savedPayment, error } = await supabase.from('payments').insert(paymentPayload).select('id').single();
      if (error?.message.toLowerCase().includes('utr_number')) {
        const { utr_number: _utrNumber, ...legacyPayload } = paymentPayload;
        const retry = await supabase.from('payments').insert(legacyPayload).select('id').single();
        savedPayment = retry.data;
        error = retry.error;
      }
      if (error) throw error;
      if (file && screenshotUrl && savedPayment?.id) {
        await supabase.from('payment_screenshots').insert({
          payment_id: savedPayment.id,
          member_id: memberId,
          storage_path: screenshotUrl,
          ocr_text: ocrText || null,
        });
      }
      toast.success(`Payment saved: ${receiptId}`);
      setAmount('');
      setTransactionId('');
      setUtrNumber('');
      setUpiId('');
      setSenderName('');
      setNotes('');
      setFile(null);
      setOcrText('');
      setProgress(0);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment could not be saved');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 md:ml-60">
      <div>
        <h1 className="text-3xl font-black">Payments</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Scan online screenshots or log cash fast.</p>
      </div>

      <form onSubmit={savePayment} className="mobile-card space-y-4">
        <div>
          <span className="label">Payment screenshot</span>
          <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <FileImage className="text-slate-400" size={32} />
            <p className="mt-2 text-sm font-black">{file ? file.name : 'Upload UPI/bank screenshot'}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">OCR auto-fills amount, UPI, txn ID, date</p>
            <div className="mt-4 grid w-full grid-cols-2 gap-2">
              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-extrabold text-limefit active:scale-[0.98] dark:bg-white dark:text-slate-950">
                <Camera size={18} /> Camera
                <input
                  id="receipt-camera-input"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-extrabold text-slate-700 shadow-sm active:scale-[0.98] dark:bg-slate-900 dark:text-slate-100">
                <Images size={18} /> Gallery
                <input
                  id="receipt-gallery-input"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>
        </div>
        {progress > 0 && progress < 100 && <div className="rounded-lg bg-lime-100 p-3 text-sm font-black text-lime-800">Scanning screenshot... {progress}%</div>}
        {ocrText && (
          <details className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
            <summary className="cursor-pointer font-black">OCR text</summary>
            <p className="mt-2 whitespace-pre-wrap text-slate-500">{ocrText}</p>
          </details>
        )}

        <label>
          <span className="label">Member</span>
          <select className="field" value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
            <option value="">Select member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name} · {member.phone}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Amount</span>
            <input className="field" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </label>
          <label>
            <span className="label">Method</span>
            <select className="field" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              <option value="online">Online</option>
              <option value="cash">Cash</option>
            </select>
          </label>
        </div>
        <label>
          <span className="label">Date and time</span>
          <input className="field" type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Transaction ID" value={transactionId} onChange={setTransactionId} />
          <Field label="UPI ID" value={upiId} onChange={setUpiId} />
        </div>
        <Field label="UTR number" value={utrNumber} onChange={setUtrNumber} />
        <Field label="Sender name" value={senderName} onChange={setSenderName} />
        <label>
          <span className="label">Notes</span>
          <textarea className="field min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <Button className="w-full" size="lg" disabled={saving}>
          <ScanLine size={20} /> {saving ? 'Saving...' : 'Save payment'}
        </Button>
      </form>

      <section className="mobile-card">
        <h2 className="text-lg font-black">Recent payments</h2>
        <div className="mt-4 space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <div>
                <p className="font-black">{payment.members?.full_name ?? 'Member'}</p>
                <p className="text-sm font-semibold text-slate-500">{formatDateTime(payment.paid_at)} · {payment.method}</p>
              </div>
              <p className="font-black">{formatCurrency(payment.amount)}</p>
            </div>
          ))}
          {!payments.length && <EmptyState icon={ReceiptText} title="No payments yet" body="Cash and online receipts will appear here." />}
        </div>
      </section>

      <button className="fixed bottom-24 right-5 grid h-16 w-16 place-items-center rounded-full bg-slate-950 text-limefit shadow-soft dark:bg-white dark:text-slate-950 md:hidden" onClick={() => document.getElementById('receipt-camera-input')?.click()}>
        <Camera size={26} />
      </button>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="field" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localDateTimeToIso(value: string) {
  if (!value) throw new Error('Please enter the receipt date and time.');
  return new Date(value).toISOString();
}
