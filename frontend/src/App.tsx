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

  function getPerformanceClass(roas: number) {
    if (roas >= 4) return 'excellent';
    if (roas >= 2) return 'good';
    if (roas >= 1) return 'warning';

    return 'critical';
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  if (!token) {
    return (
      <>
        {loading && (
          <div className='loading-overlay'>
            <div className='loading-card'>
              <div className='loading-spinner' />

              <strong>Processando</strong>

              <span>Aguarde alguns segundos...</span>
            </div>
          </div>
        )}

        <main className='login-page'>
          <section className='login-card'>
            <span className='eyebrow'>Campaign Intelligence</span>

            <h1>Entre no painel</h1>

            <p>Acesse o dashboard de performance de campanhas.</p>

            <input
              placeholder='E-mail'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              placeholder='Senha'
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button onClick={login} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      {loading && (
        <div className='loading-overlay'>
          <div className='loading-card'>
            <div className='loading-spinner' />

            <strong>Processando</strong>

            <span>Aguarde alguns segundos...</span>
          </div>
        </div>
      )}

      <main className='dashboard-page'>
        <aside className='sidebar'>
          <h2>Inteligência de campanha</h2>

          <nav>
            <button
              className={`sidebar-tab ${
                activeFilter === 'all' ? 'active' : ''
              }`}
              onClick={() => setActiveFilter('all')}
            >
              Todas as campanhas
            </button>

            <button
              className={`sidebar-tab ${
                activeFilter === 'high-roas' ? 'active' : ''
              }`}
              onClick={() => setActiveFilter('high-roas')}
            >
              ROAS alto
            </button>

            <button
              className={`sidebar-tab ${
                activeFilter === 'profitable' ? 'active' : ''
              }`}
              onClick={() => setActiveFilter('profitable')}
            >
              Campanhas lucrativas
            </button>

            <button
              className={`sidebar-tab ${
                activeFilter === 'attention' ? 'active' : ''
              }`}
              onClick={() => setActiveFilter('attention')}
            >
              Atenção
            </button>

            <button
              className={`sidebar-tab ${
                activeFilter === 'critical' ? 'active' : ''
              }`}
              onClick={() => setActiveFilter('critical')}
            >
              Críticas
            </button>

            <button
              className={`sidebar-tab ${
                activeFilter === 'high-investment' ? 'active' : ''
              }`}
              onClick={() => {
                setActiveFilter('high-investment');
                setSortBy('cost');
                setOrder('desc');
              }}
            >
              Maior investimento
            </button>

            <button
              className={`sidebar-tab ${
                activeFilter === 'best-return' ? 'active' : ''
              }`}
              onClick={() => {
                setActiveFilter('best-return');
                setSortBy('realProfit');
                setOrder('desc');
              }}
            >
              Melhor retorno
            </button>
          </nav>
        </aside>

        <section className='content'>
          <header className='topbar'>
            <div>
              <span className='eyebrow'>Desempenho de marketing</span>

              <h1>Painel de Campanhas</h1>

              <p>
                Visão para gestores de tráfego acompanharem investimento,
                retorno, lucro real e eficiência das campanhas.
              </p>
            </div>

            <button className='secondary' onClick={logout}>
              Sair
            </button>
          </header>

          <section className='search-panel'>
            <input
              placeholder='Pesquisar campanha por nome...'
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <div className='filters-row'>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortByType)
                }
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
                onChange={(event) => setOrder(event.target.value as OrderType)}
              >
                <option value='desc'>Descendente</option>
                <option value='asc'>Ascendente</option>
              </select>
            </div>

            <span>
              Exibindo {filteredCampaigns.length} de {pagination.totalItems}{' '}
              campanhas
            </span>
          </section>

          <section className='insights-grid'>
            <div className='insight-card primary'>
              <span>Resumo</span>
              <strong>{executiveSummary}</strong>
            </div>

            <div className='insight-card'>
              <span>Recomendação</span>
              <strong>{recommendation}</strong>
            </div>

            <div className='insight-card'>
              <span>Melhor campanha</span>
              <strong>
                {bestCampaign
                  ? `${bestCampaign.name} · ${bestCampaign.roas.toFixed(2)}x`
                  : 'Sem dados'}
              </strong>
            </div>

            <div className='insight-card'>
              <span>Ponto de atenção</span>
              <strong>
                {worstCampaign
                  ? `${worstCampaign.name} · ${worstCampaign.roas.toFixed(2)}x`
                  : 'Sem dados'}
              </strong>
            </div>
          </section>

          <section className='kpi-grid'>
            <div className='kpi-card'>
              <span>Retorno Gerado</span>
              <strong>{formatCurrency(totalRevenue)}</strong>
              <small>{totalCampaigns} campanhas filtradas</small>
            </div>

            <div className='kpi-card'>
              <span>Investimento</span>
              <strong>{formatCurrency(totalCost)}</strong>
              <small>Verba aplicada</small>
            </div>

            <div className='kpi-card'>
              <span>Lucro Bruto</span>
              <strong>{formatCurrency(totalGrossProfit)}</strong>
              <small>Receita - investimento</small>
            </div>

            <div className='kpi-card active'>
              <span>Lucro Real</span>
              <strong>{formatCurrency(totalRealProfit)}</strong>
              <small>Após taxas e despesas</small>
            </div>

            <div className='kpi-card'>
              <span>ROAS Médio</span>
              <strong>{averageRoas.toFixed(2)}x</strong>
              <small>Eficiência média</small>
            </div>

            <div className='kpi-card'>
              <span>Melhor Campanha</span>
              <strong>{bestCampaign?.name || '-'}</strong>
              <small>
                {bestCampaign
                  ? `${bestCampaign.roas.toFixed(2)}x ROAS`
                  : 'Sem dados'}
              </small>
            </div>
          </section>

          <section className='charts-grid'>
            <div className='panel large'>
              <div className='panel-title'>
                <h3>Retorno, Investimento e Lucro por Campanha</h3>
                <span>Comparativo de performance</span>
              </div>

              {filteredCampaigns.length > 0 ? (
                <ResponsiveContainer width='100%' height={320}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray='3 3' vertical={false} />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Bar
                      dataKey='Receita'
                      fill='#14b8a6'
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar dataKey='Custo' fill='#334155' radius={[6, 6, 0, 0]} />
                    <Bar dataKey='Lucro' fill='#2563eb' radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='empty-card'>
                  <strong>Nenhuma campanha para exibir</strong>
                  <span>Crie uma campanha ou altere o filtro selecionado.</span>
                </div>
              )}
            </div>

            <div className='panel'>
              <div className='panel-title'>
                <h3>Distribuição da Verba</h3>
                <span>Investimento, taxas, despesas e lucro</span>
              </div>

              {pieData.length > 0 ? (
                <ResponsiveContainer width='100%' height={320}>
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
                            ['#334155', '#f59e0b', '#ef4444', '#14b8a6'][
                              index % 4
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='empty-card'>
                  <strong>Sem dados financeiros</strong>
                  <span>
                    Cadastre uma campanha para visualizar a distribuição.
                  </span>
                </div>
              )}
            </div>

            <div className='panel'>
              <div className='panel-title'>
                <h3>Eficiência por Campanha</h3>
                <span>ROAS individual</span>
              </div>

              {filteredCampaigns.length > 0 ? (
                <ResponsiveContainer width='100%' height={280}>
                  <BarChart data={roasData} layout='vertical'>
                    <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                    <XAxis type='number' />
                    <YAxis dataKey='name' type='category' width={100} />
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(2)}x`}
                    />
                    <Bar dataKey='ROAS' fill='#14b8a6' radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='empty-card'>
                  <strong>Nenhum ROAS calculado</strong>
                  <span>Adicione campanhas para analisar eficiência.</span>
                </div>
              )}
            </div>

            <div className='panel'>
              <div className='panel-title'>
                <h3>Ranking de Performance</h3>
                <span>Top campanhas por ROAS</span>
              </div>

              <div className='ranking-list'>
                {topCampaigns.map((campaign, index) => (
                  <div className='ranking-item' key={campaign.id}>
                    <div className='ranking-position'>{index + 1}</div>

                    <div className='ranking-info'>
                      <strong>{campaign.name}</strong>
                      <span>
                        {formatCurrency(campaign.realProfit)} de lucro real
                      </span>
                    </div>

                    <div
                      className={`performance-badge ${getPerformanceClass(
                        campaign.roas
                      )}`}
                    >
                      {campaign.roas.toFixed(2)}x
                    </div>
                  </div>
                ))}

                {topCampaigns.length === 0 && (
                  <div className='empty-card'>
                    <strong>Sem ranking disponível</strong>
                    <span>Cadastre campanhas para montar o ranking.</span>
                  </div>
                )}
              </div>
            </div>

            <div className='panel form-panel'>
              <div className='panel-title'>
                <h3>Criar Campanha</h3>
                <span>Dados enviados com JWT no header</span>
              </div>

              <div className='form-grid compact'>
                <input
                  placeholder='Nome'
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />

                <input
                  placeholder='Investimento'
                  type='number'
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                />

                <input
                  placeholder='Retorno gerado'
                  type='number'
                  value={revenue}
                  onChange={(event) => setRevenue(event.target.value)}
                />

                <input
                  placeholder='Taxas'
                  type='number'
                  value={fees}
                  onChange={(event) => setFees(event.target.value)}
                />

                <input
                  placeholder='Despesas'
                  type='number'
                  value={expenses}
                  onChange={(event) => setExpenses(event.target.value)}
                />
              </div>

              <button onClick={createCampaign} disabled={loading}>
                {loading ? 'Criando...' : 'Criar campanha'}
              </button>
            </div>
          </section>

          <section className='panel table-panel'>
            <div className='panel-title'>
              <h3>Campanhas</h3>
              <span>Listagem filtrada para análise de tráfego pago</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Investimento</th>
                  <th>Retorno</th>
                  <th>Lucro Real</th>
                  <th>Eficiência</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{campaign.name}</td>
                    <td>{formatCurrency(campaign.cost)}</td>
                    <td>{formatCurrency(campaign.revenue)}</td>
                    <td>{formatCurrency(campaign.realProfit)}</td>
                    <td>
                      <span
                        className={`status-pill ${getPerformanceClass(
                          campaign.roas
                        )}`}
                      >
                        {getPerformanceLabel(campaign.roas)} ·{' '}
                        {campaign.roas.toFixed(2)}x
                      </span>
                    </td>
                    <td>
                      <button
                        className='danger'
                        onClick={() => deleteCampaign(campaign.id)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className='empty-state'>
                      Nenhuma campanha encontrada para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className='pagination'>
              <button
                className='secondary'
                onClick={goToPreviousPage}
                disabled={!pagination.hasPreviousPage}
              >
                Anterior
              </button>

              <span>
                Página {pagination.page} de {pagination.totalPages || 1}
              </span>

              <button
                className='secondary'
                onClick={goToNextPage}
                disabled={!pagination.hasNextPage}
              >
                Próxima
              </button>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

export default App;
