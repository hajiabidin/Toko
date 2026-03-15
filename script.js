import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- ISI DENGAN DATA FIREBASE KAMU ---
const firebaseConfig = {
    apiKey: "AIzaSyCJzsN9cD8GavaG48oO6ngipjlm3_qGCpc", 
    databaseURL: "https://toko-digital-da8bc-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "toko-digital-da8bc",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products');

let products = []; 
let cart = [];
const NOMOR_WA_ADMIN = "6289630280705"; 
const HARGA_ONGKIR = 3000;

// --- SYNC DATA DARI FIREBASE ---
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        renderProducts(products); 
        renderCategoryButtons(); 
    }
});

// --- FUNGSI TAMPILAN PRODUK ---
function renderProducts(data = products) {
    const container = document.getElementById('product-list');
    if(!container) return;
    container.innerHTML = data.map(p => `
        <div class="product-card">
            <img src="${p.img}" alt="${p.name}" onclick="showDetail('${p.id}')">
            <div class="product-info">
                <h4 onclick="showDetail('${p.id}')">${p.name}</h4>
                <p>Rp ${Number(p.price).toLocaleString()}</p>
                <button class="btn-primary" onclick="addToCart('${p.id}')">+ Keranjang</button>
            </div>
        </div>
    `).join('');
}

// --- FUNGSI KATEGORI OTOMATIS ---
function renderCategoryButtons() {
    const container = document.getElementById('category-container'); 
    if(!container) return;
    const categories = ['Semua', ...new Set(products.map(p => p.category))];
    container.innerHTML = categories.map(cat => `
        <button class="cat-btn" onclick="filterProduct('${cat}')">${cat}</button>
    `).join('');
}

// --- FUNGSI TEMA & USER ---
function setTheme(m) {
    document.body.className = m + '-mode';
}

function saveUser() {
    const n = document.getElementById('reg-name').value;
    const w = document.getElementById('reg-wa').value;
    const a = document.getElementById('reg-address').value;
    if(!n || !w || !a) return alert("Isi data lengkap!");
    localStorage.setItem('userData', JSON.stringify({name:n, wa:w, address:a}));
    document.getElementById('reg-screen').classList.add('hidden');
    updateGreeting();
}

function updateGreeting() {
    const d = JSON.parse(localStorage.getItem('userData'));
    if(d) document.getElementById('display-name').innerText = d.name.toUpperCase();
}

// --- FUNGSI WA & KERANJANG ---
function addToCart(id) {
    const p = products.find(x => x.id === id);
    const existing = cart.find(x => x.id === id);
    if(existing) existing.qty += 1;
    else cart.push({...p, qty: 1});
    updateCartCount();
}

function updateCartCount() {
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
}

// --- JABAT TANGAN (EXPOSE KE HTML) ---
window.onload = () => {
    if (localStorage.getItem('userData')) document.getElementById('reg-screen').classList.add('hidden');
    updateGreeting();
};
window.setTheme = setTheme;
window.saveUser = saveUser;
window.filterProduct = (cat) => {
    renderProducts(cat === 'Semua' ? products : products.filter(p => p.category === cat));
};
window.addToCart = addToCart;
window.showDetail = (id) => {
    const p = products.find(x => x.id === id);
    document.getElementById('detail-img').src = p.img;
    document.getElementById('detail-name').innerText = p.name;
    document.getElementById('detail-price').innerText = "Rp " + Number(p.price).toLocaleString();
    document.getElementById('detail-desc').innerText = p.desc;
    document.getElementById('detail-screen').classList.remove('hidden');
};
window.toggleDetail = () => document.getElementById('detail-screen').classList.toggle('hidden');
window.toggleCart = () => document.getElementById('cart-screen').classList.toggle('hidden');
