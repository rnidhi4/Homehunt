import { createContext, useContext } from 'react';
export const Ctx = createContext();
export const useApp = () => useContext(Ctx);
export const KEY = 'homehunt_db_v1';
export const AMEN = ['Parking', 'Lift', 'Water Supply', 'Furnished', 'Power Backup', 'Security', 'Gym', 'Balcony'];
export const TYPES = ['Flat', 'House', 'PG', 'Studio'];
export const IMG = ['photo-1568605114967-8130f3a36994', 'photo-1570129477492-45c003edd2be', 'photo-1522708323590-d24dbb6b0267', 'photo-1502672260266-1c1ef2d93688', 'photo-1560448204-e02f11c3d0e2', 'photo-1564013799919-ab600027ffc6', 'photo-1512917774080-9991f1c4c750', 'photo-1493809842364-78817add7ffb'].map(i => `https://images.unsplash.com/${i}?auto=format&fit=crop&w=900&q=70`);
export const fallback = () => 'data:image/svg+xml;utf8,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='900' height='600'><rect width='900' height='600' fill='#dbeafe'/><path d='M300 330l150-120 150 120v120H300z' fill='#2563eb'/><rect x='420' y='370' width='60' height='80' fill='#fff'/></svg>");
export const uid = () => Math.random().toString(36).slice(2, 9);
export const today = () => new Date().toISOString().slice(0, 10);
const pr = (i, o, title, location, rent, bhk, type, amenities, desc, status = 'Verified') => ({ id: 'p' + i, ownerId: o, title, location, rent, bhk, type, amenities, desc, img: IMG[i % IMG.length], status, available: true });
export const seed = () => ({
  users: [
    { id: 'u1', name: 'Rahul Sharma', email: 'tenant@demo.com', password: '123456', phone: '9876543210', role: 'tenant', blocked: false },
    { id: 'u2', name: 'Priya Verma', email: 'owner@demo.com', password: '123456', phone: '9822012345', role: 'owner', blocked: false },
    { id: 'u3', name: 'Amit Jain', email: 'amit@demo.com', password: '123456', phone: '9811122233', role: 'owner', blocked: false },
    { id: 'u4', name: 'Admin', email: 'admin@demo.com', password: '123456', phone: '9000000000', role: 'admin', blocked: false },
  ],
  properties: [
    pr(0, 'u2', 'Spacious 3BHK Villa near Lake', 'Shyamla Hills, Bhopal', 28000, 3, 'House', ['Parking', 'Security', 'Water Supply', 'Balcony'], 'Independent villa with a garden, large living area and modular kitchen. Quiet neighbourhood close to schools and the lake view road.'),
    pr(1, 'u2', 'Modern 2BHK Apartment', 'Arera Colony, Bhopal', 16500, 2, 'Flat', ['Lift', 'Parking', 'Power Backup', 'Security'], 'Well-ventilated 2BHK on the 4th floor with a lift, covered parking and 24x7 security. Walking distance to market and bus stop.'),
    pr(2, 'u3', 'Furnished 1BHK near IT Park', 'Vijay Nagar, Indore', 14000, 1, 'Flat', ['Furnished', 'Lift', 'Power Backup', 'Water Supply'], 'Fully furnished 1BHK with AC, wardrobe, bed and sofa. Ideal for working professionals, five minutes from the IT park.'),
    pr(3, 'u3', 'Cozy Studio Apartment', 'Koregaon Park, Pune', 18000, 1, 'Studio', ['Furnished', 'Gym', 'Security', 'Lift'], 'Compact studio with a modern pantry and a building gym. Cafes and restaurants within walking distance.'),
    pr(4, 'u2', 'Premium 3BHK with Balcony', 'Bandra West, Mumbai', 65000, 3, 'Flat', ['Lift', 'Gym', 'Parking', 'Balcony', 'Security'], 'Sea-breeze apartment in a premium society with a gym, covered parking and 24x7 security.'),
    pr(5, 'u3', 'Family 4BHK Independent House', 'Civil Lines, Jaipur', 32000, 4, 'House', ['Parking', 'Water Supply', 'Power Backup', 'Balcony'], 'Large independent house with a front lawn and rooftop terrace. Suitable for a big family, near good schools.'),
    pr(6, 'u2', 'Budget PG for Students', 'MP Nagar, Bhopal', 6500, 1, 'PG', ['Water Supply', 'Furnished', 'Power Backup'], 'Single-occupancy PG room with study table, Wi-Fi and meals option. Ten minutes from coaching centres.'),
    pr(7, 'u3', 'Bright 2BHK with Park View', 'Salt Lake, Kolkata', 22000, 2, 'Flat', ['Lift', 'Security', 'Parking'], 'Airy 2BHK facing a park, with two balconies and a modular kitchen. Newly painted and ready to move in.', 'Pending'),
    pr(8, 'u2', 'Luxury 3BHK Penthouse', 'Gachibowli, Hyderabad', 48000, 3, 'Flat', ['Lift', 'Gym', 'Parking', 'Furnished', 'Security'], 'Top-floor penthouse with a private terrace and city views. Semi-furnished with a clubhouse in the society.', 'Pending'),
  ],
  favs: [], visits: [], apps: [],
  reviews: [{ id: 'r1', userId: 'u1', propId: 'p1', rating: 5, comment: 'Great locality and a very cooperative owner.', date: '2026-10-02' }],
  reports: [{ id: 'rp1', userId: 'u1', propId: 'p6', reason: 'Photos look different from the actual property.', status: 'Open' }],
  session: null,
});
export const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.users) return d; } catch {} return seed(); };
