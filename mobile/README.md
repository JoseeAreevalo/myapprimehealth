# Prime Health Mobile (Android + iOS)

App nativa construida con Capacitor 7: reutiliza el mismo código React, diseño y funcionalidades de `frontend/` y lo empaqueta como app para Android e iOS. Consume el mismo API (`api/`).

Estructura: `src/` (copia de `frontend/src` + adaptaciones móviles), `android/` y `ios/` (proyectos nativos), `assets/` (fuente de iconos y splash).

Adaptaciones respecto a la web: URL del API por `VITE_API_URL` (`src/api/config.ts`), safe areas de notch/barra inferior, botón atrás de Android, status bar y splash (`src/native.ts`), permisos de cámara/galería para fotos de check-in.

## Probar en iPhone como web app (PWA)

Para probar las funciones de la app que no dependen de capacidades nativas, no necesitas compilar una app iOS ni publicarla en App Store. Publica el contenido de `mobile/dist` en un hosting web con HTTPS y el API por separado con HTTPS. El proyecto ya incluye el manifiesto, el icono de inicio de iOS y los metadatos para abrirse en modo independiente desde la pantalla de inicio.

Desde Windows, prepara el build así:

```powershell
cd mobile
npm install
Copy-Item .env.example .env
# Edita .env y configura VITE_API_URL=https://tu-api
npm run build
```

Publica el contenido generado en `mobile/dist` en un hosting de sitios estáticos. Configura `API_CORS_ORIGINS` en el API con el origen exacto del sitio (por ejemplo, `https://primehealth.example.com`, sin barra final). Abre la URL en Safari en el iPhone, toca Compartir > Añadir a pantalla de inicio y luego abre Prime Health desde el icono.

La PWA necesita conexión a internet y no almacena la app ni los datos del usuario para uso offline. Los cambios publicados se cargan al volver a abrir o actualizar la página. Las funciones que requieren cámara u otras APIs nativas no forman parte de esta modalidad; para esta prueba se usan las funciones web de la app. Una PWA es la aplicación web instalada desde Safari, no un archivo nativo `.ipa`.

## 1. Requisitos en tu PC (Windows) para Android

1. Node.js 20+ (ya tienes 24).
2. Android Studio (última versión): https://developer.android.com/studio
   - En el primer arranque instala: Android SDK Platform 35, Android SDK Build-Tools, Android SDK Platform-Tools, Android Emulator.
   - Incluye el JDK 21 (JBR) necesario; no instales otro Java.
3. Variable de entorno (PowerShell, una vez) y reinicia terminales:
   ```powershell
   [Environment]::SetEnvironmentVariable("ANDROID_HOME","$env:LOCALAPPDATA\Android\Sdk","User")
   ```
4. En el teléfono Android: Ajustes > Acerca del teléfono > toca 7 veces "Número de compilación" > Opciones de desarrollador > activa "Depuración USB". Conéctalo por USB y acepta la huella RSA.
   Verifica con `adb devices` (en `%LOCALAPPDATA%\Android\Sdk\platform-tools`).

## 2. Requisitos para compilar la app nativa de iOS

Apple solo permite compilar iOS en macOS. Desde Windows no es posible directamente. Opciones:

- Un Mac (o Mac en la nube: MacinCloud, etc.) con Xcode 16+ (App Store) y CocoaPods (`sudo gem install cocoapods` o `brew install cocoapods`). Clona el repo allí y sigue la sección 5.
- CI en la nube con runner macOS (GitHub Actions, Codemagic) para generar el build.
- Cuenta Apple: gratis para probar en tu iPhone (la app caduca a los 7 días); Apple Developer Program (99 USD/año) para TestFlight y App Store.

## 3. Preparar el API (backend)

El teléfono no puede usar `localhost`. Usa la IP de tu PC en la misma WiFi:

```powershell
ipconfig   # anota la IPv4, p. ej. 192.168.1.50
New-NetFirewallRule -DisplayName "PrimeHealth API 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow   # PowerShell como administrador
docker compose up -d database
npm run dev:api
```

El API ya acepta los orígenes de Capacitor (`https://localhost`, `http://localhost`, `capacitor://localhost`).

Producción: despliega el API con HTTPS (ver `docs/deployment.md`) y usa esa URL en `VITE_API_URL`. Las tiendas exigen HTTPS.

## 4. Compilar y correr en Android

```powershell
cd mobile
npm install
Copy-Item .env.example .env        # edita VITE_API_URL=http://192.168.1.50:3000
$env:CAP_DEV_HTTP = "1"             # solo desarrollo con API en http://
npx cap sync android                # (npm run build previo)
npm run run:android                 # elige tu teléfono; o: npm run android (abre Android Studio y pulsa Run)
```

Cada vez que cambies código: `npm run build; $env:CAP_DEV_HTTP="1"; npx cap sync android` y vuelve a ejecutar.

Sincronizar cambios de la web: `src/` es una copia de `frontend/src`. Para traer cambios nuevos de la web sin pisar las adaptaciones móviles, copia los archivos modificados a mano (los archivos adaptados son `src/api/config.ts`, `src/main.tsx`, `src/native.ts`, `src/index.css`, `src/components/AppLayout.tsx`, `src/components/ChatbotWidget.tsx`, `index.html`).

### APK / AAB de release

1. Genera un keystore (guárdalo y respáldalo; nunca lo subas al repo):
   ```powershell
   & "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore primehealth.jks -alias primehealth -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Con `VITE_API_URL` apuntando a HTTPS de producción y SIN `CAP_DEV_HTTP`: `npm run build; npx cap sync android`.
3. Android Studio > Build > Generate Signed Bundle / APK > Android App Bundle (Play Store) o APK (instalación directa) > elige el keystore.
4. Play Store: cuenta de desarrollador (25 USD único), subir el `.aab`.

## 5. Compilar y correr en iOS (en Mac)

```bash
cd mobile
npm install
cp .env.example .env     # VITE_API_URL=https://tu-api (iOS bloquea http:// salvo excepción ATS)
npm run build
npx cap sync ios         # instala los Pods
npx cap open ios
```

En Xcode: target App > Signing & Capabilities > marca "Automatically manage signing" y elige tu Team (Apple ID). Cambia el Bundle Identifier si `com.primehealth.app` está tomado (y el mismo `appId` en `capacitor.config.ts`). Conecta el iPhone, activa Ajustes > Privacidad y seguridad > Modo desarrollador, selecciónalo como destino y pulsa Run. Primera vez: Ajustes > General > Gestión de dispositivos > confiar en tu perfil.
Distribución: Product > Archive > Distribute App (TestFlight / App Store).

Para probar con un API `http://` en iOS en desarrollo, usa un túnel HTTPS (p. ej. `npx localtunnel --port 3000` o ngrok) y pon esa URL en `VITE_API_URL`.

## 6. Cambiar identidad e iconos

- Nombre/ID: `capacitor.config.ts` (`appId`, `appName`).
- Iconos y splash: reemplaza `assets/icon-only.png` (1024x1024) y `assets/splash.png` (2732x2732) y ejecuta `npm run assets`.

## 7. Problemas frecuentes

- Pantalla de login con error de red: IP incorrecta, firewall, o teléfono en otra WiFi. Prueba `http://IP:3000/api/v1/identity/me` desde el navegador del teléfono (debe responder 401).
- `CORS`/`Mixed content`: sincroniza con `CAP_DEV_HTTP=1` si el API es http, o usa HTTPS.
- `ANDROID_HOME`/`SDK not found`: crea `android/local.properties` con `sdk.dir=C\:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk`.
- `adb devices` vacío: cable de datos, depuración USB activada, aceptar el diálogo en el teléfono.
