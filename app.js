// Application Logic
let cart = [];
let currentProduct = null;
let allProducts = [];
let currentDisplayCount = 0;
const PRODUCTS_PER_PAGE = 8;

document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('product-gallery');
  const heroImgContainer = document.getElementById('hero-img-container');
  const featureImgContainer = document.getElementById('feature-img-container');

  // Modal Elements
  const modal = document.getElementById('product-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const modalImage = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalCategory = document.getElementById('modal-category');
  const addToBagBtn = document.getElementById('add-to-bag');

  // Cart Elements
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');
  const navCartBtn = document.getElementById('nav-cart-btn');
  const closeCartBtn = document.getElementById('close-cart');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const loadMoreBtn = document.getElementById('load-more-btn');

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadMoreProducts();
    });
  }

  // PASTE YOUR GOOGLE SHEET CSV LINK HERE
  const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQuQL-2EKGXcSBQDEG5b6qca-rzH7EfF7Z_r3xieFysP6LJFPyXf6mlwEQiPYVNEEfNGn_NRg8YcQAF/pub?gid=0&single=true&output=csv";

  if (GOOGLE_SHEET_CSV_URL) {
    fetchProductsFromSheet(GOOGLE_SHEET_CSV_URL);
  } else {
    gallery.innerHTML = `
      <div style="grid-column: span 2; padding: 32px; text-align: center;">
        <h2 class="font-display-lg" style="color: var(--ash-muted);">DATABASE NOT CONFIGURED</h2>
        <p style="margin-top: 16px;">Please paste your Google Sheet CSV link into app.js</p>
      </div>
    `;
  }

  async function fetchProductsFromSheet(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const csvText = await response.text();

      const lines = csvText.split('\n');
      const products = [];

      // Skip header row (index 0)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parse handling potential commas in quotes
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        if (parts.length >= 4) {
          const name = parts[0].replace(/^"|"$/g, '').trim();
          const category = parts[1].replace(/^"|"$/g, '').trim();
          const price = parseInt(parts[2].replace(/^"|"$/g, '').replace(/[^0-9]/g, '')) || 0;
          let link = parts[3].replace(/^"|"$/g, '').trim();

          // Convert regular Google Drive links to direct image links
          let id = null;
          const match1 = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
          const match2 = link.match(/id=([a-zA-Z0-9_-]+)/);
          if (match1) id = match1[1];
          else if (match2) id = match2[1];

          const imageUrl = id ? "https://lh3.googleusercontent.com/d/" + id : link;

          if (category.toUpperCase() === "HERO" || name.toUpperCase() === "HERO") {
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
              heroSection.style.backgroundImage = `url('${imageUrl}')`;
            }
          } else {
            products.push({
              id: id || `prod_${i}`,
              name: name || "UNTITLED",
              category: category || "NEW ARRIVAL",
              price: price || 150,
              url: imageUrl
            });
          }
        }
      }

      if (products.length > 0) {
        allProducts = products;
        currentDisplayCount = 0;
        gallery.innerHTML = ''; // Clear once before loading first batch
        loadMoreProducts();
      } else {
        throw new Error("No products found in sheet");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      gallery.innerHTML = `
        <div style="grid-column: span 2; padding: 32px; text-align: center;">
          <h2 class="font-display-lg" style="color: var(--ash-muted);">ERROR LOADING PRODUCTS</h2>
          <p style="margin-top: 16px;">Make sure your Google Sheet is published to web as CSV.</p>
        </div>
      `;
    }
  }

  // Load Archive Images
  if (window.ARCHIVE_IMAGES && window.ARCHIVE_IMAGES.length >= 2) {
    const archiveImg1 = document.querySelector('.placeholder-img-1');
    const archiveImg2 = document.querySelector('.placeholder-img-2');
    if (archiveImg1 && window.ARCHIVE_IMAGES[0]) {
      archiveImg1.style.backgroundImage = `url('${window.ARCHIVE_IMAGES[0]}')`;
    }
    if (archiveImg2 && window.ARCHIVE_IMAGES[1]) {
      archiveImg2.style.backgroundImage = `url('${window.ARCHIVE_IMAGES[1]}')`;
    }
  }

  function loadMoreProducts() {
    if (!allProducts || allProducts.length === 0) return;

    const nextProducts = allProducts.slice(currentDisplayCount, currentDisplayCount + PRODUCTS_PER_PAGE);
    renderShowcase(nextProducts, false); // false means append, do not clear
    currentDisplayCount += nextProducts.length;

    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
      if (currentDisplayCount >= allProducts.length) {
        loadMoreContainer.style.display = 'none';
      } else {
        loadMoreContainer.style.display = 'block';
      }
    }
  }

  function renderShowcase(products, clear = true) {
    if (!products || products.length === 0) return;

    if (clear) gallery.innerHTML = '';
    products.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const priceVal = product.price || Math.floor(Math.random() * 300 + 150);
      product.price = priceVal; // Ensure product has a price
      const priceStr = `₹${priceVal}`;

      card.innerHTML = `
        <button class="wishlist-btn"><span class="material-symbols-outlined">favorite_border</span></button>
        <div class="product-img-wrapper">
          <img src="${product.url}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <span class="product-price">${priceStr}</span>
          <span class="product-label">NEW</span>
        </div>
      `;

      card.addEventListener('click', () => openModal(product));
      gallery.appendChild(card);
    });
  }

  function openModal(product) {
    currentProduct = product;
    modalImage.src = product.url;
    modalTitle.textContent = product.name;
    modalPrice.textContent = product.price;
    modalCategory.textContent = product.category || 'PREMIUM SILK';
    modal.classList.add('open');
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  });

  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', () => {
      modal.classList.remove('open');
      modalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Cart Logic
  addToBagBtn.addEventListener('click', () => {
    if (!currentProduct) return;

    const existingItem = cart.find(item => item.id === currentProduct.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...currentProduct, quantity: 1 });
    }

    renderCart();
    modal.classList.remove('open'); // Close product modal
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('open');
    openCart(); // Open cart to show it was added
  });

  function openCart() {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (navCartBtn) navCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
      total += item.price * item.quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.url}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-header">
            <span class="cart-item-category">${item.category || 'WEAVES365'}</span>
            <span class="cart-item-price">₹${item.price}</span>
          </div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-actions">
            <div class="qty-selector">
              <button class="qty-btn dec" data-index="${index}">-</button>
              <span class="qty-value">${String(item.quantity).padStart(2, '0')}</span>
              <button class="qty-btn inc" data-index="${index}">+</button>
            </div>
            <button class="delete-btn" data-index="${index}">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    cartSubtotal.textContent = `₹${total.toFixed(2)}`;
    cartTotal.textContent = `₹${total.toFixed(2)}`;

    // Add event listeners to buttons
    document.querySelectorAll('.qty-btn.inc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        cart[idx].quantity += 1;
        renderCart();
      });
    });

    document.querySelectorAll('.qty-btn.dec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        if (cart[idx].quantity > 1) {
          cart[idx].quantity -= 1;
        } else {
          cart.splice(idx, 1);
        }
        renderCart();
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        cart.splice(idx, 1);
        renderCart();
      });
    });
  }

  // Checkout Logic - WhatsApp Integration
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert("Your bag is empty!");
        return;
      }

      const phoneNumber = "919919101369";
      let message = "Hello, I want to inqure about these products\n\n";

      cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (Qty: ${item.quantity})\nLink: ${item.url}\n\n`;
      });

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
});
