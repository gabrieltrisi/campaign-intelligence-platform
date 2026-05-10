import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import './App.css';

// ─────────────────────────────────────────────────────────────────────────────
// ENV
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Campaign = {
  id: string;
  name: string;
  cost: number;
  revenue: number;
  fees: number;
  expenses: number;
  grossProfit: number;
  realProfit: number;
  roas: number;
};

type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type CampaignsResponse = {
  data: Campaign[];
  pagination: Pagination;
};

type FilterType =
  | 'all'
  | 'high-roas'
  | 'profitable'
  | 'attention'
  | 'critical'
  | 'high-investment'
  | 'best-return';

type SortByType =
  | 'createdAt'
  | 'name'
  | 'cost'
  | 'revenue'
  | 'grossProfit'
  | 'realProfit'
  | 'roas';

type OrderType = 'asc' | 'desc';

type FormErrors = {
  name?: string;
  cost?: string;
  revenue?: string;
  fees?: string;
  expenses?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const NAV_ITEMS: {
  filter: FilterType;
  label: string;
  icon: string;
  danger?: boolean;
}[] = [
  { filter: 'all', label: 'Todas as campanhas', icon: '◈' },
  { filter: 'high-roas', label: 'ROAS alto', icon: '⬆' },
  { filter: 'profitable', label: 'Lucrativas', icon: '◎' },
  { filter: 'attention', label: 'Atenção', icon: '◐' },
  { filter: 'critical', label: 'Críticas', icon: '◉', danger: true },
  { filter: 'high-investment', label: 'Maior investimento', icon: '◆' },
  { filter: 'best-return', label: 'Melhor retorno', icon: '◇' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  teal: '#14b8a6',
  tealDim: 'rgba(20,184,166,0.12)',
  tealBorder: 'rgba(20,184,166,0.22)',
  tealGlow: 'rgba(20,184,166,0.35)',
  blue: '#3b82f6',
  blueDim: 'rgba(59,130,246,0.12)',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHover: 'rgba(255,255,255,0.055)',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  bg: '#070b14',
  bgPanel: '#0d1220',
  bgPanelHover: '#0f1526',
  text: '#f1f5f9',
  textMuted: '#64748b',
  textSub: '#94a3b8',
  textDim: '#334155',
  green: '#34d399',
  greenDim: 'rgba(52,211,153,0.12)',
  greenBorder: 'rgba(52,211,153,0.25)',
  red: '#f87171',
  redDim: 'rgba(239,68,68,0.10)',
  redBorder: 'rgba(239,68,68,0.22)',
  amber: '#fbbf24',
  amberDim: 'rgba(251,191,36,0.12)',
  amberBorder: 'rgba(251,191,36,0.25)',
  purple: '#a78bfa',
  purpleDim: 'rgba(167,139,250,0.08)',
  purpleBorder: 'rgba(167,139,250,0.2)',
  orange: '#fb923c',
  orangeDim: 'rgba(251,146,60,0.08)',
  orangeBorder: 'rgba(251,146,60,0.2)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px',
  padding: '11px 14px',
  color: T.text,
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const inputErrorStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${T.redBorder}`,
  borderRadius: '10px',
  padding: '11px 14px',
  color: T.text,
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxShadow: `0 0 0 3px ${T.redDim}`,
};

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: T.textSub,
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const panelStyle: React.CSSProperties = {
  background: T.bgPanel,
  border: `1px solid ${T.border}`,
  borderRadius: '16px',
  padding: '1.5rem',
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getPerformanceLabel(roas: number): string {
  if (roas >= 4) return 'Excelente';
  if (roas >= 2) return 'Boa';
  if (roas >= 1) return 'Atenção';
  return 'Crítica';
}

function getRoasColor(roas: number): string {
  if (roas >= 4) return T.teal;
  if (roas >= 2) return '#60a5fa';
  if (roas >= 1) return T.amber;
  return T.red;
}

function getRoasBg(roas: number): string {
  if (roas >= 4) return T.tealDim;
  if (roas >= 2) return T.blueDim;
  if (roas >= 1) return T.amberDim;
  return T.redDim;
}

function getRoasBorder(roas: number): string {
  if (roas >= 4) return T.tealBorder;
  if (roas >= 2) return 'rgba(59,130,246,0.25)';
  if (roas >= 1) return T.amberBorder;
  return T.redBorder;
}

function getRoasGlow(roas: number): string {
  if (roas >= 4) return 'rgba(20,184,166,0.20)';
  if (roas >= 2) return 'rgba(59,130,246,0.20)';
  if (roas >= 1) return 'rgba(251,191,36,0.20)';
  return 'rgba(239,68,68,0.20)';
}

// ─────────────────────────────────────────────────────────────────────────────
// APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  // ── Auth state ──────────────────────────────────────────────────────────

  const [token, setToken] = useState<string>(
    localStorage.getItem('token') || ''
  );
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // ── Campaigns state ─────────────────────────────────────────────────────

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

  // ── UI state ────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // ── Filter / sort state ─────────────────────────────────────────────────

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortByType>('createdAt');
  const [order, setOrder] = useState<OrderType>('desc');

  // ── Form state ──────────────────────────────────────────────────────────

  const [name, setName] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [revenue, setRevenue] = useState<string>('');
  const [fees, setFees] = useState<string>('');
  const [expenses, setExpenses] = useState<string>('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ── Refs ─────────────────────────────────────────────────────────────────

  const firstInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FILTERED CAMPAIGNS
  // ─────────────────────────────────────────────────────────────────────────

  function getFilteredCampaigns(): Campaign[] {
    const list = [...campaigns];

    switch (activeFilter) {
      case 'high-roas':
        return list.filter((c) => c.roas >= 4);

      case 'profitable':
        return list.filter((c) => c.realProfit > 0);

      case 'attention':
        return list.filter((c) => c.roas >= 1 && c.roas < 2);

      case 'critical':
        return list.filter((c) => c.roas < 1 || c.realProfit < 0);

      case 'high-investment':
        return list.sort((a, b) => b.cost - a.cost);

      case 'best-return':
        return list.sort((a, b) => b.realProfit - a.realProfit);

      default:
        return list;
    }
  }

  const filteredCampaigns = getFilteredCampaigns();

  // ─────────────────────────────────────────────────────────────────────────
  // AGGREGATES
  // ─────────────────────────────────────────────────────────────────────────

  const totalCampaigns = filteredCampaigns.length;

  const totalCost = filteredCampaigns.reduce((acc, item) => acc + item.cost, 0);

  const totalRevenue = filteredCampaigns.reduce(
    (acc, item) => acc + item.revenue,
    0
  );

  const totalGrossProfit = filteredCampaigns.reduce(
    (acc, item) => acc + item.grossProfit,
    0
  );

  const totalRealProfit = filteredCampaigns.reduce(
    (acc, item) => acc + item.realProfit,
    0
  );

  const totalFees = filteredCampaigns.reduce((acc, item) => acc + item.fees, 0);

  const totalExpenses = filteredCampaigns.reduce(
    (acc, item) => acc + item.expenses,
    0
  );

  const averageRoas =
    totalCampaigns > 0
      ? filteredCampaigns.reduce((acc, item) => acc + item.roas, 0) /
        totalCampaigns
      : 0;

  const bestCampaign =
    [...filteredCampaigns].sort((a, b) => b.roas - a.roas)[0] ?? null;

  const worstCampaign =
    [...filteredCampaigns].sort((a, b) => a.roas - b.roas)[0] ?? null;

  const topCampaigns = [...filteredCampaigns]
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5);

  // ─────────────────────────────────────────────────────────────────────────
  // CHART DATA
  // ─────────────────────────────────────────────────────────────────────────

  const barData = filteredCampaigns.map((campaign) => ({
    name: campaign.name,
    Receita: campaign.revenue,
    Custo: campaign.cost,
    Lucro: campaign.realProfit,
  }));

  const roasData = filteredCampaigns.map((campaign) => ({
    name: campaign.name,
    ROAS: Number(campaign.roas.toFixed(2)),
  }));

  const pieData = [
    { name: 'Investimento', value: totalCost },
    { name: 'Taxas', value: totalFees },
    { name: 'Despesas', value: totalExpenses },
    { name: 'Lucro Real', value: Math.max(totalRealProfit, 0) },
  ].filter((item) => item.value > 0);

  // ─────────────────────────────────────────────────────────────────────────
  // INSIGHT TEXTS
  // ─────────────────────────────────────────────────────────────────────────

  const executiveSummary =
    totalCampaigns === 0
      ? 'Nenhuma campanha encontrada para o filtro selecionado.'
      : `As campanhas filtradas geraram ${formatCurrency(totalRevenue)} em retorno, com ${formatCurrency(totalRealProfit)} de lucro real e ROAS médio de ${averageRoas.toFixed(2)}x.`;

  const recommendation =
    totalCampaigns === 0
      ? 'Cadastre novas campanhas ou altere o filtro para visualizar os dados.'
      : averageRoas >= 4
        ? 'Performance excelente. Considere escalar verba nas campanhas com maior ROAS.'
        : averageRoas >= 2
          ? 'Performance saudável. Monitore custos e priorize campanhas com lucro real positivo.'
          : averageRoas >= 1
            ? 'Performance em atenção. Revise criativos, segmentação e distribuição de verba.'
            : 'Performance crítica. Reavalie investimento, oferta e canais antes de escalar.';

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────

  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setCampaigns([]);
    setPagination(DEFAULT_PAGINATION);
    setHasError(false);
    toast.success('Sessão encerrada.');
  }

  async function login() {
    if (!email || !password) {
      toast.error('Informe e-mail e senha.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Erro ao fazer login.');
        return;
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      toast.success('Login realizado com sucesso.');
    } catch {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CAMPAIGNS API FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────

  async function loadCampaigns(page = 1, isInitial = false) {
    if (isInitial) setInitialLoading(true);
    setHasError(false);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        search: debouncedSearch,
        sortBy,
        order,
      });

      const response = await fetch(`${API_URL}/campaigns?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        logout();
        return;
      }

      if (!response.ok) {
        setHasError(true);
        toast.error('Erro ao carregar campanhas.');
        return;
      }

      const data: CampaignsResponse = await response.json();
      setCampaigns(data.data);
      setPagination(data.pagination);
    } catch {
      setHasError(true);
      toast.error('Erro ao carregar campanhas.');
    } finally {
      setInitialLoading(false);
    }
  }

  function validateForm(): FormErrors {
    const errors: FormErrors = {};

    const parsedCost = Number(cost);
    const parsedRevenue = Number(revenue);
    const parsedFees = Number(fees || 0);
    const parsedExpenses = Number(expenses || 0);

    if (!name.trim()) {
      errors.name = 'Informe o nome da campanha.';
    }

    if (!cost) {
      errors.cost = 'Informe o valor do investimento.';
    } else if (Number.isNaN(parsedCost)) {
      errors.cost = 'Valor numérico inválido.';
    } else if (parsedCost <= 0) {
      errors.cost = 'O investimento deve ser maior que zero.';
    }

    if (!revenue) {
      errors.revenue = 'Informe o retorno gerado.';
    } else if (Number.isNaN(parsedRevenue)) {
      errors.revenue = 'Valor numérico inválido.';
    } else if (parsedRevenue < 0) {
      errors.revenue = 'O retorno não pode ser negativo.';
    }

    if (fees && Number.isNaN(parsedFees)) {
      errors.fees = 'Valor numérico inválido.';
    } else if (fees && parsedFees < 0) {
      errors.fees = 'As taxas não podem ser negativas.';
    }

    if (expenses && Number.isNaN(parsedExpenses)) {
      errors.expenses = 'Valor numérico inválido.';
    } else if (expenses && parsedExpenses < 0) {
      errors.expenses = 'As despesas não podem ser negativas.';
    }

    return errors;
  }

  async function createCampaign() {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Corrija os campos destacados antes de continuar.');
      return;
    }

    setFormErrors({});
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          cost: Number(cost),
          revenue: Number(revenue),
          fees: Number(fees || 0),
          expenses: Number(expenses || 0),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.message || 'Erro ao criar campanha.');
        return;
      }

      setName('');
      setCost('');
      setRevenue('');
      setFees('');
      setExpenses('');
      setFormErrors({});

      toast.success('Campanha criada com sucesso!');
      await loadCampaigns(1);
      firstInputRef.current?.focus();
    } catch {
      toast.error('Erro ao criar campanha.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteCampaign(id: string, campaignName: string) {
    const confirmed = confirm(
      `Remover a campanha "${campaignName}"?\n\nEsta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok && response.status !== 204) {
        toast.error('Erro ao remover campanha.');
        return;
      }

      toast.success('Campanha removida com sucesso.');
      await loadCampaigns(pagination.page);
    } catch {
      toast.error('Erro ao remover campanha.');
    } finally {
      setLoading(false);
    }
  }

  function goToPreviousPage() {
    if (pagination.hasPreviousPage) {
      loadCampaigns(pagination.page - 1);
    }
  }

  function goToNextPage() {
    if (pagination.hasNextPage) {
      loadCampaigns(pagination.page + 1);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (token) {
      loadCampaigns(1, campaigns.length === 0);
    }
  }, [token, debouncedSearch, sortBy, order]);

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <>
        {loading && <LoadingOverlay />}

        <main
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            minHeight: '100vh',
            background: T.bg,
            fontFamily: "'Inter', 'system-ui', sans-serif",
          }}
        >
          {/* ════════════════════════════════
              HERO — LEFT COLUMN
          ════════════════════════════════ */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '4rem',
              position: 'relative',
              overflow: 'hidden',
              borderRight: `1px solid ${T.tealBorder}`,
            }}
          >
            {/* grid background */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage: `linear-gradient(${T.tealDim} 1px, transparent 1px),
                                  linear-gradient(90deg, ${T.tealDim} 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
                opacity: 0.35,
              }}
            />

            {/* glow — top left */}
            <div
              style={{
                position: 'absolute',
                top: '-180px',
                left: '-180px',
                width: '560px',
                height: '560px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 65%)',
                pointerEvents: 'none',
              }}
            />

            {/* glow — bottom right */}
            <div
              style={{
                position: 'absolute',
                bottom: '-120px',
                right: '-120px',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* platform badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: T.tealDim,
                  border: `1px solid ${T.tealBorder}`,
                  borderRadius: '999px',
                  padding: '5px 16px',
                  marginBottom: '2.25rem',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: T.teal,
                    boxShadow: `0 0 8px ${T.teal}`,
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontSize: '11.5px',
                    color: T.teal,
                    letterSpacing: '0.07em',
                    fontWeight: 600,
                  }}
                >
                  Campaign Intelligence Platform
                </span>
              </div>

              {/* headline */}
              <h1
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  color: T.text,
                  lineHeight: 1.18,
                  marginBottom: '1.25rem',
                  letterSpacing: '-0.03em',
                }}
              >
                Transforme dados de
                <br />
                <span
                  style={{
                    color: T.teal,
                    textShadow: `0 0 32px ${T.tealGlow}`,
                  }}
                >
                  marketing
                </span>{' '}
                em decisões
                <br />
                estratégicas.
              </h1>

              {/* subtitle */}
              <p
                style={{
                  fontSize: '1rem',
                  color: T.textMuted,
                  lineHeight: 1.75,
                  maxWidth: '400px',
                  marginBottom: '2.75rem',
                }}
              >
                Acompanhe ROAS, lucro real, KPIs financeiros e performance de
                campanhas em um único painel inteligente.
              </p>

              {/* mock KPI cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  maxWidth: '400px',
                }}
              >
                {[
                  {
                    label: 'ROAS Médio',
                    value: '3.82×',
                    sub: '↑ vs. mês anterior',
                  },
                  {
                    label: 'Lucro Real',
                    value: 'R$ 85k',
                    sub: 'após taxas e custos',
                  },
                  {
                    label: 'Campanhas',
                    value: '+120',
                    sub: 'ativas monitoradas',
                  },
                ].map((card) => (
                  <div key={card.label} className='login-kpi-card'>
                    <div className='login-kpi-value'>{card.value}</div>
                    <div className='login-kpi-label'>{card.label}</div>
                    <div className='login-kpi-sub'>{card.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════
              LOGIN FORM — RIGHT COLUMN
          ════════════════════════════════ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 3rem',
              background:
                'linear-gradient(135deg, rgba(7,11,20,0.6) 0%, rgba(13,18,32,0.8) 100%)',
            }}
          >
            <div className='login-card'>
              {/* logo mark */}
              <div className='login-logo'>◈</div>

              {/* eyebrow */}
              <span className='login-eyebrow'>Campaign Intelligence</span>

              {/* title */}
              <h2 className='login-title'>Bem-vindo de volta</h2>

              {/* subtitle */}
              <p className='login-subtitle'>
                Acesse o painel de performance de campanhas.
              </p>

              {/* fields */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '1.5rem',
                }}
              >
                <input
                  placeholder='E-mail corporativo'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login()}
                  style={inputStyle}
                />
                <input
                  placeholder='Senha'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login()}
                  style={inputStyle}
                />
              </div>

              {/* submit */}
              <button
                onClick={login}
                disabled={loading}
                className='btn-primary'
                style={{ width: '100%', padding: '14px', fontSize: '14px' }}
              >
                {loading ? (
                  <>
                    <span className='btn-spinner' />
                    Entrando...
                  </>
                ) : (
                  'Entrar no painel →'
                )}
              </button>

              {/* footer note */}
              <p className='login-footer'>
                Plataforma segura · Dados criptografados
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {loading && <LoadingOverlay />}

      <main
        className='dashboard-page'
        style={{
          background: T.bg,
          fontFamily: "'Inter', 'system-ui', sans-serif",
          minHeight: '100vh',
          display: 'flex',
        }}
      >
        {/* ════════════════════════════════════════════════════
            SIDEBAR
        ════════════════════════════════════════════════════ */}
        <aside
          className='sidebar'
          style={{
            background: 'rgba(13,18,32,0.95)',
            borderRight: `1px solid ${T.border}`,
            backdropFilter: 'blur(12px)',
            padding: '1.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '220px',
          }}
        >
          {/* brand */}
          <div style={{ padding: '0 0.5rem 1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '4px',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: T.tealDim,
                  border: `1px solid ${T.tealBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  color: T.teal,
                }}
              >
                ◈
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: T.text,
                  letterSpacing: '-0.01em',
                }}
              >
                Campaign Intelligence
              </span>
            </div>
            <div
              style={{
                fontSize: '10px',
                color: T.textMuted,
                paddingLeft: '38px',
                letterSpacing: '0.04em',
              }}
            >
              Analytics Platform
            </div>
          </div>

          {/* divider */}
          <div
            style={{
              height: '1px',
              background: T.border,
              margin: '0 0.5rem 1rem',
            }}
          />

          {/* navigation */}
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              flex: 1,
            }}
          >
            {NAV_ITEMS.map(({ filter, label, icon, danger }) => {
              const isActive = activeFilter === filter;

              return (
                <button
                  key={filter}
                  className={`sidebar-tab${isActive ? ' active' : ''}`}
                  onClick={() => {
                    setActiveFilter(filter);

                    if (filter === 'high-investment') {
                      setSortBy('cost');
                      setOrder('desc');
                    }

                    if (filter === 'best-return') {
                      setSortBy('realProfit');
                      setOrder('desc');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? T.tealDim : 'transparent',
                    color: isActive ? T.teal : danger ? T.red : T.textMuted,
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s',
                    borderLeft: isActive
                      ? `2px solid ${T.teal}`
                      : '2px solid transparent',
                  }}
                >
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </nav>

          {/* logout */}
          <div
            style={{
              marginTop: 'auto',
              padding: '1rem 0.5rem 0',
              borderTop: `1px solid ${T.border}`,
            }}
          >
            <button
              className='secondary'
              onClick={logout}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'transparent',
                border: `1px solid ${T.border}`,
                borderRadius: '10px',
                color: T.textMuted,
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              Encerrar sessão
            </button>
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════
            MAIN CONTENT
        ════════════════════════════════════════════════════ */}
        <section
          className='content'
          style={{ flex: 1, overflowY: 'auto', padding: '0' }}
        >
          {/* ── Topbar ── */}
          <header
            style={{
              padding: '1.75rem 2rem 0',
              borderBottom: `1px solid ${T.border}`,
              background: 'rgba(7,11,20,0.7)',
              backdropFilter: 'blur(12px)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  paddingBottom: '1.25rem',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      letterSpacing: '0.1em',
                      fontWeight: 700,
                      color: T.teal,
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Desempenho de marketing
                  </span>

                  <h1
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: T.text,
                      letterSpacing: '-0.025em',
                      margin: '0 0 4px',
                    }}
                  >
                    Painel de Campanhas
                  </h1>

                  <p
                    style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}
                  >
                    Acompanhe investimento, retorno, lucro real e eficiência das
                    suas campanhas em tempo real.
                  </p>
                </div>

                {/* live indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    background: T.tealDim,
                    border: `1px solid ${T.tealBorder}`,
                    borderRadius: '999px',
                    padding: '5px 14px',
                    fontSize: '11px',
                    color: T.teal,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  <span className='live-dot' />
                  Live
                </div>
              </div>
            </div>
          </header>

          {/* ── Page body ── */}
          <div
            style={{
              padding: '2rem',
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* ── Search & sort bar ── */}
            <div
              style={{
                ...panelStyle,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  placeholder='Pesquisar campanha por nome...'
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  style={{
                    ...inputStyle,
                    flex: 1,
                    minWidth: '200px',
                    fontSize: '13px',
                  }}
                />

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortByType)
                  }
                  style={selectStyle}
                >
                  <option value='createdAt'>Mais recentes</option>
                  <option value='name'>Nome</option>
                  <option value='roas'>ROAS</option>
                  <option value='revenue'>Receita</option>
                  <option value='cost'>Investimento</option>
                  <option value='realProfit'>Lucro real</option>
                  <option value='grossProfit'>Lucro bruto</option>
                </select>

                <select
                  value={order}
                  onChange={(event) =>
                    setOrder(event.target.value as OrderType)
                  }
                  style={selectStyle}
                >
                  <option value='desc'>Descendente</option>
                  <option value='asc'>Ascendente</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '12px', color: T.textMuted }}>
                  Exibindo{' '}
                  <strong style={{ color: T.text }}>
                    {filteredCampaigns.length}
                  </strong>{' '}
                  de{' '}
                  <strong style={{ color: T.text }}>
                    {pagination.totalItems}
                  </strong>{' '}
                  campanhas
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    color: T.textMuted,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: '6px',
                    padding: '3px 10px',
                  }}
                >
                  Página {pagination.page} / {pagination.totalPages || 1}
                </span>
              </div>
            </div>

            {/* ── Skeleton loading ── */}
            {initialLoading && (
              <div className='skeleton-wrapper'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='skeleton-card'>
                    <div className='skeleton-line short' />
                    <div className='skeleton-line tall' />
                    <div className='skeleton-line medium' />
                  </div>
                ))}
              </div>
            )}

            {/* ── Error state ── */}
            {hasError && !initialLoading && (
              <div className='error-state-block'>
                <div className='error-state-icon'>⚠</div>
                <strong>Não foi possível carregar as campanhas</strong>
                <span>
                  Verifique sua conexão com o servidor e tente novamente.
                </span>
                <button
                  className='btn-primary'
                  onClick={() => loadCampaigns(1, true)}
                  style={{
                    marginTop: '1rem',
                    padding: '10px 24px',
                    width: 'auto',
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* ── Dashboard body (only shown when not loading and no error) ── */}
            {!initialLoading && !hasError && (
              <>
                {/* ════════════════════════════════
                    INSIGHT CARDS
                ════════════════════════════════ */}
                <section
                  className='insights-grid'
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {[
                    {
                      label: 'Resumo executivo',
                      value: executiveSummary,
                      accent: T.teal,
                      accentBg: T.tealDim,
                      accentBorder: T.tealBorder,
                      icon: '◈',
                    },
                    {
                      label: 'Recomendação estratégica',
                      value: recommendation,
                      accent: T.purple,
                      accentBg: T.purpleDim,
                      accentBorder: T.purpleBorder,
                      icon: '◎',
                    },
                    {
                      label: 'Melhor campanha',
                      value: bestCampaign
                        ? `${bestCampaign.name} · ${bestCampaign.roas.toFixed(2)}×`
                        : 'Sem dados',
                      accent: T.green,
                      accentBg: T.greenDim,
                      accentBorder: T.greenBorder,
                      icon: '◆',
                    },
                    {
                      label: 'Ponto de atenção',
                      value: worstCampaign
                        ? `${worstCampaign.name} · ${worstCampaign.roas.toFixed(2)}×`
                        : 'Sem dados',
                      accent: T.orange,
                      accentBg: T.orangeDim,
                      accentBorder: T.orangeBorder,
                      icon: '◐',
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className='insight-card'
                      style={{
                        background: T.bgPanel,
                        border: `1px solid ${T.border}`,
                        borderTop: `2px solid ${card.accent}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          marginBottom: '10px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            color: card.accent,
                            background: card.accentBg,
                            border: `1px solid ${card.accentBorder}`,
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {card.icon} {card.label}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: '13px',
                          color: T.text,
                          lineHeight: 1.6,
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        {card.value}
                      </p>
                    </div>
                  ))}
                </section>

                {/* ════════════════════════════════
                    KPI GRID
                ════════════════════════════════ */}
                <section
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {[
                    {
                      label: 'Retorno Gerado',
                      value: formatCurrency(totalRevenue),
                      sub: `${totalCampaigns} campanhas`,
                      highlight: false,
                      valueColor: undefined as string | undefined,
                    },
                    {
                      label: 'Investimento',
                      value: formatCurrency(totalCost),
                      sub: 'Verba aplicada',
                      highlight: false,
                      valueColor: undefined,
                    },
                    {
                      label: 'Lucro Bruto',
                      value: formatCurrency(totalGrossProfit),
                      sub: 'Receita − investimento',
                      highlight: false,
                      valueColor: totalGrossProfit >= 0 ? T.green : T.red,
                    },
                    {
                      label: 'Lucro Real',
                      value: formatCurrency(totalRealProfit),
                      sub: 'Após taxas e despesas',
                      highlight: true,
                      valueColor: totalRealProfit >= 0 ? T.green : T.red,
                    },
                    {
                      label: 'ROAS Médio',
                      value: `${averageRoas.toFixed(2)}×`,
                      sub: 'Eficiência média',
                      highlight: false,
                      valueColor: getRoasColor(averageRoas),
                    },
                    {
                      label: 'Melhor Campanha',
                      value: bestCampaign?.name || '—',
                      sub: bestCampaign
                        ? `${bestCampaign.roas.toFixed(2)}× ROAS`
                        : 'Sem dados',
                      highlight: false,
                      valueColor: undefined,
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className={`kpi-card${kpi.highlight ? ' active' : ''}`}
                      style={{
                        background: kpi.highlight ? T.tealDim : T.bgPanel,
                        border: `1px solid ${kpi.highlight ? T.tealBorder : T.border}`,
                        borderRadius: '14px',
                        padding: '1.25rem',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {kpi.highlight && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: `linear-gradient(90deg, ${T.teal}, transparent)`,
                          }}
                        />
                      )}

                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: kpi.highlight ? T.teal : T.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: '8px',
                        }}
                      >
                        {kpi.label}
                      </div>

                      <div
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          color:
                            kpi.valueColor ?? (kpi.highlight ? T.teal : T.text),
                          letterSpacing: '-0.02em',
                          marginBottom: '4px',
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {kpi.value}
                      </div>

                      <div style={{ fontSize: '11px', color: T.textMuted }}>
                        {kpi.sub}
                      </div>
                    </div>
                  ))}
                </section>

                {/* ════════════════════════════════
                    CHARTS GRID
                ════════════════════════════════ */}
                <section
                  className='charts-grid'
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                  }}
                >
                  {/* ── Bar chart — full width ── */}
                  <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
                    <PanelHeader
                      title='Retorno, Investimento e Lucro por Campanha'
                      sub='Comparativo de performance financeira'
                    />

                    {filteredCampaigns.length > 0 ? (
                      <ResponsiveContainer width='100%' height={320}>
                        <BarChart data={barData}>
                          <CartesianGrid
                            strokeDasharray='3 3'
                            vertical={false}
                            stroke='rgba(255,255,255,0.05)'
                          />
                          <XAxis
                            dataKey='name'
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#0d1220',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '10px',
                            }}
                            labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                            itemStyle={{ color: '#94a3b8' }}
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                          <Bar
                            dataKey='Receita'
                            fill='#14b8a6'
                            radius={[5, 5, 0, 0]}
                          />
                          <Bar
                            dataKey='Custo'
                            fill='#1e293b'
                            radius={[5, 5, 0, 0]}
                          />
                          <Bar
                            dataKey='Lucro'
                            fill='#3b82f6'
                            radius={[5, 5, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState
                        title='Nenhuma campanha para exibir'
                        sub='Crie uma campanha ou altere o filtro.'
                      />
                    )}
                  </div>

                  {/* ── Pie chart ── */}
                  <div style={panelStyle}>
                    <PanelHeader
                      title='Distribuição da Verba'
                      sub='Investimento, taxas, despesas e lucro'
                    />

                    {pieData.length > 0 ? (
                      <ResponsiveContainer width='100%' height={280}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey='value'
                            nameKey='name'
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={4}
                          >
                            {pieData.map((_, index) => (
                              <Cell
                                key={index}
                                fill={
                                  ['#1e293b', '#f59e0b', '#ef4444', '#14b8a6'][
                                    index % 4
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#0d1220',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '10px',
                            }}
                            itemStyle={{ color: '#94a3b8' }}
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState
                        title='Sem dados financeiros'
                        sub='Cadastre uma campanha para ver a distribuição.'
                      />
                    )}
                  </div>

                  {/* ── ROAS horizontal bar ── */}
                  <div style={panelStyle}>
                    <PanelHeader
                      title='Eficiência por Campanha'
                      sub='ROAS individual'
                    />

                    {filteredCampaigns.length > 0 ? (
                      <ResponsiveContainer width='100%' height={280}>
                        <BarChart data={roasData} layout='vertical'>
                          <CartesianGrid
                            strokeDasharray='3 3'
                            horizontal={false}
                            stroke='rgba(255,255,255,0.05)'
                          />
                          <XAxis
                            type='number'
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            dataKey='name'
                            type='category'
                            width={100}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#0d1220',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '10px',
                            }}
                            itemStyle={{ color: '#94a3b8' }}
                            formatter={(value) =>
                              `${Number(value).toFixed(2)}×`
                            }
                          />
                          <Bar
                            dataKey='ROAS'
                            fill='#14b8a6'
                            radius={[0, 5, 5, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState
                        title='Nenhum ROAS calculado'
                        sub='Adicione campanhas para analisar eficiência.'
                      />
                    )}
                  </div>

                  {/* ── Ranking ── */}
                  <div style={panelStyle}>
                    <PanelHeader
                      title='Ranking de Performance'
                      sub='Top campanhas por ROAS'
                    />

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        marginTop: '4px',
                      }}
                    >
                      {topCampaigns.length > 0 ? (
                        topCampaigns.map((campaign, index) => (
                          <div key={campaign.id} className='ranking-item'>
                            <div
                              className='ranking-position'
                              style={
                                index === 0
                                  ? {
                                      background: T.tealDim,
                                      border: `1px solid ${T.tealBorder}`,
                                      color: T.teal,
                                    }
                                  : {}
                              }
                            >
                              {index + 1}
                            </div>

                            <div className='ranking-info'>
                              <strong>{campaign.name}</strong>
                              <span>
                                {formatCurrency(campaign.realProfit)} lucro real
                              </span>
                            </div>

                            <span
                              className='performance-badge'
                              style={{
                                background: getRoasBg(campaign.roas),
                                color: getRoasColor(campaign.roas),
                                border: `1px solid ${getRoasBorder(campaign.roas)}`,
                              }}
                            >
                              {campaign.roas.toFixed(2)}×
                            </span>
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          title='Sem ranking disponível'
                          sub='Cadastre campanhas para montar o ranking.'
                        />
                      )}
                    </div>
                  </div>

                  {/* ════════════════════════════════
                      CREATE CAMPAIGN FORM
                  ════════════════════════════════ */}
                  <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
                    <PanelHeader
                      title='Criar Campanha'
                      sub='Registre uma nova campanha no painel'
                    />

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '12px',
                        marginBottom: '16px',
                      }}
                    >
                      {/* Nome */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <input
                          ref={firstInputRef}
                          placeholder='Nome da campanha *'
                          type='text'
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (formErrors.name) {
                              setFormErrors((prev) => ({
                                ...prev,
                                name: undefined,
                              }));
                            }
                          }}
                          style={
                            formErrors.name
                              ? { ...inputErrorStyle, fontSize: '13px' }
                              : { ...inputStyle, fontSize: '13px' }
                          }
                        />
                        {formErrors.name && (
                          <span className='field-error'>{formErrors.name}</span>
                        )}
                      </div>

                      {/* Investimento */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <input
                          placeholder='Investimento (R$) *'
                          type='number'
                          value={cost}
                          onChange={(e) => {
                            setCost(e.target.value);
                            if (formErrors.cost) {
                              setFormErrors((prev) => ({
                                ...prev,
                                cost: undefined,
                              }));
                            }
                          }}
                          style={
                            formErrors.cost
                              ? { ...inputErrorStyle, fontSize: '13px' }
                              : { ...inputStyle, fontSize: '13px' }
                          }
                        />
                        {formErrors.cost && (
                          <span className='field-error'>{formErrors.cost}</span>
                        )}
                      </div>

                      {/* Retorno */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <input
                          placeholder='Retorno gerado (R$) *'
                          type='number'
                          value={revenue}
                          onChange={(e) => {
                            setRevenue(e.target.value);
                            if (formErrors.revenue) {
                              setFormErrors((prev) => ({
                                ...prev,
                                revenue: undefined,
                              }));
                            }
                          }}
                          style={
                            formErrors.revenue
                              ? { ...inputErrorStyle, fontSize: '13px' }
                              : { ...inputStyle, fontSize: '13px' }
                          }
                        />
                        {formErrors.revenue && (
                          <span className='field-error'>
                            {formErrors.revenue}
                          </span>
                        )}
                      </div>

                      {/* Taxas */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <input
                          placeholder='Taxas (R$)'
                          type='number'
                          value={fees}
                          onChange={(e) => {
                            setFees(e.target.value);
                            if (formErrors.fees) {
                              setFormErrors((prev) => ({
                                ...prev,
                                fees: undefined,
                              }));
                            }
                          }}
                          style={
                            formErrors.fees
                              ? { ...inputErrorStyle, fontSize: '13px' }
                              : { ...inputStyle, fontSize: '13px' }
                          }
                        />
                        {formErrors.fees && (
                          <span className='field-error'>{formErrors.fees}</span>
                        )}
                      </div>

                      {/* Despesas */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <input
                          placeholder='Despesas (R$)'
                          type='number'
                          value={expenses}
                          onChange={(e) => {
                            setExpenses(e.target.value);
                            if (formErrors.expenses) {
                              setFormErrors((prev) => ({
                                ...prev,
                                expenses: undefined,
                              }));
                            }
                          }}
                          style={
                            formErrors.expenses
                              ? { ...inputErrorStyle, fontSize: '13px' }
                              : { ...inputStyle, fontSize: '13px' }
                          }
                        />
                        {formErrors.expenses && (
                          <span className='field-error'>
                            {formErrors.expenses}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={createCampaign}
                      disabled={loading}
                      className='btn-primary'
                      style={{ padding: '12px 28px', width: 'auto' }}
                    >
                      {loading ? (
                        <>
                          <span className='btn-spinner' />
                          Criando...
                        </>
                      ) : (
                        '+ Criar campanha'
                      )}
                    </button>
                  </div>
                </section>

                {/* ════════════════════════════════
                    CAMPAIGNS TABLE
                ════════════════════════════════ */}
                <section style={{ ...panelStyle, overflow: 'hidden' }}>
                  <PanelHeader
                    title='Campanhas'
                    sub='Listagem filtrada para análise de tráfego pago'
                  />

                  {filteredCampaigns.length === 0 ? (
                    <div className='empty-campaigns-block'>
                      <div className='empty-campaigns-icon'>◈</div>
                      <strong>Nenhuma campanha encontrada</strong>
                      <span>
                        {searchTerm
                          ? `Nenhum resultado para "${searchTerm}". Tente outro termo.`
                          : 'Crie sua primeira campanha ou selecione outro filtro na barra lateral.'}
                      </span>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '13px',
                        }}
                      >
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                            {[
                              'Nome',
                              'Investimento',
                              'Retorno',
                              'Lucro Real',
                              'Eficiência',
                              '',
                            ].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'left',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  color: T.textMuted,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.07em',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {filteredCampaigns.map((campaign) => (
                            <tr
                              key={campaign.id}
                              className='table-row'
                              style={{
                                borderBottom: `1px solid ${T.border}`,
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  T.surfaceHover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  'transparent';
                              }}
                            >
                              <td
                                style={{
                                  padding: '12px',
                                  color: T.text,
                                  fontWeight: 500,
                                }}
                              >
                                {campaign.name}
                              </td>

                              <td
                                style={{ padding: '12px', color: T.textMuted }}
                              >
                                {formatCurrency(campaign.cost)}
                              </td>

                              <td
                                style={{ padding: '12px', color: T.textMuted }}
                              >
                                {formatCurrency(campaign.revenue)}
                              </td>

                              <td style={{ padding: '12px' }}>
                                <span
                                  style={{
                                    color:
                                      campaign.realProfit >= 0
                                        ? T.green
                                        : T.red,
                                    fontWeight: 600,
                                  }}
                                >
                                  {formatCurrency(campaign.realProfit)}
                                </span>
                              </td>

                              <td style={{ padding: '12px' }}>
                                <span
                                  className='performance-badge'
                                  style={{
                                    background: getRoasBg(campaign.roas),
                                    color: getRoasColor(campaign.roas),
                                    border: `1px solid ${getRoasBorder(campaign.roas)}`,
                                    boxShadow: `0 0 12px ${getRoasGlow(campaign.roas)}`,
                                  }}
                                >
                                  {getPerformanceLabel(campaign.roas)} ·{' '}
                                  {campaign.roas.toFixed(2)}×
                                </span>
                              </td>

                              <td
                                style={{ padding: '12px', textAlign: 'right' }}
                              >
                                <button
                                  className='danger'
                                  onClick={() =>
                                    deleteCampaign(campaign.id, campaign.name)
                                  }
                                  style={{
                                    padding: '5px 12px',
                                    background: T.redDim,
                                    border: `1px solid ${T.redBorder}`,
                                    borderRadius: '7px',
                                    color: T.red,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 0 0',
                      borderTop: `1px solid ${T.border}`,
                      marginTop: '12px',
                    }}
                  >
                    <button
                      onClick={goToPreviousPage}
                      disabled={!pagination.hasPreviousPage}
                      className='btn-page'
                    >
                      ← Anterior
                    </button>

                    <span style={{ fontSize: '12px', color: T.textMuted }}>
                      Página{' '}
                      <strong style={{ color: T.text }}>
                        {pagination.page}
                      </strong>{' '}
                      de{' '}
                      <strong style={{ color: T.text }}>
                        {pagination.totalPages || 1}
                      </strong>
                    </span>

                    <button
                      onClick={goToNextPage}
                      disabled={!pagination.hasNextPage}
                      className='btn-page'
                    >
                      Próxima →
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function LoadingOverlay() {
  return (
    <div className='loading-overlay'>
      <div className='loading-card'>
        <div className='loading-spinner' />
        <strong>Processando</strong>
        <span>Aguarde alguns segundos...</span>
      </div>
    </div>
  );
}

function PanelHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#f1f5f9',
          margin: '0 0 3px',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <span style={{ fontSize: '11.5px', color: '#64748b' }}>{sub}</span>
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '2.5rem 1rem',
        color: '#64748b',
      }}
    >
      <div
        style={{
          fontSize: '24px',
          marginBottom: '10px',
          opacity: 0.4,
        }}
      >
        ◈
      </div>
      <strong
        style={{
          display: 'block',
          fontSize: '13px',
          color: '#94a3b8',
          marginBottom: '4px',
        }}
      >
        {title}
      </strong>
      <span style={{ fontSize: '12px' }}>{sub}</span>
    </div>
  );
}

export default App;
