// меню, корзина, lightbox
document.addEventListener('DOMContentLoaded', ()=>{
  loadMenu();

  const cartModal = document.getElementById('cartModal');
  const openCart = document.getElementById('openCart');
  const closeCart = document.getElementById('closeCart');
  const cartList = document.getElementById('cartList');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartCountEl = document.getElementById('cartCount');
  const checkoutBtn = document.getElementById('checkoutOrder');
  const orderResult = document.getElementById('orderResult');

  function saveCart(){ localStorage.setItem('sushi_cart', JSON.stringify(cart)); }

  function updateCartDisplay(){
    cartCountEl.textContent = cart.reduce((a,c)=>a+c.qty,0);
    cartTotalEl.textContent = formatUAH(cart.reduce((a,c)=>a.price*c.qty+a,0));
    cartList.innerHTML = '';
    cart.forEach((item, idx)=>{
      const el = document.createElement('div'); el.className='cart-item';
      el.innerHTML = `
        <img src="${safeImg(item.img)}" alt="${escapeHtml(item.name)}">
        <div>
          <div>${escapeHtml(item.name)}</div>
          <div class="qty">
            <button class="icon-btn minus">-</button>
            <span>${item.qty}</span>
            <button class="icon-btn plus">+</button>
          </div>
        </div>
        <div>${formatUAH(item.price*item.qty)}</div>
      `;
      el.querySelector('.minus').onclick = ()=>{ item.qty--; if(item.qty<=0) cart.splice(idx,1); saveCart(); updateCartDisplay(); }
      el.querySelector('.plus').onclick = ()=>{ item.qty++; saveCart(); updateCartDisplay(); }
      cartList.appendChild(el);
    });
  }

  openCart.onclick = ()=>cartModal.classList.add('open');
  closeCart.onclick = ()=>cartModal.classList.remove('open');

  function addToCartFromProduct(p){
    const found = cart.find(c=>c.id===p.id);
    if(found){ found.qty++; } else { cart.push({ ...p, qty:1 }); }
    saveCart(); updateCartDisplay();
  }

  checkoutBtn.onclick = async ()=>{
    const customer = {
      name: document.getElementById('custName').value,
      phone: document.getElementById('custPhone').value,
      addr: document.getElementById('custAddr').value,
      note: document.getElementById('custNote').value
    };
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    orderResult.textContent = 'Відправляємо...';
    try{
      const res = await fetch(ORDER_API, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ items: cart, customer, paymentMethod })
      });
      const data = await res.json();
      if(data.success){ orderResult.textContent = `Замовлення прийнято #${data.id}`; cart=[]; saveCart(); updateCartDisplay(); }
      else orderResult.textContent = 'Помилка при оформленні';
    } catch(e){ orderResult.textContent = 'Помилка при відправці'; console.error(e); }
  };

  // Мини-lightbox
  const miniLB = document.getElementById('miniLightboxImg');
  function initProductLightbox(){
    document.querySelectorAll('.product-img').forEach(img=>{
      img.onclick = ()=>{
        miniLB.src = img.src;
        miniLB.style.display='block';
        miniLB.style.transform='scale(1)';
      }
    });
  }
  miniLB.onclick = ()=>{ miniLB.style.display='none'; miniLB.style.transform='scale(0.8)'; }

  updateCartDisplay();
});
