# Language Addition Guide (Dil Ekleme Yol Haritası)

Bu belge, **Petopia Petcare** projesine yeni bir dil desteği eklemek için izlenmesi gereken adımları ve değiştirilmesi gereken dosyaları açıklar.

Örnek olarak, projeye yeni bir dil kodu **`xx`** (örneğin: `ru`, `zh`, `ar`) eklediğinizi varsayalım.

---

## 1. Adım: Dil Dosyasını Oluşturun

İlk olarak, kaynak dilden (genellikle İngilizce) bir kopya alarak yeni dil dosyasını oluşturun ve içeriği çevirin.

*   **Dosya:** `locales/xx.json`
*   **İşlem:** `locales/en.json` dosyasını kopyalayın, `locales/xx.json` olarak adlandırın ve değerleri hedef dile çevirin.

```json
// locales/xx.json
{
  "auth": {
    "login": "Giriş (Yeni Dil)",
    ...
  },
  ...
}
```

---

## 2. Adım: i18n Konfigürasyonunu Güncelleyin

Yeni dili `i18next` yapılandırmasına tanıtın ve cihazın dil ayarlarına göre otomatik algılama mantığını güncelleyin.

*   **Dosya:** `lib/i18n.ts`

**Yapılacaklar:**
1.  Yeni JSON dosyasını import edin.
2.  `resources` objesine ekleyin.
3.  `getDeviceLanguage` fonksiyonuna koşul ekleyin (Otomatik algılama için).
4.  `supportedLngs` dizisine ekleyin.

```typescript
// lib/i18n.ts

// 1. Import
import xx from '../locales/xx.json';

// 2. Resources
const resources = {
  // ... diğer diller
  xx: {
    translation: xx,
  },
};

// 3. Otomatik Algılama
const getDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales();
    const languageCode = locales[0]?.languageCode?.toLowerCase() || 'en';
    // ... diğer diller
    if (languageCode === 'xx') return 'xx'; // Yeni dil kontrolü
    return 'en';
  } catch {
    return 'en';
  }
};

// 4. Desteklenen Diller
i18n
  .use(initReactI18next)
  .init({
    // ...
    supportedLngs: ['en', 'tr', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'xx'], // xx eklendi
  });
```

---

## 3. Adım: TypeScript Tiplerini Güncelleyin

Uygulama genelinde tip güvenliğini sağlamak için `SupportedLanguage` tipini güncelleyin.

*   **Dosya:** `lib/types.ts`

```typescript
// lib/types.ts

export type SupportedLanguage = "tr" | "en" | "it" | "de" | "fr" | "es" | "pt" | "ja" | "xx";
```

---

## 4. Adım: Ayarlar Store'unu Güncelleyin

Kullanıcı ayarlarının yönetildiği store'a yeni dili ekleyin. Burası dilin görüntülenen adını (Display Name) ve yerel adını (Native Name) tanımladığımız yerdir.

*   **Dosya:** `stores/userSettingsStore.ts`

**Yapılacaklar:**
1.  `getSupportedLanguages` dizisine ekleyin.
2.  `isLanguageSupported` kontrolüne ekleyin.
3.  `getLanguageDisplayName` ve `getLanguageNativeName` objelerine ekleyin.

```typescript
// stores/userSettingsStore.ts

export const getSupportedLanguages = (): SupportedLanguage[] => [
  'tr', 'en', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'xx'
];

export const isLanguageSupported = (language: string): language is SupportedLanguage => {
  return ['tr', 'en', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'xx'].includes(language);
};

export const getLanguageDisplayName = (language: SupportedLanguage): string => {
  const displayNames: Record<SupportedLanguage, string> = {
    // ... diğerleri
    xx: 'Yeni Dil Adı (İngilizce)', // Örn: Russian
  };
  return displayNames[language] || language;
};

export const getLanguageNativeName = (language: SupportedLanguage): string => {
  const nativeNames: Record<SupportedLanguage, string> = {
    // ... diğerleri
    xx: 'Yeni Dil Adı (Yerel)', // Örn: Русский
  };
  return nativeNames[language] || language;
};
```

---

## 5. Adım: UI Bileşenini Güncelleyin

Ayarlar ekranındaki dil seçimi listesini güncelleyin.

*   **Dosya:** `components/LanguageSettings.tsx`

```typescript
// components/LanguageSettings.tsx

// ...
const supportedLanguages: SupportedLanguage[] = [
  'tr', 'en', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'xx' // xx eklendi
];
// ...
```

---

## 6. Adım: Mevcut Dil Dosyalarını Senkronize Edin

Son olarak, **TÜM** mevcut dil dosyalarındaki (`locales/*.json`) dil listesine yeni dili ekleyin. Bu, kullanıcı Ayarlar menüsüne girdiğinde yeni dilin adını kendi dilinde (veya belirlenen standartta) görebilmesini sağlar.

*   **Dosyalar:** `en.json`, `tr.json`, `it.json`, `de.json`, `fr.json`, `es.json`, `pt.json`, `ja.json`

Örnek (`locales/en.json` için):

```json
{
  "settings": {
    "languages": {
      "turkish": "Türkçe",
      "english": "English",
      // ... diğerleri
      "japanese": "Japanese",
      "newLanguageKey": "New Language Name" // Buraya ekleyin
    }
  }
}
```

*Not: `newLanguageKey` anahtarını kod içinde nasıl çağırdığınıza dikkat edin. Genellikle `stores/userSettingsStore.ts` içindeki map'lemeler kullanılır, ancak JSON içinde de tutarlılık önemlidir.*

---

## Özet Kontrol Listesi

- [ ] `locales/xx.json` oluşturuldu mu?
- [ ] `lib/i18n.ts` güncellendi mi? (Import, Resource, Detect, SupportedLngs)
- [ ] `lib/types.ts` güncellendi mi? (Type definition)
- [ ] `stores/userSettingsStore.ts` güncellendi mi? (Helpers & Maps)
- [ ] `components/LanguageSettings.tsx` güncellendi mi? (List)
- [ ] Diğer tüm `locales/*.json` dosyalarına yeni dil eklendi mi?
