# Döviz Kurları

Frankfurter API (ECB referans kurları) kullanarak güncel ve geçmiş döviz kurlarını görüntüleyen modern bir web uygulaması.

## Özellikler

- ✅ Güncel döviz kurları görüntüleme
- ✅ Geçmiş döviz kurları sorgulama (1 hafta, 1 ay, 3 ay, 6 ay, 1 yıl veya özel tarih aralığı)
- ✅ Dinamik para birimi seçimi (19 farklı para birimi)
- ✅ Döviz çevirici
- ✅ Kopyalama özelliği (formatlı ve ham değer)
- ✅ Dark/Light mode desteği
- ✅ Mobil uyumlu responsive tasarım
- ✅ LocalStorage ile ayar saklama

## Veri Kaynağı: Frankfurter API

- **Ücretsiz** – API anahtarı gerekmez
- **ECB (Avrupa Merkez Bankası)** referans kurları
- Kaynak: [api.frankfurter.app](https://api.frankfurter.app)

## Teknolojiler

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- Express.js (local development)
- Vercel Serverless Functions (production)

## Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Yerel Geliştirme (Önerilen)

**Backend ve frontend birlikte çalışmalıdır.** Proje kök dizininden:

```bash
npm run install:all
npm run dev
```

Bu komut hem backend (port 3001) hem frontend (port 3000) başlatır. Tarayıcıda `http://localhost:3000` adresini açın.

### Ayrı Ayrı Çalıştırma

```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Backend `http://localhost:3001`, frontend `http://localhost:3000` adresinde çalışır.

## Vercel Deployment

### 1. GitHub'a Push
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin master
```

### 2. Vercel'e Deploy

1. [Vercel](https://vercel.com) hesabınıza giriş yapın
2. "New Project" seçin
3. GitHub repo'nuzu seçin
4. Branch: `master` seçin
5. **Build Command**: `cd frontend && npm install && npm run build`
6. **Output Directory**: `frontend/dist`
7. "Deploy" butonuna tıklayın

**Not:** Environment variable gerekmez. Frankfurter API ücretsiz ve anahtarsız çalışır.

### 3. Serverless Functions

Backend API'leri `/api` klasöründe Vercel serverless functions olarak çalışır:
- `/api/currencies` - Tüm para birimlerini listeler
- `/api/rates/current` - Güncel döviz kurlarını getirir
- `/api/rates/historical` - Geçmiş döviz kurlarını getirir

## API Endpoints

### GET /api/currencies
Tüm desteklenen para birimlerini döndürür.

### GET /api/rates/current?currencies=USD,EUR,CHF
Güncel döviz kurlarını getirir.

### GET /api/rates/historical?currency=USD&startDate=2026-01-01&endDate=2026-02-10
Tarih aralığına göre geçmiş döviz kurlarını getirir.

## Desteklenen Para Birimleri

USD, EUR, CHF, GBP, JPY, AUD, CAD, SEK, NOK, DKK, SAR, KWD, QAR, BGN, RON, RUB, CNY, PKR, IRR

## Lisans

MIT License

## Yazar

Onder Yilmaz
