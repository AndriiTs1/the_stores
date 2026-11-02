# the_stores — скелет мультитенантной e-commerce платформы

Next.js 16 · Prisma 7 · PostgreSQL (Neon) · Stripe · Tailwind 4.
Одна база, много магазинов. `the_stores` — рабочее имя, пока нет финального названия.

## Запуск локально

```bash
npm install                      # также генерирует Prisma Client
cp .env.example .env             # указать DATABASE_URL
npm run db:migrate -- --name init  # создаст prisma/migrations/… и таблицы
npm run db:seed                  # демо-магазин demo: 16 товаров, 3 вымышленных бренда, плейсхолдеры в public/demo
npm run dev
```

Открыть:

| Адрес | Что это |
|---|---|
| http://localhost:3000 | главная платформы → /de, /fr, /it, /en (по cookie или языку браузера) |
| http://localhost:3000/platform | список магазинов (пароль админки) |
| http://localhost:3000/s/demo | магазин по пути (удобно для превью) |
| http://demo.localhost:3000 | тот же магазин на поддомене (Chrome и Firefox понимают *.localhost) |
| http://localhost:3000/s/demo/admin | админка (в dev без пароля) |
| http://localhost:3000/admin/login | вход в админку: адрес магазина → пароль в окне браузера |

Без `STRIPE_SECRET_KEY` магазин работает в **тестовом режиме**: заказ сразу помечается оплаченным.

## Как устроено

**Мультитенантность** — `src/proxy.ts` (в Next 16 это бывший middleware). По хосту определяется магазин и запрос переписывается на `/s/<site>/…`:

- `demo.your-domain.ch` → поддомен платформы → магазин со slug `demo`
- `shop.client-domain.ch` → свой домен → ищется в таблице `Domain`
- `/s/demo/…` → напрямую по пути

Заголовок `x-store-base` подсказывает страницам, какой префикс ставить в ссылки (`getBase()` в `src/lib/tenant.ts`).

**Данные** — `prisma/schema.prisma`. У каждой бизнес-строки есть `storeId`. Деньги — целые раппены (1 CHF = 100), цены с НДС. Тексты на четырёх языках — JSON `{ de, fr, it, en }`; переводы значений опций (цвет и т.п.) — `Product.optionValues`. Склад разделён по локациям (`Location` + `InventoryLevel`): онлайн-склад сейчас, розничный магазин потом, флаг `sellsOnline` решает, что видно в интернет-магазине.

**Корзина** — в httpOnly-cookie на каждый магазин, без записей в БД. Цены и остатки всегда берутся из БД.

**Заказ** (`src/lib/orders.ts`) — в одной транзакции: резерв остатков (с защитой от гонки за последнюю штуку), номер заказа по счётчику магазина, клиент, позиции. Заказ создаётся как `PENDING`; оплата переводит в `PAID`; отмена или истечение сессии Stripe возвращает остатки.

**Оплата** (`src/lib/payments.ts`) — Stripe Checkout. TWINT, карты, Apple/Google Pay, PostFinance включаются в дашборде Stripe, код менять не нужно. Статус подтверждается двумя путями: при возврате с Stripe (страница заказа проверяет сессию) и вебхуком `/api/stripe/webhook`.

**НДС и доставка** (`src/lib/money.ts`) — ставка 8,1 % хранится у магазина в базисных пунктах (`vatRateBp = 810`), НДС выделяется из суммы с НДС. Доставка — фиксированная ставка, бесплатно от порога (по умолчанию CHF 9.00 и бесплатно от CHF 100).

## Структура

```
prisma/schema.prisma         модель данных
prisma/seed.ts               демо-магазин
src/proxy.ts                 определение магазина по хосту + Basic auth для /admin
src/lib/                     db, tenant, cart, inventory, orders, payments, money, i18n
src/app/page.tsx             главная платформы
src/app/s/[site]/[locale]/   витрина: каталог, товар, корзина, оформление, заказ
src/app/s/[site]/admin/      админка: дашборд, заказы, товары (цены, остатки, статус)
src/app/api/stripe/webhook/  вебхук Stripe
```

## Подключение Stripe

1. Ключ `sk_test_…` в `STRIPE_SECRET_KEY`.
2. Локально: `stripe listen --forward-to localhost:3000/api/stripe/webhook` и секрет `whsec_…` в `STRIPE_WEBHOOK_SECRET`.
3. События: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`.
4. В дашборде Stripe включить TWINT (Settings → Payment methods).

## Деплой на Vercel + Neon

- `DATABASE_URL` (pooled от Neon), `ROOT_DOMAIN`, `ADMIN_PASSWORD`, ключи Stripe.
- Миграции: `npm run db:deploy` (локально перед деплоем или шагом в CI).
- Поддомены магазинов: wildcard-домен `*.your-domain.ch` в настройках Vercel.

## Что проверено

Сборка `next build`, TypeScript и ESLint проходят. Сквозной тест через настоящие HTML-формы (по пути и по поддомену): добавление в корзину → корзина → оформление → заказ `PAID`, корзина очищается, остатки списываются, НДС считается верно. Невалидная форма отклоняется, распроданный товар не даёт оформить заказ. Админка закрыта паролем в production.

Не проверено: реальные платежи Stripe (нужны ключи), внешний вид в браузере.

## Что дальше (по порядку)

1. Нормальный вход для сотрудников (`StaffUser` уже в схеме) вместо Basic auth.
2. Загрузка фото товаров (Vercel Blob) и создание товаров из админки.
3. E-mail клиенту о заказе (Resend) с номером и суммой.
4. Тарифы Swiss Post по весу, самовывоз.
5. AGB, Datenschutz, Impressum — страницы на трёх языках.
6. Регистрация новых магазинов → это и есть SaaS.
7. Кэш каталога (`cacheComponents` + `use cache` с тегом магазина).
8. POS для розничного магазина на той же модели остатков.
