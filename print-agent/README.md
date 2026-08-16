# Print Agent — La Reina Helados

Puente entre el sistema (en la nube) y la impresora térmica USB. Corre en la PC/Mini PC
del mostrador que tiene la impresora conectada — es un proyecto totalmente aparte de la
app web, no comparte código ni dependencias con ella.

## Cómo funciona

Cada pocos segundos, este programa le pregunta al sistema (`la-reina-helados.vercel.app`)
si hay comandas nuevas para imprimir. Cuando hay una, arma el ticket y lo manda directo a
la impresora ya instalada en Windows (la misma que ya usás — no hace falta reinstalar ni
cambiar ningún driver).

## Instalación (una sola vez)

1. Necesitás **Node.js** instalado en esta PC (versión 18 o más nueva).
2. Abrí una terminal en esta carpeta (`print-agent`) y corré:
   ```
   npm install
   npm run build
   ```
3. El archivo `.env` ya viene con la URL del sistema y la clave configuradas — no hace
   falta tocarlo, salvo que el sistema cambie de dirección algún día.
4. Corré una vez, a mano, para elegir la impresora:
   ```
   npm start
   ```
   Va a abrir un mensaje en la consola. Andá a **http://localhost:9200** en el navegador
   de esa misma PC, elegí la impresora (por ejemplo "XP-58") en el desplegable, y tocá
   **Guardar**.
5. Para que arranque solo cada vez que se prende la PC (sin que nadie tenga que abrir nada):
   ```
   npm run install-service
   ```
   Esto deja el Print Agent corriendo en segundo plano, sin ventana visible, cada vez que
   inicia sesión el usuario de Windows de esa PC.

Si en algún momento querés sacarlo del arranque automático:
```
npm run uninstall-service
```

## Página de estado

Mientras el Agent está corriendo, entrando a **http://localhost:9200** desde esa misma PC
podés ver: si está conectado al sistema, qué impresora tiene elegida, las últimas comandas
que imprimió (o que fallaron), y hacer una impresión de prueba directa (sin pasar por el
sistema — útil para probar solamente la impresora/cable).

## Estructura

- `src/index.ts` — arranque y bucle principal (consulta al servidor cada `POLL_INTERVAL_MS`).
- `src/ticket-format.ts` — arma el texto del ticket (mismo formato que ya usa la app web).
- `src/escpos.ts` — convierte ese texto (y el logo) a comandos ESC/POS.
- `src/print-windows.ts` — manda esos comandos a la impresora de Windows por su nombre,
  usando el mismo driver que ya tenés instalado (sin libusb, sin Zadig).
- `src/status-server.ts` — la página de estado local (puerto 9200).
- `src/service-install.ts` / `service-uninstall.ts` — arranque automático con Windows.
- `logs/` — un archivo de texto por día con todo lo que hizo el Agent.

## Si algo no imprime

1. Revisá **http://localhost:9200** — ahí se ve el último error, si lo hubo.
2. Confirmá que la impresora elegida ahí es la correcta.
3. Si el Agent dice que imprimió bien pero no sale papel: es un problema de la impresora/
   cable/driver en Windows, no de este programa — probá una "Impresión de prueba" directa
   desde **Configuración de Windows → Impresoras y escáneres → (tu impresora) → Imprimir
   página de prueba** para confirmar si el problema es previo a este Agent.
4. Si el Agent dice "No autorizado" (401) al consultar al servidor: el `PRINT_AGENT_TOKEN`
   de este `.env` no coincide con el que tiene guardado Vercel. Para cambiarlo, mejor
   hacerlo desde el dashboard de Vercel (Project Settings → Environment Variables) pegando
   el valor a mano, en vez de por la CLI con un pipe — un pipe de PowerShell puede colar un
   carácter invisible al final y el token deja de coincidir aunque se vea igual.

## Nota sobre el logo

El logo se desactivó por defecto (`PRINT_LOGO=false`) porque la impresora XP-58 de este
local no interpreta el comando de imagen ESC/POS y lo imprime como texto basura en vez del
logo — es una limitación de esa impresora, no de este programa. El ticket de texto (nombre,
pedido, ítems, total) ya se probó completo en papel real y sale perfecto.
