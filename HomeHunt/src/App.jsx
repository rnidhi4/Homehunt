import { useState, useEffect } from 'react';
import { Ctx, KEY, load, seed } from './store.js';
import * as P from './Pages.jsx';

const NAV = {
  tenant: [['/dashboard', 'Dashboard'], ['/properties', 'Browse Properties'], ['/favourites', 'Favourites'], ['/visits', 'Visit Requests'], ['/applications', 'Applications'], ['/reviews', 'Reviews'], ['/profile', 'Profile']],
  owner: [['/owner', 'Dashboard'], ['/owner/properties', 'My Properties'], ['/owner/form', 'Add Property'], ['/owner/visits', 'Visit Requests'], ['/owner/apps', 'Applications'], ['/profile', 'Profile']],
  admin: [['/admin', 'Dashboard'], ['/admin/users', 'Manage Users'], ['/admin/properties', 'Verify Properties'], ['/admin/reports', 'Reports'], ['/profile', 'Profile']],
};
const HOME = { tenant: '/dashboard', owner: '/owner', admin: '/admin' };

export default function App() {
  const [db, setDb] = useState(load);
  const [hash, setHash] = useState(location.hash || '#/');
  const [msg, setMsg] = useState('');
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)); }, [db]);
  useEffect(() => {
    const f = () => { setHash(location.hash || '#/'); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  const toast = t => { setMsg(t); setTimeout(() => setMsg(''), 2600); };
  const upd = fn => setDb(d => { const n = structuredClone(d); fn(n); return n; });
  const user = db.users.find(u => u.id === db.session) || null;
  const go = p => { location.hash = '#' + p; };
  const reset = () => { localStorage.removeItem(KEY); setDb(seed()); go('/'); toast('Demo data reset'); };
  const logout = () => { upd(d => { d.session = null; }); go('/'); };

  const [path, q] = hash.slice(1).split('?');
  const qs = Object.fromEntries(new URLSearchParams(q || ''));
  const s = path.split('/').filter(Boolean);
  const role = user && user.role;
  let el, side = false;
  if (!s[0]) el = <P.Home />;
  else if (s[0] === 'properties') el = <P.Properties qs={qs} />;
  else if (s[0] === 'property') el = <P.Details id={s[1]} />;
  else if (s[0] === 'login') el = <P.Login reset={reset} />;
  else if (s[0] === 'register') el = <P.Register />;
  else {
    const need = { dashboard: 'tenant', favourites: 'tenant', visits: 'tenant', applications: 'tenant', reviews: 'tenant', owner: 'owner', admin: 'admin' }[s[0]];
    if (!user || (need && role !== need)) el = <P.Login reset={reset} note="Please login with the correct role to open this page." />;
    else {
      side = true;
      const t = { dashboard: P.TDash, favourites: P.Favs, visits: P.Visits, applications: P.Apps, reviews: P.Reviews, profile: P.Profile };
      const o = { undefined: P.ODash, properties: P.OProps, form: P.OForm, visits: P.OVisits, apps: P.OApps };
      const a = { undefined: P.ADash, users: P.AUsers, properties: P.AProps, reports: P.AReports };
      const C = s[0] === 'profile' ? P.Profile : role === 'tenant' ? t[s[0]] : role === 'owner' ? o[s[1]] : a[s[1]];
      el = C ? <C id={s[2]} /> : <div className="panel">Page not found.</div>;
    }
  }
  const active = '/' + s.join('/');
  return (
    <Ctx.Provider value={{ db, upd, user, go, toast }}>
      <header className="nav"><div className="wrap navin">
        <a className="logo" href="#/">Home<b>Hunt</b></a>
        <nav>
          <a href="#/">Home</a><a href="#/properties">Properties</a>
          {user ? <>
            <a href={'#' + HOME[role]}>{role[0].toUpperCase() + role.slice(1)} Dashboard</a>
            <button className="btn sm out" onClick={logout}>Logout ({user.name.split(' ')[0]})</button>
          </> : <><a href="#/login">Login</a><a className="btn sm" href="#/register">Register</a></>}
        </nav>
      </div></header>
      {side ? (
        <div className="shell">
          <aside className="side">
            <div className="who">{user.name}<small>{role}</small></div>
            {NAV[role].map(([h, l]) => <a key={h} href={'#' + h} className={active === h ? 'on' : ''}>{l}</a>)}
          </aside>
          <main className="main">{el}</main>
        </div>
      ) : <main>{el}</main>}
      <footer className="foot"><div className="wrap">HomeHunt - Property Discovery and Rental Platform | College Project (Frontend Demo)</div></footer>
      {msg && <div className="toast">{msg}</div>}
    </Ctx.Provider>
  );
}
