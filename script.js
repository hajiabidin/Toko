import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// === 1. ISI DATA FIREBASE KAMU ===

    const firebaseConfig = {

        apiKey: "AIzaSyCJzsN9cD8GavaG48oO6ngipjlm3_qGCpc",

        databaseURL: "https://toko-digital-da8bc-default-rtdb.asia-southeast1.firebasedatabase.app/",

        projectId: "toko-digital-da8bc",

    };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products');

// --- DATA STATE ---
let products = [];
let cart = [];
const NOMOR_WA_ADMIN = "6289630280705"; 
const HARGA_ONGKIR = 3000;

// === 2. AMBIL DATA DARI CLOUD ===
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Mengubah objek Firebase menjadi Array agar mudah diolah
        products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        renderProducts(products);
        renderCategoryNav();
    }
});

// === 3. FUNGSI RENDER UTAMA ===
window.renderProducts = function(data = products) {
    const container = document.getElementById('product-list');
    if(!container) return;

    container.innerHTML = data.map(p => {
        // Logika Stok: Jika status undefined atau true, maka Tersedia
        const isReady = p.status !== false;

        return `
        <div class="product-card ${isReady ? '' : 'habis'}">
            <div style="position:relative; overflow:hidden; border-radius:10px;">
                <img src="${p.img}" 
                     onclick="window.showDetail('${p.id}')" 
                     style="width:100%; display:block; ${isReady ? '' : 'filter:grayscale(1); opacity:0.6'}">
                ${!isReady ? '<span style="position:absolute; top:70px; left:40px; background:red; color:white; padding:3px 8px; border-radius:4px; font-size:14px; font-weight:bold;">STOK HABIS</span>' : ''}
            </div>
            <h4 onclick="window.showDetail('${p.id}')" style="margin:10px 0 5px 0;">${p.name}</h4>
            <p style="color:#2563eb; font-weight:bold; margin:1 3 10px 0; display: flex; justify-content: space-between;">Rp ${Number(p.price).toLocaleString()}
            
            <button onclick="${isReady ? `window.addToCart('${p.id}')` : ''}" 
                    ${isReady ? '' : 'disabled'} 
                    style="padding: 2px 2px; border-radius: 8px; border: 2px solid var(--primary); font-weight:bold; color:${isReady ? 'var(--primary)' : 'white'}; white-space: nowrap; cursor:${isReady ? 'pointer' : 'not-allowed'}; background:${isReady ? 'transparent' : 'red'}">
                ${isReady ? '+ ADD 🛒' : '- Habis -'}
            </button></p>
        </div>
        `;
    }).join('');
};

// --- Batas render stok habis ---

function renderCategoryNav() {
    const nav = document.querySelector('.category-nav');
    if(!nav) return;
    const categories = ['Semua', ...new Set(products.map(p => p.category))];
    nav.innerHTML = categories.map(cat => `
        <button class="cat-btn" onclick="window.filterProduct('${cat}', event)">${cat}</button>
    `).join('');
}

// === 4. DETAIL PRODUK ===
window.showDetail = function(id) {
    const p = products.find(x => x.id === id);
    if(!p) return;
    
    const isReady = p.status !== false;
    
    document.getElementById('detail-img').src = p.img;
    document.getElementById('detail-name').innerText = p.name;
    document.getElementById('detail-price').innerText = "Rp " + Number(p.price).toLocaleString();
    document.getElementById('detail-desc').innerText = p.desc || 'Tidak ada deskripsi.';
    
    const btn = document.getElementById('detail-add-btn');
    if(isReady) {
        btn.innerText = "+ Keranjang";
        btn.disabled = false;
        btn.style.background = "#2563eb";
        btn.onclick = () => { window.addToCart(p.id); window.toggleDetail(); };
    } else {
        btn.innerText = "Stok Habis";
        btn.disabled = true;
        btn.style.background = "#ccc";
        btn.onclick = null;
    }
    
    document.getElementById('detail-screen').classList.remove('hidden');
};

window.toggleDetail = () => document.getElementById('detail-screen').classList.add('hidden');

// === 5. LOGIKA KERANJANG ===
window.addToCart = function(id) {
    const product = products.find(x => x.id === id);
    if(!product || product.status === false) return; // Proteksi tambahan

    const existing = cart.find(x => x.id === id);
    if(existing) existing.qty += 1;
    else cart.push({...product, qty: 1});
    
    updateCartCount();
    showToast(`${product.name}\nMasuk keranjang!`);
    // alert("Berhasil ditambah ke keranjang!");
};

function updateCartCount() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cart-count').innerText = count;
}

window.toggleCart = function() {
    document.getElementById('cart-screen').classList.toggle('hidden');
    renderCartItems();
};

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    
    if(cart.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>Keranjang Kosong</p>";
        summary.innerHTML = ""; return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map((item, idx) => {
        const itemSub = item.price * item.qty;
        subtotal += itemSub;
        return `
            <div style="border-bottom:1px solid #eee; padding:10px 0;">
                <div style="display:flex; justify-content:space-between;">
                    <b>${idx + 1}. ${item.name}</b>
                    <div>
                        <button onclick="window.updateQty(${idx}, -1)">-</button>
                        <span style="margin:0 10px">${item.qty}</span>
                        <button onclick="window.updateQty(${idx}, 1)">+</button>
                    </div>
                </div>
                <div style="font-size:12px; color:#666;">@Rp ${item.price.toLocaleString()} | Sub: Rp ${itemSub.toLocaleString()}</div>
            </div>`;
    }).join('');

    summary.innerHTML = `
        <div style="padding:15px; background:#f9f9f9; border-radius:10px; margin-top:10px;">
            <div style="display:flex; justify-content:space-between"><span>Subtotal:</span> <span>Rp ${subtotal.toLocaleString()}</span></div>
            <div style="display:flex; justify-content:space-between"><span>Ongkir:</span> <span>Rp ${HARGA_ONGKIR.toLocaleString()}</span></div>
            <hr>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px;">
                <span>TOTAL:</span> <span>Rp ${(subtotal + HARGA_ONGKIR).toLocaleString()}</span>
            </div>
        </div>`;
}

window.updateQty = function(idx, chg) {
    cart[idx].qty += chg;
    if(cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartCount();
    renderCartItems();
};

// === 6. FITUR SEARCH & FILTER ===
window.filterProduct = function(cat, event) {
    window.renderProducts(cat === 'Semua' ? products : products.filter(p => p.category === cat));
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if(event) event.target.classList.add('active');
};

window.searchProduct = function() {
    const k = document.getElementById('search-input').value.toLowerCase();
    window.renderProducts(products.filter(p => p.name.toLowerCase().includes(k)));
};

// === 7. WHATSAPP & AUTO-RESET KERANJANG ===
window.sendWA = function() {
    const user = JSON.parse(localStorage.getItem('userData'));
    if (!user) return alert("Mohon isi data diri (Pendaftaran) terlebih dahulu!");
    if (cart.length === 0) return alert("Keranjang masih kosong!");

    // Header Pesan
    let t = `*PESANAN BARU*\n`;
    t += `*----------------------------*\n`;
    t += `Nama: ${user.name}\n`;
    t += `Alamat: ${user.address}\n`;
    t += `----------------------------\n`;
    t += `*DAFTAR BELANJA:*\n\n`;

    let subtotal = 0;

    // Looping Produk dengan format baru
    cart.forEach((i, index) => {
        const itemTotal = i.price * i.qty;
        subtotal += itemTotal;

        // 1. *Nama Barang* (Tebal)
        // @Rp Harga Satuan x Jumlah = Total Harga Barang (Biasa)
        t += `*${index + 1}. ${i.name}*\n`; 
        t += `    @Rp ${i.price.toLocaleString()} x ${i.qty} = Rp ${itemTotal.toLocaleString()}\n`;
    });

    // Rincian Pembayaran
    t += `----------------------------\n`;
    t += `Subtotal: Rp ${subtotal.toLocaleString()}\n`;
    t += `Ongkos Kirim: Rp ${HARGA_ONGKIR.toLocaleString()}\n`;
    t += `*----------------------------*\n`;
    t += `*TOTAL : Rp ${(subtotal + HARGA_ONGKIR).toLocaleString()}*\n`;
    t += `*----------------------------*\n`;
    t += `\nSegera siapkan ya min, terima kasih!`;
    
    // Buka WhatsApp
    window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(t)}`);

    // Reset Keranjang setelah kirim (Opsional, agar tidak dobel pesan)
    cart = [];
    if(document.getElementById('cart-count')) document.getElementById('cart-count').innerText = 0;
    if(typeof renderCartItems === "function") renderCartItems();
    
    alert("Pesanan terkirim ke WhatsApp!");
};


// === 8. LAIN-LAIN ===
window.saveUser = function() {
    const n = document.getElementById('reg-name').value;
    const w = document.getElementById('reg-wa').value;
    const a = document.getElementById('reg-address').value;
    if(!n || !w || !a) return alert("⚠️ Isi data lengkap!");
    localStorage.setItem('userData', JSON.stringify({name:n, wa:w, address:a}));
    document.getElementById('reg-screen').classList.add('hidden');
    location.reload(); // Reload untuk update nama di header
};

window.onload = () => {
    const user = localStorage.getItem('userData');
    if (user) {
        document.getElementById('reg-screen').classList.add('hidden');
        const d = JSON.parse(user);
        if(document.getElementById('display-name')) {
            document.getElementById('display-name').innerText = d.name.toUpperCase();
        }
    }
};

// Menampilkan toast info alert sebentar
window.showToast = function(pesan) {
    const toast = document.getElementById('toast');
    if(!toast) return;

    toast.innerText = pesan;
    toast.classList.add('show');
    
    // Hilangkan otomatis setelah 2 detik
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
};
