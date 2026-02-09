# TCMB Döviz Kurları

TCMB (Türkiye Cumhuriyet Merkez Bankası) API'sini kullanarak güncel ve geçmiş döviz kurlarını görüntüleyen modern bir web uygulaması.

## Özellikler

- ✅ Güncel döviz kurları görüntüleme
- ✅ Geçmiş döviz kurları sorgulama (1 hafta, 1 ay, 3 ay, 6 ay, 1 yıl veya özel tarih aralığı)
- ✅ Dinamik para birimi seçimi (19 farklı para birimi)
- ✅ Döviz çevirici
- ✅ Kopyalama özelliği (formatlı ve ham değer)
- ✅ Dark/Light mode desteği
- ✅ Mobil uyumlu responsive tasarım
- ✅ LocalStorage ile ayar saklama

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

### Backend Kurulumu

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin ve TCMB_API_KEY'inizi ekleyin
npm run dev
```

Backend `http://localhost:3001` adresinde çalışacaktır.

### Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:3000` adresinde çalışacaktır.

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
3. GitHub repo'nuzu seçin: `onderxyilmaz/tcbm-doviz`
4. Branch: `master` seçin
5. **Root Directory**: Boş bırakın (root'tan deploy edilecek)
6. **Build Command**: `cd frontend && npm install && npm run build`
7. **Output Directory**: `frontend/dist`
8. **Environment Variables** ekleyin:
   - `TCMB_API_KEY`: TCMB API anahtarınız
   - `TCMB_API_URL`: `https://evds2.tcmb.gov.tr/service/evds` (varsayılan)
9. "Deploy" butonuna tıklayın

### 3. Serverless Functions

Backend API'leri `/api` klasöründe Vercel serverless functions olarak çalışır:
- `/api/currencies` - Tüm para birimlerini listeler
- `/api/rates/current` - Güncel döviz kurlarını getirir
- `/api/rates/historical` - Geçmiş döviz kurlarını getirir

Frontend otomatik olarak production'da `/api` endpoint'lerini kullanır.

## API Endpoints

### GET /api/currencies
Tüm desteklenen para birimlerini döndürür.

**Response:**
```json
{
  "success": true,
  "data": [
    { "code": "USD", "name": "ABD Doları", "nameEn": "US Dollar" },
    ...
  ]
}
```

### GET /api/rates/current?currencies=USD,EUR,CHF
Güncel döviz kurlarını getirir.

**Query Parameters:**
- `currencies` (optional): Virgülle ayrılmış para birimi kodları

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "currency": "USD",
      "buyRate": 43.5325,
      "sellRate": 43.5450,
      "date": "10-02-2026"
    },
    ...
  ]
}
```

### GET /api/rates/historical?currency=USD&startDate=2026-01-01&endDate=2026-02-10
Tarih aralığına göre geçmiş döviz kurlarını getirir.

**Query Parameters:**
- `currency` (required): Para birimi kodu
- `startDate` (required): Başlangıç tarihi (YYYY-MM-DD)
- `endDate` (required): Bitiş tarihi (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "10-02-2026",
      "buyRate": 43.5325,
      "sellRate": 43.5450
    },
    ...
  ]
}
```

## Desteklenen Para Birimleri

USD, EUR, CHF, GBP, JPY, AUD, CAD, SEK, NOK, DKK, SAR, KWD, QAR, BGN, RON, RUB, CNY, PKR, IRR

## Lisans

MIT License

## Yazar

Onder Yilmaz
