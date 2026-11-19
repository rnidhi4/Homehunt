import { useState } from 'react';
import { useApp, fallback, uid, today, AMEN, TYPES, IMG } from './store.js';

const money = n => '₹' + Number(n).toLocaleString('en-IN');
const stars = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
const avg = (db, id) => { const r = db.reviews.filter(x => x.propId === id); return r.length ? r.reduce((a, b) => a + b.rating, 0) / r.length : 0; };
const prop = (db, id) => db.properties.find(p => p.id === id);
const usr = (db, id) => db.users.find(u => u.id === id);
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const Badge = ({ s }) => <span className={'badge ' + String(s).toLowerCase().replace(/ /g, '')}>{s}</span>;
const Img = ({ src, alt }) => <img src={src} alt={alt} loading="lazy" onError={e => { e.target.onerror = null; e.target.src = fallback(); }} />;
const Field = ({ label, error, children }) => <label className="field"><span>{label}</span>{children}{error && <small className="err">{error}</small>}</label>;
const useF = init => { const [f, setF] = useState(init); return [f, k => ({ value: f[k], onChange: e => setF({ ...f, [k]: e.target.value }) }), setF]; };
const Empty = ({ t }) => <div className="panel empty">{t}</div>;
const Tbl = ({ heads, rows, empty }) => rows.length ? <div className="tw"><table><thead><tr>{heads.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div> : <Empty t={empty} />;
const Stat = ({ n, l }) => <div className="stat"><b>{n}</b><span>{l}</span></div>;

function Card({ p }) {
  const { db, upd, user, go, toast } = useApp();
  const fav = user && db.favs.some(f => f.userId === user.id && f.propId === p.id);
  const toggle = () => {
    if (!user) return go('/login');
    if (user.role !== 'tenant') return toast('Only tenants can save properties');
    upd(d => { d.favs = fav ? d.favs.filter(f => !(f.userId === user.id && f.propId === p.id)) : [...d.favs, { userId: user.id, propId: p.id }]; });
    toast(fav ? 'Removed from favourites' : 'Saved to favourites');
  };
  const a = avg(db, p.id);
  return (
    <div className="card">
      <div className="ci"><Img src={p.img} alt={p.title} /><span className="tag">{p.type}</span><button className={'heart' + (fav ? ' on' : '')} onClick={toggle} title="Save">♥</button></div>
      <div className="cb">
        <div className="rent">{money(p.rent)}<small>/month</small></div>
        <h3>{p.title}</h3><p className="muted">📍 {p.location}</p>
        <p className="muted">{p.bhk} BHK {a > 0 && <span className="star">{stars(a)}</span>}</p>
        <a className="btn sm" href={'#/property/' + p.id}>View Details</a>
      </div>
    </div>
  );
}

export function Home() {
  const { db, go } = useApp();
  const [f, , setF] = useF({ loc: '', bhk: '', max: '' });
  const on = k => ({ value: f[k], onChange: e => setF({ ...f, [k]: e.target.value }) });
  const ok = db.properties.filter(p => p.status === 'Verified' && p.available);
  return <>
    <section className="hero"><div className="wrap">
      <h1>Find your perfect rental home</h1>
      <p>Search verified flats, houses and PGs, request a visit and apply online. No brokers needed.</p>
      <form className="sbar" onSubmit={e => { e.preventDefault(); go('/properties?' + new URLSearchParams(Object.fromEntries(Object.entries(f).filter(x => x[1])))); }}>
        <input placeholder="Location or keyword" {...on('loc')} />
        <select {...on('bhk')}><option value="">Any BHK</option><option>1</option><option>2</option><option>3</option><option value="4">4+</option></select>
        <input type="number" placeholder="Max rent (₹)" {...on('max')} />
        <button className="btn">Search</button>
      </form>
    </div></section>
    <section className="wrap sec"><div className="stats"><Stat n={ok.length + '+'} l="Verified Properties" /><Stat n={db.users.filter(u => u.role === 'tenant').length + '+'} l="Happy Tenants" /><Stat n={db.users.filter(u => u.role === 'owner').length + '+'} l="Property Owners" /><Stat n={db.reviews.length + '+'} l="Reviews" /></div></section>
    <section className="wrap sec"><h2>Featured Properties</h2><div className="grid">{ok.slice(0, 6).map(p => <Card key={p.id} p={p} />)}</div>
      <p className="center"><a className="btn out" href="#/properties">Browse all properties</a></p></section>
    <section className="wrap sec"><h2>How HomeHunt works</h2><div className="grid4">
      {[['1', 'Search', 'Filter by location, budget, BHK and amenities.'], ['2', 'Request a Visit', 'Pick a date and time that suits you.'], ['3', 'Apply', 'Submit a rental application after the visit.'], ['4', 'Track Status', 'See approval status on your dashboard.']].map(x => <div className="step" key={x[0]}><i>{x[0]}</i><h3>{x[1]}</h3><p className="muted">{x[2]}</p></div>)}
    </div></section>
  </>;
}

export function Properties({ qs }) {
  const { db } = useApp();
  const [f, on, setF] = useF({ loc: qs.loc || '', bhk: qs.bhk || '', type: '', max: qs.max || '', sort: 'new' });
  const [am, setAm] = useState([]);
  let list = db.properties.filter(p => p.status === 'Verified' && p.available)
    .filter(p => !f.loc || (p.title + p.location).toLowerCase().includes(f.loc.toLowerCase()))
    .filter(p => !f.bhk || (f.bhk === '4' ? p.bhk >= 4 : p.bhk === +f.bhk))
    .filter(p => !f.type || p.type === f.type)
    .filter(p => !f.max || p.rent <= +f.max)
    .filter(p => am.every(a => p.amenities.includes(a)));
  if (f.sort === 'low') list = [...list].sort((a, b) => a.rent - b.rent);
  if (f.sort === 'high') list = [...list].sort((a, b) => b.rent - a.rent);
  const clear = () => { setF({ loc: '', bhk: '', type: '', max: '', sort: 'new' }); setAm([]); };
  return <div className="wrap sec split">
    <aside className="filters panel">
      <h3>Filters</h3>
      <Field label="Location / keyword"><input placeholder="e.g. Bhopal" {...on('loc')} /></Field>
      <Field label="BHK"><select {...on('bhk')}><option value="">Any</option><option>1</option><option>2</option><option>3</option><option value="4">4+</option></select></Field>
      <Field label="Property type"><select {...on('type')}><option value="">Any</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Max rent (₹)"><input type="number" min="0" placeholder="e.g. 20000" {...on('max')} /></Field>
      <div className="field"><span>Amenities</span>{AMEN.map(a => <label key={a} className="chk"><input type="checkbox" checked={am.includes(a)} onChange={() => setAm(am.includes(a) ? am.filter(x => x !== a) : [...am, a])} />{a}</label>)}</div>
      <button className="btn out full" onClick={clear}>Clear filters</button>
    </aside>
    <div>
      <div className="bar"><b>{list.length} properties found</b>
        <select {...on('sort')}><option value="new">Newest</option><option value="low">Rent: Low to High</option><option value="high">Rent: High to Low</option></select></div>
      {list.length ? <div className="grid">{list.map(p => <Card key={p.id} p={p} />)}</div> : <Empty t="No properties match your filters." />}
    </div>
  </div>;
}

export function Details({ id }) {
  const { db, upd, user, go, toast } = useApp();
  const p = prop(db, id);
  const [v, on, setV] = useF({ date: '', time: '' });
  const [e, setE] = useState({});
  const [rep, setRep] = useState(null);
  if (!p || !(p.status === 'Verified' || (user && (user.role === 'admin' || user.id === p.ownerId)))) return <div className="wrap sec"><Empty t="This property is not available." /></div>;
  const owner = usr(db, p.ownerId), revs = db.reviews.filter(r => r.propId === p.id), tenant = user && user.role === 'tenant';
  const fav = tenant && db.favs.some(f => f.userId === user.id && f.propId === p.id);
  const visit = () => {
    if (!user) return go('/login');
    const er = {};
    if (!v.date) er.date = 'Select a visit date'; else if (v.date < today()) er.date = 'Date cannot be in the past';
    if (!v.time) er.time = 'Select a time';
    if (db.visits.some(x => x.userId === user.id && x.propId === p.id && x.status === 'Pending')) er.date = 'You already have a pending request for this property';
    setE(er); if (Object.keys(er).length) return;
    upd(d => { d.visits.push({ id: uid(), userId: user.id, propId: p.id, date: v.date, time: v.time, status: 'Pending' }); });
    toast('Visit request sent to the owner'); go('/visits');
  };
  const report = () => {
    if (!rep || rep.trim().length < 10) return setE({ rep: 'Please describe the problem (min 10 characters)' });
    upd(d => { d.reports.push({ id: uid(), userId: user.id, propId: p.id, reason: rep.trim(), status: 'Open' }); });
    setRep(null); setE({}); toast('Report submitted to admin');
  };
  const save = () => {
    if (!user) return go('/login');
    upd(d => { d.favs = fav ? d.favs.filter(f => !(f.userId === user.id && f.propId === p.id)) : [...d.favs, { userId: user.id, propId: p.id }]; });
    toast(fav ? 'Removed from favourites' : 'Saved to favourites');
  };
  return <div className="wrap sec">
    <a href="#/properties" className="muted">← Back to properties</a>
    <div className="dgrid">
      <div>
        <div className="big"><Img src={p.img} alt={p.title} /></div>
        <h1>{p.title}</h1>
        <p className="muted">📍 {p.location} · {p.bhk} BHK · {p.type} {avg(db, p.id) > 0 && <span className="star">{stars(avg(db, p.id))} ({revs.length})</span>}</p>
        <h3>Description</h3><p>{p.desc}</p>
        <h3>Amenities</h3><div className="chips">{p.amenities.map(a => <span key={a}>{a}</span>)}</div>
        <h3>Owner</h3><p>{owner ? owner.name : 'Owner'} {user ? '· ' + (owner ? owner.phone : '') : <span className="muted">(login to see contact details)</span>}</p>
        <h3>Reviews</h3>
        {revs.length ? revs.map(r => <div className="rev" key={r.id}><b>{usr(db, r.userId)?.name}</b> <span className="star">{stars(r.rating)}</span><p>{r.comment}</p></div>) : <p className="muted">No reviews yet.</p>}
      </div>
      <aside className="panel sticky">
        <div className="rent lg">{money(p.rent)}<small>/month</small></div>
        <p><Badge s={p.available ? 'Available' : 'Rented'} /> <Badge s={p.status} /></p>
        {tenant || !user ? <>
          <h3>Request a visit</h3>
          <Field label="Date" error={e.date}><input type="date" min={today()} {...on('date')} /></Field>
          <Field label="Time" error={e.time}><select {...on('time')}><option value="">Select time</option>{['10:00 AM', '12:00 PM', '03:00 PM', '05:00 PM'].map(t => <option key={t}>{t}</option>)}</select></Field>
          <button className="btn full" disabled={!p.available} onClick={visit}>Request Visit</button>
          <button className="btn out full" onClick={save}>{fav ? '♥ Saved' : '♡ Save to favourites'}</button>
          {tenant && (rep === null ? <button className="link" onClick={() => setRep('')}>Report this listing</button> : <div>
            <Field label="Report reason" error={e.rep}><textarea rows="3" value={rep} onChange={x => setRep(x.target.value)} /></Field>
            <button className="btn sm" onClick={report}>Submit report</button> <button className="btn sm out" onClick={() => { setRep(null); setE({}); }}>Cancel</button></div>)}
        </> : <p className="muted">Login as a tenant to request visits and save properties.</p>}
      </aside>
    </div>
  </div>;
}

export function Login({ note, reset }) {
  const { db, upd, go, toast } = useApp();
  const [f, on, setF] = useF({ email: '', password: '' });
  const [e, setE] = useState({});
  const submit = ev => {
    ev.preventDefault();
    const er = {};
    if (!emailOk(f.email)) er.email = 'Enter a valid email';
    if (!f.password) er.password = 'Password is required';
    const u = db.users.find(x => x.email.toLowerCase() === f.email.toLowerCase() && x.password === f.password);
    if (!Object.keys(er).length && !u) er.password = 'Invalid email or password';
    if (u && u.blocked) er.email = 'This account has been blocked by admin';
    setE(er); if (Object.keys(er).length) return;
    upd(d => { d.session = u.id; }); toast('Welcome, ' + u.name);
    go({ tenant: '/dashboard', owner: '/owner', admin: '/admin' }[u.role]);
  };
  return <div className="auth"><form className="panel" onSubmit={submit} noValidate>
    <h2>Login</h2>{note && <p className="err">{note}</p>}
    <Field label="Email" error={e.email}><input type="email" {...on('email')} /></Field>
    <Field label="Password" error={e.password}><input type="password" {...on('password')} /></Field>
    <button className="btn full">Login</button>
    <p className="muted center">New here? <a href="#/register">Create an account</a></p>
    <div className="demo"><b>Demo logins</b> (password 123456)
      {[['Tenant', 'tenant@demo.com'], ['Owner', 'owner@demo.com'], ['Admin', 'admin@demo.com']].map(([l, m]) => <button type="button" key={m} className="btn sm out" onClick={() => setF({ email: m, password: '123456' })}>{l}</button>)}
      <button type="button" className="link" onClick={reset}>Reset demo data</button></div>
  </form></div>;
}

export function Register() {
  const { db, upd, go, toast } = useApp();
  const [f, on] = useF({ name: '', email: '', phone: '', role: 'tenant', password: '', confirm: '' });
  const [e, setE] = useState({});
  const submit = ev => {
    ev.preventDefault();
    const er = {};
    if (f.name.trim().length < 3) er.name = 'Name must be at least 3 characters';
    if (!emailOk(f.email)) er.email = 'Enter a valid email'; else if (db.users.some(u => u.email.toLowerCase() === f.email.toLowerCase())) er.email = 'Email already registered';
    if (!/^\d{10}$/.test(f.phone)) er.phone = 'Phone must be 10 digits';
    if (f.password.length < 6) er.password = 'Password must be at least 6 characters';
    if (f.confirm !== f.password) er.confirm = 'Passwords do not match';
    setE(er); if (Object.keys(er).length) return;
    const id = uid();
    upd(d => { d.users.push({ id, name: f.name.trim(), email: f.email, phone: f.phone, role: f.role, password: f.password, blocked: false }); d.session = id; });
    toast('Account created'); go(f.role === 'owner' ? '/owner' : '/dashboard');
  };
  return <div className="auth"><form className="panel" onSubmit={submit} noValidate>
    <h2>Create account</h2>
    <Field label="Full name" error={e.name}><input {...on('name')} /></Field>
    <Field label="Email" error={e.email}><input type="email" {...on('email')} /></Field>
    <Field label="Phone" error={e.phone}><input maxLength="10" {...on('phone')} /></Field>
    <Field label="I am a"><select {...on('role')}><option value="tenant">Tenant (looking for a property)</option><option value="owner">Property Owner</option></select></Field>
    <Field label="Password" error={e.password}><input type="password" {...on('password')} /></Field>
    <Field label="Confirm password" error={e.confirm}><input type="password" {...on('confirm')} /></Field>
    <button className="btn full">Register</button>
    <p className="muted center">Already registered? <a href="#/login">Login</a></p>
  </form></div>;
}

export function Profile() {
  const { db, upd, user, toast } = useApp();
  const [f, on] = useF({ name: user.name, phone: user.phone, password: '' });
  const [e, setE] = useState({});
  const save = ev => {
    ev.preventDefault();
    const er = {};
    if (f.name.trim().length < 3) er.name = 'Name must be at least 3 characters';
    if (!/^\d{10}$/.test(f.phone)) er.phone = 'Phone must be 10 digits';
    if (f.password && f.password.length < 6) er.password = 'Password must be at least 6 characters';
    setE(er); if (Object.keys(er).length) return;
    upd(d => { const u = usr(d, user.id); u.name = f.name.trim(); u.phone = f.phone; if (f.password) u.password = f.password; });
    toast('Profile updated');
  };
  return <><h1>My Profile</h1><form className="panel narrow" onSubmit={save} noValidate>
    <Field label="Email"><input value={user.email} disabled /></Field>
    <Field label="Role"><input value={user.role} disabled /></Field>
    <Field label="Full name" error={e.name}><input {...on('name')} /></Field>
    <Field label="Phone" error={e.phone}><input maxLength="10" {...on('phone')} /></Field>
    <Field label="New password (optional)" error={e.password}><input type="password" {...on('password')} /></Field>
    <button className="btn">Save changes</button>
  </form></>;
}

/* ---------------- Tenant ---------------- */
export function TDash() {
  const { db, user } = useApp();
  const v = db.visits.filter(x => x.userId === user.id), a = db.apps.filter(x => x.userId === user.id);
  return <><h1>Welcome, {user.name}</h1>
    <div className="stats"><Stat n={db.favs.filter(f => f.userId === user.id).length} l="Favourites" /><Stat n={v.length} l="Visit Requests" /><Stat n={a.length} l="Applications" /><Stat n={db.reviews.filter(r => r.userId === user.id).length} l="Reviews" /></div>
    <h2>Recent visit requests</h2>
    <Tbl heads={['Property', 'Date', 'Status']} empty="No visit requests yet. Browse properties to get started." rows={v.slice(-5).reverse().map(x => [prop(db, x.propId)?.title, x.date + ' ' + x.time, <Badge s={x.status} />])} />
    <p><a className="btn" href="#/properties">Browse Properties</a></p></>;
}

export function Favs() {
  const { db, user } = useApp();
  const l = db.favs.filter(f => f.userId === user.id).map(f => prop(db, f.propId)).filter(p => p && p.status === 'Verified');
  return <><h1>Favourites</h1>{l.length ? <div className="grid">{l.map(p => <Card key={p.id} p={p} />)}</div> : <Empty t="You have not saved any properties yet." />}</>;
}

export function Visits() {
  const { db, upd, user, toast, go } = useApp();
  const [ap, setAp] = useState(null);
  const [f, on, setF] = useF({ message: '', moveIn: '' });
  const [e, setE] = useState({});
  const mine = db.visits.filter(v => v.userId === user.id).reverse();
  const cancel = id => { upd(d => { d.visits = d.visits.filter(v => v.id !== id); }); toast('Visit request cancelled'); };
  const submit = () => {
    const er = {};
    if (f.message.trim().length < 10) er.message = 'Write at least 10 characters';
    if (!f.moveIn) er.moveIn = 'Select move-in date'; else if (f.moveIn < today()) er.moveIn = 'Date cannot be in the past';
    setE(er); if (Object.keys(er).length) return;
    upd(d => { d.apps.push({ id: uid(), userId: user.id, propId: ap.propId, visitId: ap.id, message: f.message.trim(), moveIn: f.moveIn, status: 'Submitted', date: today() }); });
    setAp(null); setF({ message: '', moveIn: '' }); toast('Rental application submitted'); go('/applications');
  };
  return <><h1>Visit Requests</h1>
    <Tbl heads={['Property', 'Date & Time', 'Status', 'Action']} empty="No visit requests yet." rows={mine.map(v => [
      <a href={'#/property/' + v.propId}>{prop(db, v.propId)?.title}</a>, v.date + ' · ' + v.time, <Badge s={v.status} />,
      v.status === 'Pending' ? <button className="btn sm out" onClick={() => cancel(v.id)}>Cancel</button>
        : v.status === 'Accepted' ? (db.apps.some(a => a.visitId === v.id) ? <span className="muted">Applied</span> : <button className="btn sm" onClick={() => { setAp(v); setE({}); }}>Apply for Rent</button>) : '-'])} />
    {ap && <div className="panel narrow"><h3>Rental application: {prop(db, ap.propId)?.title}</h3>
      <Field label="Message to owner" error={e.message}><textarea rows="3" {...on('message')} /></Field>
      <Field label="Preferred move-in date" error={e.moveIn}><input type="date" min={today()} {...on('moveIn')} /></Field>
      <button className="btn" onClick={submit}>Submit Application</button> <button className="btn out" onClick={() => setAp(null)}>Cancel</button></div>}</>;
}

export function Apps() {
  const { db, user } = useApp();
  const mine = db.apps.filter(a => a.userId === user.id).reverse();
  const steps = ['Submitted', 'Under Review', 'Decision'];
  return <><h1>Rental Applications</h1>
    {mine.length ? mine.map(a => { const i = a.status === 'Submitted' ? 0 : a.status === 'Under Review' ? 1 : 2; return <div className="panel" key={a.id}>
      <div className="bar"><h3><a href={'#/property/' + a.propId}>{prop(db, a.propId)?.title}</a></h3><Badge s={a.status} /></div>
      <p className="muted">Applied on {a.date} · Move-in {a.moveIn}</p><p>{a.message}</p>
      <div className="stepper">{steps.map((s, k) => <div key={s} className={k <= i ? 'on' : ''}><i>{k + 1}</i>{k === 2 && i === 2 ? a.status : s}</div>)}</div></div>; })
      : <Empty t="No applications yet. Request a visit and apply after the owner accepts." />}</>;
}

export function Reviews() {
  const { db, upd, user, toast } = useApp();
  const ok = [...new Set(db.visits.filter(v => v.userId === user.id && v.status === 'Accepted').map(v => v.propId))];
  const [f, on, setF] = useF({ propId: '', rating: '5', comment: '' });
  const [e, setE] = useState({});
  const mine = db.reviews.filter(r => r.userId === user.id);
  const add = () => {
    const er = {};
    if (!f.propId) er.propId = 'Select a property';
    if (f.comment.trim().length < 10) er.comment = 'Write at least 10 characters';
    setE(er); if (Object.keys(er).length) return;
    upd(d => { d.reviews.push({ id: uid(), userId: user.id, propId: f.propId, rating: +f.rating, comment: f.comment.trim(), date: today() }); });
    setF({ propId: '', rating: '5', comment: '' }); toast('Review added');
  };
  return <><h1>Reviews and Ratings</h1>
    <div className="panel narrow"><h3>Write a review</h3>
      {ok.length ? <>
        <Field label="Property (visited)" error={e.propId}><select {...on('propId')}><option value="">Select property</option>{ok.map(id => <option key={id} value={id}>{prop(db, id)?.title}</option>)}</select></Field>
        <Field label="Rating"><select {...on('rating')}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} - {stars(n)}</option>)}</select></Field>
        <Field label="Comment" error={e.comment}><textarea rows="3" {...on('comment')} /></Field>
        <button className="btn" onClick={add}>Submit Review</button></> : <p className="muted">You can review a property after the owner accepts your visit request.</p>}</div>
    <h2>My reviews</h2>
    <Tbl heads={['Property', 'Rating', 'Comment', 'Action']} empty="You have not written any reviews." rows={mine.map(r => [prop(db, r.propId)?.title, <span className="star">{stars(r.rating)}</span>, r.comment, <button className="btn sm out" onClick={() => { upd(d => { d.reviews = d.reviews.filter(x => x.id !== r.id); }); toast('Review deleted'); }}>Delete</button>])} /></>;
}

/* ---------------- Owner ---------------- */
const mineProps = (db, u) => db.properties.filter(p => p.ownerId === u.id);
export function ODash() {
  const { db, user } = useApp();
  const ids = mineProps(db, user).map(p => p.id);
  return <><h1>Owner Dashboard</h1>
    <div className="stats"><Stat n={ids.length} l="My Properties" /><Stat n={db.visits.filter(v => ids.includes(v.propId) && v.status === 'Pending').length} l="Pending Visits" /><Stat n={db.apps.filter(a => ids.includes(a.propId) && a.status !== 'Approved' && a.status !== 'Rejected').length} l="Open Applications" /><Stat n={mineProps(db, user).filter(p => p.status === 'Verified').length} l="Verified Listings" /></div>
    <p><a className="btn" href="#/owner/form">+ Add Property</a> <a className="btn out" href="#/owner/visits">Manage Visit Requests</a></p></>;
}

export function OProps() {
  const { db, upd, user, toast } = useApp();
  const del = p => { if (!confirm('Delete "' + p.title + '"?')) return; upd(d => { d.properties = d.properties.filter(x => x.id !== p.id); d.favs = d.favs.filter(x => x.propId !== p.id); d.visits = d.visits.filter(x => x.propId !== p.id); d.apps = d.apps.filter(x => x.propId !== p.id); }); toast('Property deleted'); };
  const tog = p => upd(d => { const x = prop(d, p.id); x.available = !x.available; });
  return <><div className="bar"><h1>My Properties</h1><a className="btn" href="#/owner/form">+ Add Property</a></div>
    <Tbl heads={['Property', 'Rent', 'Status', 'Availability', 'Actions']} empty="You have not added any properties." rows={mineProps(db, user).map(p => [
      <div className="rowimg"><Img src={p.img} alt="" /><div><a href={'#/property/' + p.id}>{p.title}</a><br /><small className="muted">{p.location}</small></div></div>,
      money(p.rent), <Badge s={p.status} />, <button className="btn sm out" onClick={() => tog(p)}>{p.available ? 'Mark as Rented' : 'Mark Available'}</button>,
      <><a className="btn sm" href={'#/owner/form/' + p.id}>Edit</a> <button className="btn sm danger" onClick={() => del(p)}>Delete</button></>])} /></>;
}

export function OForm({ id }) {
  const { db, upd, user, go, toast } = useApp();
  const old = id ? db.properties.find(p => p.id === id && p.ownerId === user.id) : null;
  const [f, on, setF] = useF(old ? { title: old.title, location: old.location, rent: old.rent, bhk: old.bhk, type: old.type, img: old.img, desc: old.desc, amenities: old.amenities } : { title: '', location: '', rent: '', bhk: '1', type: 'Flat', img: '', desc: '', amenities: [] });
  const [e, setE] = useState({});
  if (id && !old) return <Empty t="Property not found." />;
  const submit = ev => {
    ev.preventDefault();
    const er = {};
    if (f.title.trim().length < 5) er.title = 'Title must be at least 5 characters';
    if (f.location.trim().length < 3) er.location = 'Enter the location';
    if (!(+f.rent > 0)) er.rent = 'Enter a valid rent amount';
    if (!(+f.bhk >= 1 && +f.bhk <= 10)) er.bhk = 'BHK must be between 1 and 10';
    if (f.img && !/^https?:\/\//.test(f.img)) er.img = 'Image must be a link starting with http';
    if (f.desc.trim().length < 20) er.desc = 'Description must be at least 20 characters';
    setE(er); if (Object.keys(er).length) return;
    const data = { title: f.title.trim(), location: f.location.trim(), rent: +f.rent, bhk: +f.bhk, type: f.type, desc: f.desc.trim(), amenities: f.amenities, img: f.img || (old && old.img) || IMG[Math.floor(Math.random() * IMG.length)] };
    upd(d => { if (old) Object.assign(prop(d, old.id), data, old.status === 'Rejected' ? { status: 'Pending' } : {}); else d.properties.push({ id: uid(), ownerId: user.id, status: 'Pending', available: true, ...data }); });
    toast(old ? 'Property updated' : 'Property added and sent for admin verification'); go('/owner/properties');
  };
  return <><h1>{old ? 'Edit Property' : 'Add Property'}</h1><form className="panel narrow" onSubmit={submit} noValidate>
    <Field label="Title" error={e.title}><input {...on('title')} /></Field>
    <Field label="Location" error={e.location}><input {...on('location')} /></Field>
    <div className="two"><Field label="Monthly rent (₹)" error={e.rent}><input type="number" {...on('rent')} /></Field>
      <Field label="BHK" error={e.bhk}><input type="number" {...on('bhk')} /></Field></div>
    <Field label="Property type"><select {...on('type')}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
    <Field label="Image link (optional)" error={e.img}><input placeholder="https://..." {...on('img')} /></Field>
    <Field label="Description" error={e.desc}><textarea rows="4" {...on('desc')} /></Field>
    <div className="field"><span>Amenities</span><div className="chk2">{AMEN.map(a => <label key={a} className="chk"><input type="checkbox" checked={f.amenities.includes(a)} onChange={() => setF({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] })} />{a}</label>)}</div></div>
    <button className="btn">{old ? 'Save changes' : 'Add property'}</button> <a className="btn out" href="#/owner/properties">Cancel</a>
  </form></>;
}

export function OVisits() {
  const { db, upd, user, toast } = useApp();
  const ids = mineProps(db, user).map(p => p.id);
  const set = (id, s) => { upd(d => { d.visits.find(v => v.id === id).status = s; }); toast('Visit request ' + s.toLowerCase()); };
  return <><h1>Visit Requests</h1>
    <Tbl heads={['Property', 'Tenant', 'Date & Time', 'Status', 'Action']} empty="No visit requests received yet." rows={db.visits.filter(v => ids.includes(v.propId)).reverse().map(v => [prop(db, v.propId)?.title, usr(db, v.userId)?.name + ' (' + usr(db, v.userId)?.phone + ')', v.date + ' · ' + v.time, <Badge s={v.status} />,
      v.status === 'Pending' ? <><button className="btn sm" onClick={() => set(v.id, 'Accepted')}>Accept</button> <button className="btn sm danger" onClick={() => set(v.id, 'Rejected')}>Reject</button></> : '-'])} /></>;
}

export function OApps() {
  const { db, upd, user, toast } = useApp();
  const ids = mineProps(db, user).map(p => p.id);
  const set = (a, s) => { upd(d => { d.apps.find(x => x.id === a.id).status = s; if (s === 'Approved') prop(d, a.propId).available = false; }); toast('Application ' + s.toLowerCase()); };
  return <><h1>Rental Applications</h1>
    <Tbl heads={['Property', 'Applicant', 'Message', 'Move-in', 'Status', 'Action']} empty="No rental applications yet." rows={db.apps.filter(a => ids.includes(a.propId)).reverse().map(a => [prop(db, a.propId)?.title, usr(db, a.userId)?.name, a.message, a.moveIn, <Badge s={a.status} />,
      a.status === 'Approved' || a.status === 'Rejected' ? '-' : <>{a.status === 'Submitted' && <button className="btn sm out" onClick={() => set(a, 'Under Review')}>Review</button>} <button className="btn sm" onClick={() => set(a, 'Approved')}>Approve</button> <button className="btn sm danger" onClick={() => set(a, 'Rejected')}>Reject</button></>])} /></>;
}

/* ---------------- Admin ---------------- */
export function ADash() {
  const { db } = useApp();
  return <><h1>Admin Dashboard</h1>
    <div className="stats"><Stat n={db.users.length} l="Total Users" /><Stat n={db.properties.length} l="Total Properties" /><Stat n={db.properties.filter(p => p.status === 'Pending').length} l="Pending Verification" /><Stat n={db.reports.filter(r => r.status === 'Open').length} l="Open Reports" /></div>
    <p><a className="btn" href="#/admin/properties">Verify Properties</a> <a className="btn out" href="#/admin/reports">View Reports</a> <a className="btn out" href="#/admin/users">Manage Users</a></p></>;
}

export function AUsers() {
  const { db, upd, user, toast } = useApp();
  const blk = u => { upd(d => { const x = usr(d, u.id); x.blocked = !x.blocked; }); toast(u.blocked ? 'User unblocked' : 'User blocked'); };
  const del = u => { if (!confirm('Delete user ' + u.name + '?')) return; upd(d => { d.users = d.users.filter(x => x.id !== u.id); d.favs = d.favs.filter(x => x.userId !== u.id); d.visits = d.visits.filter(x => x.userId !== u.id); d.apps = d.apps.filter(x => x.userId !== u.id); d.reviews = d.reviews.filter(x => x.userId !== u.id); }); toast('User deleted'); };
  return <><h1>Manage Users</h1>
    <Tbl heads={['Name', 'Email', 'Phone', 'Role', 'Status', 'Action']} empty="No users." rows={db.users.map(u => [u.name, u.email, u.phone, u.role, <Badge s={u.blocked ? 'Blocked' : 'Active'} />,
      u.id === user.id || u.role === 'admin' ? '-' : <><button className="btn sm out" onClick={() => blk(u)}>{u.blocked ? 'Unblock' : 'Block'}</button> <button className="btn sm danger" onClick={() => del(u)}>Delete</button></>])} /></>;
}

export function AProps() {
  const { db, upd, toast } = useApp();
  const [flt, setFlt] = useState('All');
  const set = (p, s) => { upd(d => { prop(d, p.id).status = s; }); toast('Listing ' + (s === 'Verified' ? 'verified and approved' : s.toLowerCase())); };
  const del = p => { if (!confirm('Delete listing?')) return; upd(d => { d.properties = d.properties.filter(x => x.id !== p.id); }); toast('Listing deleted'); };
  return <><div className="bar"><h1>Verify Properties</h1><select value={flt} onChange={e => setFlt(e.target.value)}>{['All', 'Pending', 'Verified', 'Rejected'].map(s => <option key={s}>{s}</option>)}</select></div>
    <Tbl heads={['Property', 'Owner', 'Rent', 'Status', 'Action']} empty="No properties in this list." rows={db.properties.filter(p => flt === 'All' || p.status === flt).map(p => [
      <div className="rowimg"><Img src={p.img} alt="" /><div><a href={'#/property/' + p.id}>{p.title}</a><br /><small className="muted">{p.location}</small></div></div>, usr(db, p.ownerId)?.name, money(p.rent), <Badge s={p.status} />,
      <>{p.status !== 'Verified' && <button className="btn sm" onClick={() => set(p, 'Verified')}>Verify / Approve</button>} {p.status !== 'Rejected' && <button className="btn sm danger" onClick={() => set(p, 'Rejected')}>Reject</button>} <button className="btn sm out" onClick={() => del(p)}>Delete</button></>])} /></>;
}

export function AReports() {
  const { db, upd, toast } = useApp();
  const set = (r, s, remove) => { upd(d => { d.reports.find(x => x.id === r.id).status = s; if (remove && prop(d, r.propId)) prop(d, r.propId).status = 'Rejected'; }); toast('Report ' + s.toLowerCase()); };
  return <><h1>Manage Reports</h1>
    <Tbl heads={['Property', 'Reported by', 'Reason', 'Status', 'Action']} empty="No reports." rows={db.reports.slice().reverse().map(r => [prop(db, r.propId)?.title || '(deleted)', usr(db, r.userId)?.name, r.reason, <Badge s={r.status} />,
      r.status === 'Open' ? <><button className="btn sm danger" onClick={() => set(r, 'Resolved', true)}>Remove Listing</button> <button className="btn sm out" onClick={() => set(r, 'Dismissed')}>Dismiss</button></> : '-'])} /></>;
}
