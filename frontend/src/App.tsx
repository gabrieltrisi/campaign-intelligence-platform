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

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

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

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [sortBy, setSortBy] = useState<SortByType>('createdAt');
  const [order, setOrder] = useState<OrderType>('desc');

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [revenue, setRevenue] = useState('');
  const [fees, setFees] = useState('');
  const [expenses, setExpenses] = useState('');

  function getFilteredCampaigns() {
    let filtered = [...campaigns];

    if (activeFilter === 'high-roas') {
      return filtered.filter((campaign) => campaign.roas >= 4);
    }

    if (activeFilter === 'profitable') {
      return filtered.filter((campaign) => campaign.realProfit > 0);
    }

    if (activeFilter === 'attention') {
      return filtered.filter(
        (campaign) => campaign.roas >= 1 && campaign.roas < 2
      );
    }

    if (activeFilter === 'critical') {
      return filtered.filter(
        (campaign) => campaign.roas < 1 || campaign.realProfit < 0
      );
    }

    if (activeFilter === 'high-investment') {
      return filtered.sort((a, b) => b.cost - a.cost);
    }

    if (activeFilter === 'best-return') {
      return filtered.sort((a, b) => b.realProfit - a.realProfit);
    }

    return filtered;
  }

  const filteredCampaigns = getFilteredCampaigns();

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

  const bestCampaign = [...filteredCampaigns].sort(
    (a, b) => b.roas - a.roas
  )[0];

  const worstCampaign = [...filteredCampaigns].sort(
    (a, b) => a.roas - b.roas
  )[0];

  const topCampaigns = [...filteredCampaigns]
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5);

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
    {
      name: 'Lucro Real',
      value: Math.max(totalRealProfit, 0),
    },
  ].filter((item) => item.value > 0);

  const executiveSummary =
    totalCampaigns === 0
      ? 'Nenhuma campanha encontrada para o filtro selecionado.'
      : `As campanhas filtradas geraram ${formatCurrency(
          totalRevenue
        )} em retorno, com ${formatCurrency(
          totalRealProfit
        )} de lucro real e ROAS médio de ${averageRoas.toFixed(2)}x.`;

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

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function getPerformanceLabel(roas: number) {
    if (roas >= 4) return 'Excelente';
    if (roas >= 2) return 'Boa';
    if (roas >= 1) return 'Atenção';
    return 'Crítica';
  }

  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setCampaigns([]);
    setPagination({
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
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

  async function loadCampaigns(page = 1) {
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
        toast.error('Erro ao carregar campanhas.');
        return;
      }

      const data: CampaignsResponse = await response.json();
      setCampaigns(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Erro ao carregar campanhas.');
    }
  }

  async function createCampaign() {
    const parsedCost = Number(cost);
    const parsedRevenue = Number(revenue);
    const parsedFees = Number(fees || 0);
    const parsedExpenses = Number(expenses || 0);

    if (!name || !cost || !revenue) {
      toast.error('Preencha nome, investimento e retorno gerado.');
      return;
    }

    if (
      Number.isNaN(parsedCost) ||
      Number.isNaN(parsedRevenue) ||
      Number.isNaN(parsedFees) ||
      Number.isNaN(parsedExpenses)
    ) {
      toast.error('Informe apenas valores numéricos.');
      return;
    }

    if (parsedCost <= 0) {
      toast.error('O investimento deve ser maior que zero.');
      return;
    }

    if (parsedRevenue < 0 || parsedFees < 0 || parsedExpenses < 0) {
      toast.error('Retorno, taxas e despesas não podem ser negativos.');
      return;
    }

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
          cost: parsedCost,
          revenue: parsedRevenue,
          fees: parsedFees,
          expenses: parsedExpenses,
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

      toast.success('Campanha criada com sucesso.');
      await loadCampaigns(1);
    } catch {
      toast.error('Erro ao criar campanha.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteCampaign(id: string) {
    const confirmed = confirm('Deseja remover esta campanha?');
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

      toast.success('Campanha removida.');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (token) {
      loadCampaigns(1);
    }
  }, [token, debouncedSearch, sortBy, order]);

  // ─── Styles ───────────────────────────────────────────────────────────────

  const S = {
    // shared tokens
    teal: '#14b8a6',
    tealDim: 'rgba(20,184,166,0.12)',
    tealBorder: 'rgba(20,184,166,0.22)',
    blue: '#3b82f6',
    surface: 'rgba(255,255,255,0.03)',
    surfaceHover: 'rgba(255,255,255,0.055)',
    border: 'rgba(255,255,255,0.07)',
    borderStrong: 'rgba(255,255,255,0.12)',
    bg: '#070b14',
    bgPanel: '#0d1220',
    text: '#f1f5f9',
    textMuted: '#64748b',
    textDim: '#334155',
  };

  // ─── Login screen ─────────────────────────────────────────────────────────

  if (!token) {
    return (
      <>
        {loading && <LoadingOverlay />}

        <main
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            minHeight: '100vh',
            background: S.bg,
            fontFamily: "'Inter', 'system-ui', sans-serif",
          }}
        >
          {/* ── Hero left ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '4rem 4rem',
              position: 'relative',
              overflow: 'hidden',
              borderRight: `1px solid ${S.tealBorder}`,
            }}
          >
            {/* grid bg */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage: `linear-gradient(${S.tealDim} 1px, transparent 1px), linear-gradient(90deg, ${S.tealDim} 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
                opacity: 0.35,
              }}
            />
            {/* glow top-left */}
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
            {/* glow bottom-right */}
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
              {/* badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: S.tealDim,
                  border: `1px solid ${S.tealBorder}`,
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
                    background: S.teal,
                    boxShadow: `0 0 8px ${S.teal}`,
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontSize: '11.5px',
                    color: S.teal,
                    letterSpacing: '0.07em',
                    fontWeight: 600,
                  }}
                >
                  Campaign Intelligence Platform
                </span>
              </div>

              <h1
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  color: S.text,
                  lineHeight: 1.18,
                  marginBottom: '1.25rem',
                  letterSpacing: '-0.03em',
                }}
              >
                Transforme dados de
                <br />
                <span
                  style={{
                    color: S.teal,
                    textShadow: `0 0 32px rgba(20,184,166,0.35)`,
                  }}
                >
                  marketing
                </span>{' '}
                em decisões
                <br />
                estratégicas.
              </h1>

              <p
                style={{
                  fontSize: '1rem',
                  color: S.textMuted,
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
                  <div
                    key={card.label}
                    style={{
                      background: S.surface,
                      border: `1px solid ${S.border}`,
                      borderRadius: '14px',
                      padding: '16px',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: S.text,
                        lineHeight: 1,
                        marginBottom: '5px',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {card.value}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: S.teal,
                        fontWeight: 600,
                        marginBottom: '3px',
                      }}
                    >
                      {card.label}
                    </div>
                    <div style={{ fontSize: '10px', color: S.textMuted }}>
                      {card.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Login form right ── */}
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
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'rgba(13,18,32,0.9)',
                border: `1px solid ${S.borderStrong}`,
                borderRadius: '22px',
                padding: '2.75rem',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              }}
            >
              {/* logo mark */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: S.tealDim,
                  border: `1px solid ${S.tealBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  fontSize: '18px',
                }}
              >
                ◈
              </div>

              <span
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  color: S.teal,
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                }}
              >
                Campaign Intelligence
              </span>

              <h2
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: S.text,
                  marginBottom: '0.4rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Bem-vindo de volta
              </h2>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: S.textMuted,
                  marginBottom: '2rem',
                  lineHeight: 1.6,
                }}
              >
                Acesse o painel de performance de campanhas.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '1.5rem',
                }}
              >
                <input
                  placeholder='E-mail'
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

              <button
                onClick={login}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading
                    ? 'rgba(20,184,166,0.35)'
                    : `linear-gradient(135deg, #14b8a6 0%, #0ea5a0 100%)`,
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.02em',
                  boxShadow: loading
                    ? 'none'
                    : '0 8px 24px rgba(20,184,166,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Entrando...' : 'Entrar no painel →'}
              </button>

              <p
                style={{
                  fontSize: '11px',
                  color: S.textDim,
                  textAlign: 'center',
                  marginTop: '1.5rem',
                }}
              >
                Plataforma segura · Dados criptografados
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  return (
    <>
      {loading && <LoadingOverlay />}

      <main
        className='dashboard-page'
        style={{
          background: S.bg,
          fontFamily: "'Inter', 'system-ui', sans-serif",
          minHeight: '100vh',
          display: 'flex',
        }}
      >
        {/* ── Sidebar ── */}
        <aside
          className='sidebar'
          style={{
            background: 'rgba(13,18,32,0.95)',
            borderRight: `1px solid ${S.border}`,
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
                  background: S.tealDim,
                  border: `1px solid ${S.tealBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  color: S.teal,
                }}
              >
                ◈
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: S.text,
                  letterSpacing: '-0.01em',
                }}
              >
                Campaign Intelligence
              </span>
            </div>
            <div
              style={{
                fontSize: '10px',
                color: S.textMuted,
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
              background: S.border,
              margin: '0 0.5rem 1rem',
            }}
          />

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
                  className={`sidebar-tab ${isActive ? 'active' : ''}`}
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
                    background: isActive ? S.tealDim : 'transparent',
                    color: isActive ? S.teal : danger ? '#f87171' : S.textMuted,
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s',
                    borderLeft: isActive
                      ? `2px solid ${S.teal}`
                      : '2px solid transparent',
                  }}
                >
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </nav>

          {/* user footer */}
          <div
            style={{
              marginTop: 'auto',
              padding: '1rem 0.5rem 0',
              borderTop: `1px solid ${S.border}`,
            }}
          >
            <button
              className='secondary'
              onClick={logout}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'transparent',
                border: `1px solid ${S.border}`,
                borderRadius: '10px',
                color: S.textMuted,
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

        {/* ── Main content ── */}
        <section
          className='content'
          style={{ flex: 1, overflowY: 'auto', padding: '0' }}
        >
          {/* topbar */}
          <header
            style={{
              padding: '1.75rem 2rem 0',
              borderBottom: `1px solid ${S.border}`,
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
                      color: S.teal,
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
                      color: S.text,
                      letterSpacing: '-0.025em',
                      margin: '0 0 4px',
                    }}
                  >
                    Painel de Campanhas
                  </h1>
                  <p
                    style={{ fontSize: '13px', color: S.textMuted, margin: 0 }}
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
                    background: S.tealDim,
                    border: `1px solid ${S.tealBorder}`,
                    borderRadius: '999px',
                    padding: '5px 14px',
                    fontSize: '11px',
                    color: S.teal,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: S.teal,
                      display: 'inline-block',
                      boxShadow: `0 0 6px ${S.teal}`,
                    }}
                  />
                  Live
                </div>
              </div>
            </div>
          </header>

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
            {/* ── Search & filters ── */}
            <div
              style={{
                background: S.bgPanel,
                border: `1px solid ${S.border}`,
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
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
                <span style={{ fontSize: '12px', color: S.textMuted }}>
                  Exibindo{' '}
                  <strong style={{ color: S.text }}>
                    {filteredCampaigns.length}
                  </strong>{' '}
                  de{' '}
                  <strong style={{ color: S.text }}>
                    {pagination.totalItems}
                  </strong>{' '}
                  campanhas
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: S.textMuted,
                    background: S.surface,
                    border: `1px solid ${S.border}`,
                    borderRadius: '6px',
                    padding: '3px 10px',
                  }}
                >
                  Página {pagination.page} / {pagination.totalPages || 1}
                </span>
              </div>
            </div>

            {/* ── Insight cards ── */}
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
                  accent: S.teal,
                  accentBg: S.tealDim,
                  accentBorder: S.tealBorder,
                  icon: '◈',
                },
                {
                  label: 'Recomendação estratégica',
                  value: recommendation,
                  accent: '#a78bfa',
                  accentBg: 'rgba(167,139,250,0.08)',
                  accentBorder: 'rgba(167,139,250,0.2)',
                  icon: '◎',
                },
                {
                  label: 'Melhor campanha',
                  value: bestCampaign
                    ? `${bestCampaign.name} · ${bestCampaign.roas.toFixed(2)}×`
                    : 'Sem dados',
                  accent: '#34d399',
                  accentBg: 'rgba(52,211,153,0.08)',
                  accentBorder: 'rgba(52,211,153,0.2)',
                  icon: '◆',
                },
                {
                  label: 'Ponto de atenção',
                  value: worstCampaign
                    ? `${worstCampaign.name} · ${worstCampaign.roas.toFixed(2)}×`
                    : 'Sem dados',
                  accent: '#fb923c',
                  accentBg: 'rgba(251,146,60,0.08)',
                  accentBorder: 'rgba(251,146,60,0.2)',
                  icon: '◐',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: S.bgPanel,
                    border: `1px solid ${S.border}`,
                    borderRadius: '14px',
                    padding: '1.25rem',
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
                      color: S.text,
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

            {/* ── KPI grid ── */}
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
                },
                {
                  label: 'Investimento',
                  value: formatCurrency(totalCost),
                  sub: 'Verba aplicada',
                  highlight: false,
                },
                {
                  label: 'Lucro Bruto',
                  value: formatCurrency(totalGrossProfit),
                  sub: 'Receita − investimento',
                  highlight: false,
                },
                {
                  label: 'Lucro Real',
                  value: formatCurrency(totalRealProfit),
                  sub: 'Após taxas e despesas',
                  highlight: true,
                },
                {
                  label: 'ROAS Médio',
                  value: `${averageRoas.toFixed(2)}×`,
                  sub: 'Eficiência média',
                  highlight: false,
                },
                {
                  label: 'Melhor Campanha',
                  value: bestCampaign?.name || '—',
                  sub: bestCampaign
                    ? `${bestCampaign.roas.toFixed(2)}× ROAS`
                    : 'Sem dados',
                  highlight: false,
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: kpi.highlight ? S.tealDim : S.bgPanel,
                    border: `1px solid ${kpi.highlight ? S.tealBorder : S.border}`,
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
                        background: `linear-gradient(90deg, ${S.teal}, transparent)`,
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: kpi.highlight ? S.teal : S.textMuted,
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
                      color: kpi.highlight ? S.teal : S.text,
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
                  <div style={{ fontSize: '11px', color: S.textMuted }}>
                    {kpi.sub}
                  </div>
                </div>
              ))}
            </section>

            {/* ── Charts grid ── */}
            <section
              className='charts-grid'
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              {/* Bar chart — full width */}
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

              {/* Pie chart */}
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

              {/* ROAS horizontal bar */}
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
                        formatter={(value) => `${Number(value).toFixed(2)}×`}
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

              {/* Ranking */}
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
                  {topCampaigns.map((campaign, index) => (
                    <div
                      key={campaign.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        background: S.surface,
                        border: `1px solid ${S.border}`,
                        borderRadius: '10px',
                      }}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          background:
                            index === 0 ? S.tealDim : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${index === 0 ? S.tealBorder : S.border}`,
                          color: index === 0 ? S.teal : S.textMuted,
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: S.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {campaign.name}
                        </div>
                        <div style={{ fontSize: '11px', color: S.textMuted }}>
                          {formatCurrency(campaign.realProfit)} lucro real
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '7px',
                          background:
                            campaign.roas >= 4
                              ? 'rgba(20,184,166,0.12)'
                              : campaign.roas >= 2
                                ? 'rgba(59,130,246,0.12)'
                                : campaign.roas >= 1
                                  ? 'rgba(251,191,36,0.12)'
                                  : 'rgba(239,68,68,0.12)',
                          color:
                            campaign.roas >= 4
                              ? '#14b8a6'
                              : campaign.roas >= 2
                                ? '#60a5fa'
                                : campaign.roas >= 1
                                  ? '#fbbf24'
                                  : '#f87171',
                          flexShrink: 0,
                        }}
                      >
                        {campaign.roas.toFixed(2)}×
                      </span>
                    </div>
                  ))}
                  {topCampaigns.length === 0 && (
                    <EmptyState
                      title='Sem ranking disponível'
                      sub='Cadastre campanhas para montar o ranking.'
                    />
                  )}
                </div>
              </div>

              {/* Create campaign form */}
              <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
                <PanelHeader
                  title='Criar Campanha'
                  sub='Registre uma nova campanha no painel'
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  {[
                    {
                      ph: 'Nome da campanha',
                      val: name,
                      set: setName,
                      type: 'text',
                    },
                    {
                      ph: 'Investimento (R$)',
                      val: cost,
                      set: setCost,
                      type: 'number',
                    },
                    {
                      ph: 'Retorno gerado (R$)',
                      val: revenue,
                      set: setRevenue,
                      type: 'number',
                    },
                    {
                      ph: 'Taxas (R$)',
                      val: fees,
                      set: setFees,
                      type: 'number',
                    },
                    {
                      ph: 'Despesas (R$)',
                      val: expenses,
                      set: setExpenses,
                      type: 'number',
                    },
                  ].map(({ ph, val, set, type }) => (
                    <input
                      key={ph}
                      placeholder={ph}
                      type={type}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      style={{ ...inputStyle, fontSize: '13px' }}
                    />
                  ))}
                </div>
                <button
                  onClick={createCampaign}
                  disabled={loading}
                  style={{
                    padding: '12px 28px',
                    background: loading ? 'rgba(20,184,166,0.35)' : S.teal,
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading
                      ? 'none'
                      : `0 6px 20px rgba(20,184,166,0.25)`,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Criando...' : '+ Criar campanha'}
                </button>
              </div>
            </section>

            {/* ── Table ── */}
            <section style={{ ...panelStyle, overflow: 'hidden' }}>
              <PanelHeader
                title='Campanhas'
                sub='Listagem filtrada para análise de tráfego pago'
              />

              <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
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
                            color: S.textMuted,
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
                        style={{
                          borderBottom: `1px solid ${S.border}`,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = S.surfaceHover)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        <td
                          style={{
                            padding: '12px',
                            color: S.text,
                            fontWeight: 500,
                          }}
                        >
                          {campaign.name}
                        </td>
                        <td style={{ padding: '12px', color: S.textMuted }}>
                          {formatCurrency(campaign.cost)}
                        </td>
                        <td style={{ padding: '12px', color: S.textMuted }}>
                          {formatCurrency(campaign.revenue)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              color:
                                campaign.realProfit >= 0
                                  ? '#34d399'
                                  : '#f87171',
                              fontWeight: 600,
                            }}
                          >
                            {formatCurrency(campaign.realProfit)}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '7px',
                              background:
                                campaign.roas >= 4
                                  ? 'rgba(20,184,166,0.12)'
                                  : campaign.roas >= 2
                                    ? 'rgba(59,130,246,0.12)'
                                    : campaign.roas >= 1
                                      ? 'rgba(251,191,36,0.12)'
                                      : 'rgba(239,68,68,0.12)',
                              color:
                                campaign.roas >= 4
                                  ? '#14b8a6'
                                  : campaign.roas >= 2
                                    ? '#60a5fa'
                                    : campaign.roas >= 1
                                      ? '#fbbf24'
                                      : '#f87171',
                            }}
                          >
                            {getPerformanceLabel(campaign.roas)} ·{' '}
                            {campaign.roas.toFixed(2)}×
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            className='danger'
                            onClick={() => deleteCampaign(campaign.id)}
                            style={{
                              padding: '5px 12px',
                              background: 'rgba(239,68,68,0.08)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              borderRadius: '7px',
                              color: '#f87171',
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

                    {filteredCampaigns.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: '3rem',
                            textAlign: 'center',
                            color: S.textMuted,
                            fontSize: '13px',
                          }}
                        >
                          Nenhuma campanha encontrada para este filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 0 0',
                  borderTop: `1px solid ${S.border}`,
                  marginTop: '12px',
                }}
              >
                <button
                  onClick={goToPreviousPage}
                  disabled={!pagination.hasPreviousPage}
                  style={{
                    padding: '8px 18px',
                    background: 'transparent',
                    border: `1px solid ${S.border}`,
                    borderRadius: '9px',
                    color: pagination.hasPreviousPage ? S.text : S.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: pagination.hasPreviousPage
                      ? 'pointer'
                      : 'not-allowed',
                    opacity: pagination.hasPreviousPage ? 1 : 0.4,
                  }}
                >
                  ← Anterior
                </button>

                <span style={{ fontSize: '12px', color: S.textMuted }}>
                  Página{' '}
                  <strong style={{ color: S.text }}>{pagination.page}</strong>{' '}
                  de{' '}
                  <strong style={{ color: S.text }}>
                    {pagination.totalPages || 1}
                  </strong>
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={!pagination.hasNextPage}
                  style={{
                    padding: '8px 18px',
                    background: 'transparent',
                    border: `1px solid ${S.border}`,
                    borderRadius: '9px',
                    color: pagination.hasNextPage ? S.text : S.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                    opacity: pagination.hasNextPage ? 1 : 0.4,
                  }}
                >
                  Próxima →
                </button>
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

// ─── Shared style tokens ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px',
  padding: '11px 14px',
  color: '#f1f5f9',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: '#94a3b8',
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const panelStyle: React.CSSProperties = {
  background: '#0d1220',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px',
  padding: '1.5rem',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function LoadingOverlay() {
  return (
    <div
      className='loading-overlay'
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7,11,20,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#0d1220',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '18px',
          padding: '2rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div className='loading-spinner' />
        <strong style={{ color: '#f1f5f9', fontSize: '14px' }}>
          Processando
        </strong>
        <span style={{ color: '#64748b', fontSize: '12px' }}>
          Aguarde alguns segundos...
        </span>
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
      <div style={{ fontSize: '24px', marginBottom: '10px', opacity: 0.4 }}>
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
