import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  FileText,
  Home,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react'
import { isSupabaseConfigured } from './lib/supabase'

const navigation = [
  { label: 'Resumen', icon: Home, active: true },
  { label: 'Publicaciones', icon: FileText },
  { label: 'Calendario', icon: CalendarDays },
  { label: 'Analítica', icon: BarChart3 },
]

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="JadrDevX inicio">
          <span className="brand-mark">J</span>
          <span>JadrDev<span className="brand-x">X</span></span>
        </a>

        <button className="workspace-switcher">
          <span className="workspace-avatar">JD</span>
          <span className="workspace-copy"><strong>JadrDev</strong><small>Espacio de trabajo</small></span>
          <ChevronDown size={15} />
        </button>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Navegación principal">
          {navigation.map(({ label, icon: Icon, active }) => (
            <a className={active ? 'nav-item active' : 'nav-item'} href="#" key={label}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="nav-label tools-label">HERRAMIENTAS</div>
        <nav className="navigation" aria-label="Herramientas">
          <a className="nav-item" href="#"><Sparkles size={17} /><span>Asistente IA</span><span className="soon">PRONTO</span></a>
          <a className="nav-item" href="#"><MessageCircle size={17} /><span>Bandeja</span></a>
        </nav>

        <div className="sidebar-bottom">
          <a className="nav-item" href="#"><Settings2 size={17} /><span>Configuración</span></a>
          <a className="nav-item" href="#"><CircleHelp size={17} /><span>Ayuda y soporte</span></a>
          <div className="profile">
            <div className="profile-avatar">JD</div>
            <div className="profile-copy"><strong>JadrDev</strong><small>Plan inicial</small></div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Resumen</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Buscar"><Search size={17} /></button>
            <span className="top-divider" />
            <button className="help-link"><CircleHelp size={16} /> Ayuda</button>
            <div className="top-avatar">JD</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><span className="status-dot" /> TU CENTRO DE CONTROL</div>
              <h1>Buenos días 👋</h1>
              <p className="welcome-subtitle">Aquí tienes el resumen de tu actividad en X.</p>
            </div>
            <button className="primary-button" disabled title="Disponible cuando conectemos tu cuenta de X">
              <Plus size={17} /> Nueva publicación
            </button>
          </div>

          <section className="connect-banner">
            <div className="connect-icon"><X size={23} /></div>
            <div className="connect-copy">
              <strong>Conecta tu cuenta de X</strong>
              <p>Vincula tu perfil para empezar a gestionar publicaciones y consultar tus estadísticas desde JadrDevX.</p>
              <span className="connection-note"><span className="status-dot muted" /> Integración pendiente de configurar</span>
            </div>
            <button className="outline-button" disabled>Conectar cuenta <ArrowUpRight size={15} /></button>
          </section>

          <div className="section-heading">
            <div><h2>Vista general</h2><p>Tu actividad, de un vistazo.</p></div>
            <button className="period-button">Últimos 7 días <ChevronDown size={15} /></button>
          </div>

          <div className="stats-grid">
            {[
              { label: 'Publicaciones', value: '—', detail: 'Conecta X para ver tus datos', icon: FileText },
              { label: 'Impresiones', value: '—', detail: 'Alcance de tus publicaciones', icon: BarChart3 },
              { label: 'Interacciones', value: '—', detail: 'Me gusta, respuestas y reposts', icon: MessageCircle },
            ].map(({ label, value, detail, icon: Icon }) => (
              <article className="stat-card" key={label}>
                <div className="stat-top"><span>{label}</span><Icon size={17} /></div>
                <div className="stat-value">{value}</div>
                <div className="stat-detail">{detail}</div>
              </article>
            ))}
          </div>

          <div className="lower-grid">
            <section className="panel">
              <div className="panel-heading"><div><h2>Actividad reciente</h2><p>Un seguimiento de tus últimas publicaciones.</p></div><button className="more-button" aria-label="Más opciones"><MoreHorizontal size={19} /></button></div>
              <div className="empty-state">
                <div className="empty-icon"><FileText size={21} /></div>
                <strong>Aún no hay actividad</strong>
                <p>Cuando conectes tu cuenta de X, aquí aparecerán tus publicaciones recientes.</p>
              </div>
            </section>
            <section className="panel quick-panel">
              <div className="panel-heading"><div><h2>Accesos rápidos</h2><p>Prepara tu próximo paso.</p></div></div>
              <button className="quick-action" disabled><span className="quick-icon"><Plus size={17} /></span><span><strong>Crear publicación</strong><small>Redacta un nuevo post</small></span><span className="lock-label">Pendiente</span></button>
              <button className="quick-action" disabled><span className="quick-icon"><CalendarDays size={17} /></span><span><strong>Planificar contenido</strong><small>Organiza tu calendario</small></span><span className="lock-label">Pendiente</span></button>
              <button className="quick-action" disabled><span className="quick-icon"><BarChart3 size={17} /></span><span><strong>Ver analítica</strong><small>Consulta el rendimiento</small></span><span className="lock-label">Pendiente</span></button>
            </section>
          </div>

          <footer className="footer"><span>JadrDevX <span className="footer-version">v0.1.0</span></span><span className={isSupabaseConfigured ? 'config-state ready' : 'config-state'}><span className="status-dot" /> {isSupabaseConfigured ? 'Supabase configurado' : 'Supabase sin configurar'}</span><span>Hecho por JadrDev <Command size={12} /></span></footer>
        </div>
      </section>
    </main>
  )
}

export default App
