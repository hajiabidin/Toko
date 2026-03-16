import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// === ISI DATA FIREBASE KAMU ===

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

// --- AMBIL DATA CLOUD ---
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        renderProducts(products);
        renderCategoryNav();
    }
});

// --- FUNGSI RENDER UTAMA ---
function renderProducts(data = products) {
    const container = document.getElementById('product-list');
    if(!container) return;
    container.innerHTML = data.map(p => `
        <div class="product-card">
            <img src="${p.img}" onclick="window.showDetail('${p.id}')">
            <h4 onclick="window.showDetail('${p.id}')">${p.name}</h4>
            <p style="color:var(--primary); font-weight:bold;">Rp ${Number(p.price).toLocaleString()}</p>
            <button class="btn-primary" onclick="window.addToCart('${p.id}')">+ Keranjang</button>
        </div>
    `).join('');
}

function renderCategoryNav() {
    const nav = document.querySelector('.category-nav');
    if(!nav) return;
    const categories = ['Semua', ...new Set(products.map(p => p.category))];
    nav.innerHTML = categories.map(cat => `
        <button class="cat-btn" onclick="window.filterProduct('${cat}', event)">${cat}</button>
    `).join('');
}

// --- JABAT TANGAN (WINDOW EXPOSE) ---
window.saveUser = function() {
    const n = document.getElementById('reg-name').value;
    const w = document.getElementById('reg-wa').value;
    const a = document.getElementById('reg-address').value;
    if(!n || !w || !a) return alert("⚠️ Isi data lengkap!");
    localStorage.setItem('userData', JSON.stringify({name:n, wa:w, address:a}));
    document.getElementById('reg-screen').classList.add('hidden');
    updateGreeting();
};

function updateGreeting() {
    const d = JSON.parse(localStorage.getItem('userData'));
    if(d) document.getElementById('display-name').innerText = d.name.toUpperCase();
}

window.showReg = () => document.getElementById('reg-screen').classList.remove('hidden');
window.setTheme = (m) => { document.body.className = m + '-mode'; };

window.showDetail = function(id) {
    const p = products.find(x => x.id === id);
    if(!p) return;
    document.getElementById('detail-img').src = p.img;
    document.getElementById('detail-name').innerText = p.name;
    document.getElementById('detail-price').innerText = "Rp " + Number(p.price).toLocaleString();
    document.getElementById('detail-desc').innerText = p.desc;
    document.getElementById('detail-add-btn').onclick = () => { window.addToCart(p.id); window.toggleDetail(); };
    window.toggleDetail();
};

window.toggleDetail = () => document.getElementById('detail-screen').classList.toggle('hidden');

window.addToCart = function(id) {
    const product = products.find(x => x.id === id);
    const existing = cart.find(x => x.id === id);
    if(existing) existing.qty += 1;
    else cart.push({...product, qty: 1});
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
    // Notifikasi sederhana jika toast belum siap
    console.log("Ditambah ke keranjang");
};

window.toggleCart = function() {
    document.getElementById('cart-screen').classList.toggle('hidden');
    renderCartItems();
};

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    const memberArea = document.getElementById('member-info-thermal'); 
    const user = JSON.parse(localStorage.getItem('userData'));
    
    if(user && memberArea) {
        memberArea.innerHTML = `<div><b>Nama:</b> ${user.name}</div><div><b>WA:</b> ${user.wa}</div><div><b>Alamat:</b> ${user.address}</div>`;
    }

    if(cart.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>Keranjang Kosong</p>";
        summary.innerHTML = ""; return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map((item, idx) => {
        const itemSub = item.price * item.qty;
        subtotal += itemSub;
        return `
            <div class="cart-item-row">
                <div style="display:flex; justify-content:space-between;">
                    <span><b>${item.name}</b></span>
                    <div class="qty-control no-print">
                        <button onclick="window.updateQty(${idx}, -1)">-</button>
                        <b>${item.qty}</b>
                        <button onclick="window.updateQty(${idx}, 1)">+</button>
                    </div>
                </div>
                <div style="font-size:12px;">@Rp ${item.price.toLocaleString()} | Sub: Rp ${itemSub.toLocaleString()}</div>
            </div>`;
    }).join('');

    summary.innerHTML = `
        <div class="cart-summary-box">
            <div style="display:flex; justify-content:space-between"><span>Subtotal:</span> <span>Rp ${subtotal.toLocaleString()}</span></div>
            <div style="display:flex; justify-content:space-between"><span>Ongkir:</span> <span>Rp ${HARGA_ONGKIR.toLocaleString()}</span></div>
            <div class="total-line" style="display:flex; justify-content:space-between; font-weight:bold; border-top:1px solid #000; margin-top:5px; padding-top:5px;">
                <span>TOTAL:</span> <span>Rp ${(subtotal + HARGA_ONGKIR).toLocaleString()}</span>
            </div>
        </div>`;
}

window.updateQty = function(idx, chg) {
    cart[idx].qty += chg;
    if(cart[idx].qty <= 0) cart.splice(idx, 1);
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
    renderCartItems();
};

window.filterProduct = function(cat, event) {
    renderProducts(cat === 'Semua' ? products : products.filter(p => p.category === cat));
    const btns = document.querySelectorAll('.cat-btn');
    btns.forEach(b => b.classList.remove('active'));
    if(event) event.target.classList.add('active');
};

window.searchProduct = function() {
    const k = document.getElementById('search-input').value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(k)));
};

// --- ISI PESAN WHATAPP ---
window.sendWA = function() {
    const user = JSON.parse(localStorage.getItem('userData'));
    if (!user) return alert("Isi data dulu!");
    let t = `*PESANAN BARU COD*\nNama: ${user.name}\nAlamat: ${user.address}\n----------------------------\n*Daftar Belanja:*\n`;
    let sub = 0;
    cart.forEach(i => {
        t += `- ${i.name} (${i.qty}x)\n`;
        sub += (i.price * i.qty);
    });
        t += `----------------------------\nTotal: *Rp ${(sub + HARGA_ONGKIR).toLocaleString()}*\n\nSegera siapkan, Trimakasih.`;
    window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(t)}`);
};
// --- DATA PRINTER TERMAL ---
window.printThermal = () => window.print();

window.onload = () => {
    const user = localStorage.getItem('userData');
    if (user) document.getElementById('reg-screen').classList.add('hidden');
    updateGreeting();
};
