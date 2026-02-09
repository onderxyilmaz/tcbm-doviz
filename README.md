# TCMB Döviz Kurları Uygulaması

Türkiye Cumhuriyeti Merkez Bankası (TCMB) API'sini kullanarak döviz kurlarını görüntüleyen web uygulaması.

## Özellikler

- ✅ Güncel döviz kurları (USD, EUR, CHF)
- ✅ Tarih aralığına göre geçmiş veri görüntüleme
- ✅ Modern ve responsive arayüz (Tailwind CSS)
- ✅ Bildirim sistemi
- ✅ Hata yönetimi

## Teknolojiler

### Backend
- Express.js
- Axios (HTTP istekleri)
- CORS

### Frontend
- React
- React Router
- Tailwind CSS
- Vite
- Axios

## Kurulum

### Backend Kurulumu

```bash
cd backend
npm install
```

`.env` dosyası oluşturun:
```
PORT=3001
TCMB_API_KEY=8bC8YP8pNM
TCMB_API_URL=https://evds2.tcmb.gov.tr/service/evds
```

Backend'i başlatın:
```bash
npm run dev
```

Backend `http://localhost:3001` adresinde çalışacaktır.

### Frontend Kurulumu

```bash
cd frontend
npm install
```

Frontend'i başlatın:
```bash
npm run dev
```

Frontend `http://localhost:3000` adresinde çalışacaktır.

## Kullanım

1. Uygulamayı başlattıktan sonra tarayıcıda `http://localhost:3000` adresine gidin.
2. **Güncel Kurlar** sayfasında bugünkü döviz kurlarını görüntüleyebilirsiniz.
3. **Geçmiş Veriler** sayfasında tarih aralığı seçerek geçmiş döviz kurlarını görüntüleyebilirsiniz.

## API Endpoints

### GET /api/rates/current
Güncel döviz kurlarını getirir.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "currency": "USD",
      "buyRate": 34.1234,
      "sellRate": 34.5678,
      "date": "10-02-2026"
    }
  ]
}
```

### GET /api/rates/historical
Tarih aralığına göre geçmiş döviz kurlarını getirir.

**Query Parameters:**
- `currency`: Para birimi (USD, EUR, CHF)
- `startDate`: Başlangıç tarihi (YYYY-MM-DD)
- `endDate`: Bitiş tarihi (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "01-02-2026",
      "buyRate": 34.1234,
      "sellRate": 34.5678
    }
  ]
}
```

## Notlar

- Hafta sonları ve resmi tatil günlerinde TCMB verileri güncellenmediği için o tarihlerdeki veriler gösterilmeyebilir.
- İnternet bağlantısı gereklidir.
- API anahtarı `.env` dosyasında saklanmalıdır.
