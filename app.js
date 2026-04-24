// Application Logic
let cart = [];
let currentProduct = null;
let allProducts = [];
let allProductsWithVariants = []; // Stores every row including color variants
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

        // Column order: Name(0), Category(1), Price(2), GroupID(3), Color(4), Link(5)
        if (parts.length >= 4) {
          const name = parts[0].replace(/^"|"$/g, '').trim();
          const category = parts[1].replace(/^"|"$/g, '').trim();
          const price = parseInt(parts[2].replace(/^"|"$/g, '').replace(/[^0-9]/g, '')) || 0;
          const groupId = (parts[3] || '').replace(/^"|"$/g, '').trim();
          const color = (parts[4] || '').replace(/^"|"$/g, '').trim();
          let link = (parts[5] || parts[3] || '').replace(/^"|"$/g, '').trim();

          // If no groupId/color columns exist, fall back: link is parts[3]
          // Detect: if groupId looks like a URL, treat it as the link (backwards compat)
          let actualLink = link;
          let actualGroupId = groupId;
          let actualColor = color;
          if (groupId && (groupId.startsWith('http') || groupId.startsWith('drive.google'))) {
            // Old format without groupId/color columns
            actualLink = groupId;
            actualGroupId = '';
            actualColor = '';
          }

          // Convert regular Google Drive links to direct image links
          let id = null;
          const match1 = actualLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
          const match2 = actualLink.match(/id=([a-zA-Z0-9_-]+)/);
          if (match1) id = match1[1];
          else if (match2) id = match2[1];

          const imageUrl = id ? "https://lh3.googleusercontent.com/d/" + id : actualLink;

          if (category.toUpperCase() === "HERO" || name.toUpperCase() === "HERO") {
            const heroImg = document.querySelector('.hero-bg-img');
            if (heroImg) {
              heroImg.src = imageUrl;
            }
          } else if (category.toUpperCase() === "BESTSELLER" || category.toUpperCase() === "BESTSELLERS") {
            if (!window.bestsellerProducts) window.bestsellerProducts = [];
            window.bestsellerProducts.push({
              id: id || `prod_${i}`,
              name: name || "UNTITLED",
              category: category || "BESTSELLER",
              price: price || 150,
              url: imageUrl,
              groupId: actualGroupId,
              color: actualColor
            });
          } else {
            products.push({
              id: id || `prod_${i}`,
              name: name || "UNTITLED",
              category: category || "NEW ARRIVAL",
              price: price || 150,
              url: imageUrl,
              groupId: actualGroupId,
              color: actualColor
            });
          }
        }
      }

      // Render Bestsellers
      const bestsellerGallery = document.getElementById('bestseller-gallery');
      if (bestsellerGallery && window.bestsellerProducts && window.bestsellerProducts.length > 0) {
        bestsellerGallery.innerHTML = ''; // Clear static placeholders
        window.bestsellerProducts.forEach((product) => {
          const card = document.createElement('div');
          card.className = 'product-card';
          const priceVal = product.price || Math.floor(Math.random() * 300 + 150);
          product.price = priceVal;
          const priceStr = `₹${priceVal}`;

          // Random rating for effect
          const ratingScore = (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1);
          const reviewCount = Math.floor(Math.random() * 300) + 50;

          card.innerHTML = `
            <button class="wishlist-btn"><span class="material-symbols-outlined">favorite_border</span></button>
            <div class="product-img-wrapper">
              <img src="${product.url}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
              <h3 class="product-title">${product.name}</h3>
              <span class="product-price">${priceStr}</span>
              <div class="rating"><span class="material-symbols-outlined" style="font-size: 14px; font-variation-settings: 'FILL' 1;">star</span> ${ratingScore} (${reviewCount})</div>
            </div>
          `;
          card.addEventListener('click', () => openModal(product));
          bestsellerGallery.appendChild(card);
        });
      }

      if (products.length > 0) {
        // Render Categories dynamically
        const categoryGrid = document.querySelector('.category-grid');
        if (categoryGrid) {
          const uniqueCategories = {};
          products.forEach(p => {
            const cat = p.category.toUpperCase();
            if (cat && cat !== 'NEW ARRIVAL' && cat !== 'HERO' && cat !== 'BESTSELLER' && cat !== 'BESTSELLERS') {
              if (!uniqueCategories[cat]) {
                uniqueCategories[cat] = p;
              }
            }
          });

          const categoriesToRender = Object.values(uniqueCategories);
          if (categoriesToRender.length > 0) {
            categoryGrid.innerHTML = ''; // Clear hardcoded ones
            categoriesToRender.slice(0, 5).forEach(p => {
              const catItem = document.createElement('a');
              catItem.href = '#product-gallery';
              catItem.className = 'category-item';
              catItem.innerHTML = `
                <div class="category-img-wrapper">
                  <img src="${p.url}" alt="${p.category}">
                </div>
                <div class="center">
                  <h3 class="category-title">${p.category}</h3>
                  <p class="body-md" style="font-size: 0.75rem; margin-top: 4px;">Explore Collection</p>
                </div>
              `;
              
              catItem.addEventListener('click', (e) => {
                e.preventDefault();
                // Filter products
                allProducts = window.originalProducts.filter(item => item.category.toUpperCase() === p.category.toUpperCase());
                currentDisplayCount = 0;
                gallery.innerHTML = '';
                
                // Update section header to show filter state
                const newInHeader = document.querySelector('#product-gallery').previousElementSibling;
                if (newInHeader) {
                  newInHeader.innerHTML = `
                    <h2 class="heading-md" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                      ${p.category.toUpperCase()}
                      <button id="clear-filter-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; padding: 4px; border-radius: 50%; transition: background 0.3s;" title="Clear Filter">
                        <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                      </button>
                    </h2>
                    <p class="body-md" style="margin-top: 8px;">Displaying ${allProducts.length} items</p>
                  `;
                  
                  const clearBtn = document.getElementById('clear-filter-btn');
                  if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                      allProducts = window.originalProducts;
                      currentDisplayCount = 0;
                      gallery.innerHTML = '';
                      newInHeader.innerHTML = `
                        <h2 class="heading-md">NEW IN <span class="material-symbols-outlined" style="color: #b77b5a; font-size: 24px; vertical-align: middle;">filter_vintage</span></h2>
                        <p class="body-md" style="margin-top: 8px;">Fresh drops. Handpicked for you.</p>
                      `;
                      loadMoreProducts();
                    });
                  }
                }
                
                loadMoreProducts();
                
                // Smooth scroll to gallery
                const gallerySection = document.getElementById('product-gallery').parentElement;
                gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
              
              categoryGrid.appendChild(catItem);
            });
          }
        }

        // Keep ALL products (including all color variants) for modal lookups
        allProductsWithVariants = [...products];
        window.originalProductsWithVariants = [...products];

        // Deduplicate: show only the first product of each Group ID in the gallery
        const seenGroups = new Set();
        const deduped = products.filter(p => {
          if (!p.groupId) return true; // standalone product, always show
          if (seenGroups.has(p.groupId)) return false; // already have one from this group
          seenGroups.add(p.groupId);
          return true;
        });

        window.originalProducts = deduped;
        allProducts = deduped;
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

    // Render color swatches
    const colorContainer = document.getElementById('modal-color-selector');
    colorContainer.innerHTML = '';

    // Find all variants in the same group
    let variants = [];
    if (product.groupId) {
      variants = allProductsWithVariants.filter(p => p.groupId === product.groupId);
    }

    if (variants.length > 1) {
      const label = document.createElement('span');
      label.className = 'color-label-text';
      label.textContent = product.color || 'Color';
      label.id = 'current-color-label';
      colorContainer.appendChild(label);

      const swatchList = document.createElement('div');
      swatchList.className = 'color-swatch-list';

      variants.forEach(variant => {
        const btn = document.createElement('button');
        btn.className = 'color-swatch-btn';
        if (variant.id === product.id) btn.classList.add('active');
        btn.title = variant.color || variant.name;

        // Use a small thumbnail of the product image as the swatch
        btn.style.backgroundImage = `url('${variant.url}')`;
        btn.style.backgroundSize = 'cover';
        btn.style.backgroundPosition = 'center';

        btn.addEventListener('click', () => {
          // Update modal content to this variant
          currentProduct = variant;
          modalImage.src = variant.url;
          modalTitle.textContent = variant.name;
          modalPrice.textContent = variant.price;
          modalCategory.textContent = variant.category || 'PREMIUM SILK';

          // Update active swatch
          swatchList.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          // Update color label
          const lbl = document.getElementById('current-color-label');
          if (lbl) lbl.textContent = variant.color || 'Color';
        });

        swatchList.appendChild(btn);
      });

      colorContainer.appendChild(swatchList);
    }

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
