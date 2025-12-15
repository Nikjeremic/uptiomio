import React, { useEffect, useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { invoiceAPI, nbsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { Invoice } from '../types';
import './SelfTaxCalculator.css';

interface CalculationResult {
  taxableIncome: number;
  tax: number;
  pension: number;
  health: number;
  total: number;
  effectiveRate: number;
}

type TaxOption = 1 | 2;

const N1 = 107_738;
const N2 = 64_979;
const TAX1 = 0.20;
const TAX2 = 0.10;
const PIO_RATE = 0.24;
const PIO_MIN_OPT2 = 33_084;
const HEALTH_RATE = 0.103;
const HEALTH_MIN = 6_276;

function calculateQuarter(
  income: number,
  option: TaxOption,
  hasOtherHealthInsurance: boolean
): CalculationResult {
  const safeIncome = Math.max(0, income || 0);

  if (option === 1) {
    const taxableIncome = Math.max(0, safeIncome - N1);
    const tax = taxableIncome * TAX1;
    const pension = taxableIncome * PIO_RATE;
    const healthBase = taxableIncome * HEALTH_RATE;
    const health = hasOtherHealthInsurance ? 0 : Math.max(HEALTH_MIN, healthBase || 0);
    const total = tax + pension + health;
    const effectiveRate = safeIncome > 0 ? (total / safeIncome) * 100 : 0;

    return { taxableIncome, tax, pension, health, total, effectiveRate };
  }

  // option 2
  const normCosts = N2 + safeIncome * 0.34;
  const taxableIncome = Math.max(0, safeIncome - normCosts);
  const tax = taxableIncome * TAX2;
  const pension = Math.max(PIO_MIN_OPT2, taxableIncome * PIO_RATE);
  const healthBase = taxableIncome * HEALTH_RATE;
  const health = hasOtherHealthInsurance ? 0 : Math.max(HEALTH_MIN, healthBase || 0);
  const total = tax + pension + health;
  const effectiveRate = safeIncome > 0 ? (total / safeIncome) * 100 : 0;

  return { taxableIncome, tax, pension, health, total, effectiveRate };
}

const SelfTaxCalculator: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [income, setIncome] = useState<number | null>(null);
  const [option, setOption] = useState<TaxOption>(1);
  const [hasOtherHealthInsurance, setHasOtherHealthInsurance] = useState(false);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [eurRate, setEurRate] = useState<number | null>(null);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [ratesDate, setRatesDate] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoadingInvoices(true);
        setError(null);
        const { data } = isAdmin
          ? await invoiceAPI.getAllInvoices()
          : await invoiceAPI.getMyInvoices();
        setAllInvoices(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Ne mogu da učitam fakture');
      } finally {
        setLoadingInvoices(false);
      }
    };
    loadInvoices();
  }, [isAdmin]);

  // Load NBS middle rates for EUR and USD
  useEffect(() => {
    (async () => {
      try {
        const { data } = await nbsAPI.getRates();
        if (data) {
          setEurRate(data.eur ?? null);
          setUsdRate(data.usd ?? null);
          setRatesDate(data.date ?? null);
        }
      } catch (e) {
        // silently ignore, rates are optional helper
      }
    })();
  }, []);

  const quarterIncome = useMemo(() => {
    const startMonth = (selectedQuarter - 1) * 3;
    const start = new Date(selectedYear, startMonth, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedYear, startMonth + 3, 1);

    return allInvoices
      .filter((inv) => inv.isPaid && inv.paidAt)
      .filter((inv) => {
        const paid = new Date(inv.paidAt as string);
        return paid >= start && paid < end;
      })
      .reduce((sum, inv) => {
        const rawAmount: any = (inv as any).amount;
        const numericAmount =
          typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) || 0;
        return sum + numericAmount;
      }, 0);
  }, [allInvoices, selectedQuarter, selectedYear]);

  useEffect(() => {
    setIncome(quarterIncome);
  }, [quarterIncome]);

  const incomeValue = income ?? 0;
  const result = calculateQuarter(incomeValue, option, hasOtherHealthInsurance);

  return (
    <div className="self-tax-container">
      <div className="self-tax-header">
        <h1>Samooporezivanje – kalkulator po kvartalu</h1>
        <p>
          Unesi ukupan bruto prihod u kvartalu, izaberi opciju oporezivanja i vidi koliki su porez,
          PIO i zdravstveno po zvaničnom vodiču za frilensere (jun 2025).
        </p>
        {eurRate && usdRate && (
          <p className="rates-info">
            NBS srednji kurs{ratesDate ? ` (${ratesDate})` : ''}: 1 EUR ={' '}
            {eurRate.toFixed(4)} RSD, 1 USD = {usdRate.toFixed(4)} RSD.
          </p>
        )}
      </div>

      <Card className="self-tax-card">
        <div className="self-tax-form">
          <div className="field">
            <label htmlFor="quarter">Kvartal</label>
            <Dropdown
              id="quarter"
              value={selectedQuarter}
              options={[
                { label: 'I kvartal (jan–mart)', value: 1 },
                { label: 'II kvartal (apr–jun)', value: 2 },
                { label: 'III kvartal (jul–sep)', value: 3 },
                { label: 'IV kvartal (okt–dec)', value: 4 }
              ]}
              onChange={(e) => setSelectedQuarter(e.value as 1 | 2 | 3 | 4)}
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="year">Godina</label>
            <Dropdown
              id="year"
              value={selectedYear}
              options={[
                { label: String(currentYear - 1), value: currentYear - 1 },
                { label: String(currentYear), value: currentYear },
                { label: String(currentYear + 1), value: currentYear + 1 }
              ]}
              onChange={(e) => setSelectedYear(e.value as number)}
              className="w-full"
            />
            <small className="field-help">
              Prihod se sabira iz faktura sa statusom Paid i datumom plaćanja u tom kvartalu.
            </small>
          </div>
          <div className="field">
            <label htmlFor="income">Kvartalni prihod (RSD)</label>
            <InputNumber
              id="income"
              value={income}
              onValueChange={(e) => setIncome(e.value ?? 0)}
              mode="currency"
              currency="RSD"
              locale="sr-RS"
              min={0}
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="option">Model oporezivanja</label>
            <Dropdown
              id="option"
              value={option}
              options={[
                { label: 'Opcija 1 – normirani troškovi 107.738 RSD', value: 1 },
                { label: 'Opcija 2 – normirani 64.979 RSD + 34% prihoda', value: 2 }
              ]}
              onChange={(e) => setOption(e.value as TaxOption)}
              className="w-full"
            />
          </div>

          <div className="field checkbox-field">
            <Checkbox
              inputId="health"
              checked={hasOtherHealthInsurance}
              onChange={(e) => setHasOtherHealthInsurance(!!e.checked)}
            />
            <label htmlFor="health">Zdravstveno osiguran sam po drugom osnovu</label>
          </div>
        </div>

        <div className="self-tax-results">
          {loadingInvoices && (
            <div className="results-loading">
              <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
              <span>Učitavam fakture…</span>
            </div>
          )}
          {error && (
            <div className="results-error">
              <Message severity="error" text={error} />
            </div>
          )}
          {!loadingInvoices && !error && (
            <div className="result-row">
              <span>Prihod iz plaćenih faktura</span>
              <span>{quarterIncome.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} RSD</span>
            </div>
          )}
          <h2>Rezultat za kvartal</h2>
          <div className="result-row">
            <span>Oporezivi prihod</span>
            <span>{result.taxableIncome.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} RSD</span>
          </div>
          <div className="result-row">
            <span>Porez</span>
            <span>{result.tax.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} RSD</span>
          </div>
          <div className="result-row">
            <span>PIO doprinos</span>
            <span>{result.pension.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} RSD</span>
          </div>
          <div className="result-row">
            <span>Zdravstveno osiguranje</span>
            <span>{result.health.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} RSD</span>
          </div>
          <div className="result-row total">
            <span>Ukupno za uplatu</span>
            <span>{result.total.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} RSD</span>
          </div>
          <div className="result-row">
            <span>Efektivno opterećenje</span>
            <span>
              {incomeValue > 0 ? result.effectiveRate.toFixed(2) : '0.00'}%
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SelfTaxCalculator;


