// テーブル番号（URL の ?table=5 のように指定できる。なければ 12）
const TABLE_NO = new URLSearchParams(location.search).get("table") || "12";

// オプションの種類（最初の選択肢が初期値）
const OPTION_GROUPS = {
  rice: {
    label: "ライス",
    choices: [
      { label: "なし", price: 0 },
      { label: "普通", price: 180 },
      { label: "大盛り", price: 240 },
    ],
  },
  sauce: {
    label: "ソース",
    choices: [
      { label: "デミグラス", price: 0 },
      { label: "和風おろし", price: 0 },
      { label: "チーズ", price: 100 },
    ],
  },
  drinkbar: {
    label: "ドリンクバー",
    choices: [
      { label: "なし", price: 0 },
      { label: "セットにする", price: 250 },
    ],
  },
  size: {
    label: "サイズ",
    choices: [
      { label: "レギュラー", price: 0 },
      { label: "ラージ", price: 150 },
    ],
  },
};

// メニューのデータ（店名・メニュー・価格はすべて架空）
const MENU = [
  { id: 1, category: "ハンバーグ", emoji: "🍖", name: "ハンバーグステーキ", price: 790, desc: "ふっくら焼き上げた定番ハンバーグ。", options: ["sauce", "rice", "drinkbar"] },
  { id: 2, category: "ハンバーグ", emoji: "🧀", name: "チーズインハンバーグ", price: 890, desc: "中からとろけるチーズがあふれます。", options: ["rice", "drinkbar"] },
  { id: 3, category: "ハンバーグ", emoji: "🍳", name: "目玉焼きハンバーグ", price: 850, desc: "半熟の目玉焼きをのせました。", options: ["sauce", "rice", "drinkbar"] },
  { id: 4, category: "定食・ごはん", emoji: "🍗", name: "からあげ定食", price: 820, desc: "外はカリッと、中はジューシー。", options: ["rice", "drinkbar"] },
  { id: 5, category: "定食・ごはん", emoji: "🍛", name: "ビーフカレー", price: 750, desc: "じっくり煮込んだ自家製カレー。", options: ["size", "drinkbar"] },
  { id: 6, category: "定食・ごはん", emoji: "🍳", name: "オムライス", price: 780, desc: "ふわとろ卵のオムライス。", options: ["size", "drinkbar"] },
  { id: 7, category: "パスタ・ピザ", emoji: "🍝", name: "ミートソーススパゲティ", price: 690, desc: "トマトの酸味が効いたソース。", options: ["size", "drinkbar"] },
  { id: 8, category: "パスタ・ピザ", emoji: "🍕", name: "マルゲリータピザ", price: 590, desc: "トマト・モッツァレラ・バジル。", options: ["drinkbar"] },
  { id: 9, category: "サイド", emoji: "🍟", name: "山盛りポテトフライ", price: 390, desc: "みんなでシェアできるボリューム。", options: [] },
  { id: 10, category: "サイド", emoji: "🥗", name: "シーザーサラダ", price: 420, desc: "シャキシャキのロメインレタス。", options: [] },
  { id: 11, category: "サイド", emoji: "🥣", name: "コーンスープ", price: 250, desc: "やさしい甘さのポタージュ。", options: [] },
  { id: 12, category: "ドリンク", emoji: "🥤", name: "ドリンクバー（単品）", price: 380, desc: "ソフトドリンク・コーヒー・紅茶が飲み放題。", options: [] },
  { id: 13, category: "ドリンク", emoji: "🍺", name: "生ビール", price: 490, desc: "キンキンに冷えた一杯。", options: ["size"] },
  { id: 14, category: "デザート", emoji: "🍮", name: "なめらかプリン", price: 350, desc: "カラメルソースを添えて。", options: [] },
  { id: 15, category: "デザート", emoji: "🍨", name: "チョコレートパフェ", price: 590, desc: "アイスとブラウニーたっぷり。", options: [] },
  { id: 16, category: "デザート", emoji: "🍰", name: "いちごのショートケーキ", price: 420, desc: "ふんわりスポンジと生クリーム。", options: [] },
];

const CATEGORIES = [...new Set(MENU.map((item) => item.category))];

const CART_KEY = "asd-cart-v2";
const ORDERS_KEY = "asd-orders-v2";

// localStorage から読み込む（読めないときは初期値を使う）
function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 保存できなくても画面は動くようにする
  }
}

// cart は [{ id, choices: { オプション名: 選択肢の番号 }, qty }] の形で持つ
let cart = load(CART_KEY, []);
let orders = load(ORDERS_KEY, []);
let currentCategory = CATEGORIES[0];

function yen(n) {
  return "¥" + n.toLocaleString("ja-JP");
}

function findMenu(id) {
  return MENU.find((item) => item.id === id);
}

// メニューの画像を box に表示する
// 画像は images/メニューID.jpg（item.image で別のファイルも指定できる）。見つからなければ絵文字を表示
function showMenuImage(box, item) {
  box.innerHTML = "";
  const img = document.createElement("img");
  img.src = item.image || `images/${item.id}.jpg`;
  img.alt = item.name;
  img.addEventListener("error", () => {
    box.textContent = item.emoji;
  });
  box.appendChild(img);
}

// 選んだオプション込みの1個あたりの値段
function unitPrice(item, choices) {
  let price = item.price;
  for (const key of item.options) {
    price += OPTION_GROUPS[key].choices[choices[key]].price;
  }
  return price;
}

// 「ライス:大盛り / ドリンクバー:セットにする」のような説明文
function optionText(item, choices) {
  return item.options
    .map((key) => `${OPTION_GROUPS[key].label}：${OPTION_GROUPS[key].choices[choices[key]].label}`)
    .join(" / ");
}

function cartTotal() {
  return cart.reduce((sum, line) => sum + unitPrice(findMenu(line.id), line.choices) * line.qty, 0);
}

// ---------- 画面の表示 ----------

function renderCategories() {
  const nav = document.getElementById("categories");
  nav.innerHTML = "";
  for (const category of CATEGORIES) {
    const button = document.createElement("button");
    button.className = "category" + (category === currentCategory ? " active" : "");
    button.textContent = category;
    button.addEventListener("click", () => {
      currentCategory = category;
      renderCategories();
      renderMenu();
    });
    nav.appendChild(button);
  }
}

function renderMenu() {
  document.getElementById("menu-title").textContent = currentCategory;
  const list = document.getElementById("menu-list");
  list.innerHTML = "";
  for (const item of MENU.filter((m) => m.category === currentCategory)) {
    const card = document.createElement("button");
    card.className = "menu-item";
    card.innerHTML = `
      <div class="menu-image"></div>
      <div class="menu-body">
        <div class="menu-name"></div>
        <div class="price"></div>
      </div>
    `;
    showMenuImage(card.querySelector(".menu-image"), item);
    card.querySelector(".menu-name").textContent = item.name;
    card.querySelector(".price").textContent = yen(item.price);
    card.addEventListener("click", () => openDetail(item));
    list.appendChild(card);
  }
}

function renderCart() {
  const list = document.getElementById("cart-list");
  list.innerHTML = "";

  cart.forEach((line, index) => {
    const item = findMenu(line.id);
    const row = document.createElement("li");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-row-top">
        <span class="name"></span>
        <span class="line-price"></span>
      </div>
      <div class="option-text"></div>
      <div class="cart-row-bottom">
        <button class="qty-button" aria-label="減らす">−</button>
        <span class="qty"></span>
        <button class="qty-button" aria-label="増やす">＋</button>
      </div>
    `;
    row.querySelector(".name").textContent = item.name;
    row.querySelector(".line-price").textContent = yen(unitPrice(item, line.choices) * line.qty);
    row.querySelector(".option-text").textContent = optionText(item, line.choices);
    row.querySelector(".qty").textContent = line.qty;
    const [minus, plus] = row.querySelectorAll(".qty-button");
    minus.addEventListener("click", () => changeQty(index, -1));
    plus.addEventListener("click", () => changeQty(index, 1));
    list.appendChild(row);
  });

  document.getElementById("cart-empty").hidden = cart.length > 0;
  document.getElementById("cart-total").textContent = yen(cartTotal());
  document.getElementById("order-button").disabled = cart.length === 0;
}

// かごの中の個数を増減する（0 になったら消す）
function changeQty(index, diff) {
  cart[index].qty += diff;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  save(CART_KEY, cart);
  renderCart();
}

// ---------- 商品の詳細 ----------

const detailModal = document.getElementById("detail-modal");
let detailItem = null;
let detailChoices = {};
let detailQty = 1;

function openDetail(item) {
  detailItem = item;
  detailChoices = {};
  detailQty = 1;

  showMenuImage(document.getElementById("detail-image"), item);
  document.getElementById("detail-name").textContent = item.name;
  document.getElementById("detail-desc").textContent = item.desc;

  const options = document.getElementById("detail-options");
  options.innerHTML = "";
  for (const key of item.options) {
    const group = OPTION_GROUPS[key];
    detailChoices[key] = 0;

    const fieldset = document.createElement("fieldset");
    fieldset.className = "option-group";
    const legend = document.createElement("legend");
    legend.textContent = group.label;
    fieldset.appendChild(legend);

    const choicesBox = document.createElement("div");
    choicesBox.className = "option-choices";
    group.choices.forEach((choice, i) => {
      const label = document.createElement("label");
      label.className = "option-choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = key;
      input.checked = i === 0;
      input.addEventListener("change", () => {
        detailChoices[key] = i;
        updateDetailPrice();
      });
      label.appendChild(input);
      label.append(choice.price > 0 ? `${choice.label}（+${yen(choice.price)}）` : choice.label);
      choicesBox.appendChild(label);
    });
    fieldset.appendChild(choicesBox);
    options.appendChild(fieldset);
  }

  updateDetailPrice();
  detailModal.showModal();
}

function updateDetailPrice() {
  document.getElementById("detail-qty").textContent = detailQty;
  const total = unitPrice(detailItem, detailChoices) * detailQty;
  document.getElementById("detail-add").textContent = `かごに入れる（${yen(total)}）`;
}

document.getElementById("detail-minus").addEventListener("click", () => {
  if (detailQty > 1) detailQty--;
  updateDetailPrice();
});

document.getElementById("detail-plus").addEventListener("click", () => {
  if (detailQty < 20) detailQty++;
  updateDetailPrice();
});

document.getElementById("detail-add").addEventListener("click", () => {
  // 同じ商品・同じオプションなら個数をまとめる
  const same = cart.find(
    (line) => line.id === detailItem.id && JSON.stringify(line.choices) === JSON.stringify(detailChoices)
  );
  if (same) {
    same.qty += detailQty;
  } else {
    cart.push({ id: detailItem.id, choices: { ...detailChoices }, qty: detailQty });
  }
  save(CART_KEY, cart);
  renderCart();
  detailModal.close();
  showToast("かごに入れました");
});

// ---------- 注文の確認 ----------

const confirmModal = document.getElementById("confirm-modal");

document.getElementById("order-button").addEventListener("click", () => {
  const list = document.getElementById("confirm-list");
  list.innerHTML = "";
  for (const line of cart) {
    list.appendChild(summaryRow(findMenu(line.id), line.choices, line.qty));
  }
  document.getElementById("confirm-total").textContent = yen(cartTotal());
  confirmModal.showModal();
});

document.getElementById("confirm-button").addEventListener("click", () => {
  orders.push({
    time: Date.now(),
    lines: cart.map((line) => {
      const item = findMenu(line.id);
      return {
        name: item.name,
        options: optionText(item, line.choices),
        price: unitPrice(item, line.choices),
        qty: line.qty,
      };
    }),
  });
  save(ORDERS_KEY, orders);

  cart = [];
  save(CART_KEY, cart);
  renderCart();

  confirmModal.close();
  showToast("ご注文を承りました");
});

// 確認画面・履歴で使う1行（商品名・オプション・金額）
function summaryRow(item, choices, qty) {
  return makeSummaryRow(item.name, optionText(item, choices), unitPrice(item, choices), qty);
}

function makeSummaryRow(name, options, price, qty) {
  const li = document.createElement("li");
  li.innerHTML = `<div><div class="name"></div><div class="option-text"></div></div><span class="line-price"></span>`;
  li.querySelector(".name").textContent = `${name} ×${qty}`;
  li.querySelector(".option-text").textContent = options;
  li.querySelector(".line-price").textContent = yen(price * qty);
  return li;
}

// ---------- 注文履歴・お会計 ----------

const historyModal = document.getElementById("history-modal");

document.getElementById("history-button").addEventListener("click", () => {
  const list = document.getElementById("history-list");
  list.innerHTML = "";
  let total = 0;
  for (const order of orders) {
    const time = document.createElement("li");
    time.className = "history-time";
    time.textContent = new Date(order.time).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) + " のご注文";
    list.appendChild(time);
    for (const line of order.lines) {
      list.appendChild(makeSummaryRow(line.name, line.options, line.price, line.qty));
      total += line.price * line.qty;
    }
  }
  document.getElementById("history-empty").hidden = orders.length > 0;
  document.getElementById("history-total").textContent = yen(total);
  historyModal.showModal();
});

// ---------- 店員呼び出し ----------

document.getElementById("call-button").addEventListener("click", () => {
  document.getElementById("call-modal").showModal();
});

// 「戻る」「閉じる」ボタンでモーダルを閉じる
for (const button of document.querySelectorAll("[data-close]")) {
  button.addEventListener("click", () => button.closest("dialog").close());
}

// ---------- お知らせ ----------

let toastTimer = null;

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2500);
}

// ---------- 最初の表示 ----------

document.getElementById("table-no").textContent = `テーブル ${TABLE_NO}`;
renderCategories();
renderMenu();
renderCart();
