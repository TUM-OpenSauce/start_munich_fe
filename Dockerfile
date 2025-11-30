# 1. ÄNDERUNG: Update auf Node 22-alpine (LTS), da Vite Node 21 nicht mehr unterstützt
FROM node:22-alpine as BUILD_IMAGE

WORKDIR /app/react-app/

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

# 2. ÄNDERUNG: Auch hier Node 22-alpine verwenden
FROM node:22-alpine as PRODUCTION_IMAGE

WORKDIR /app/react-app/

# Kopiert den gebauten 'dist' Ordner aus dem ersten Stage
COPY --from=BUILD_IMAGE /app/react-app/dist/ /app/react-app/dist/

COPY package.json .
COPY vite.config.ts .

# 3. ÄNDERUNG: WICHTIG!
# Im neuen Stage fehlen die node_modules. Wir müssen 'npm install' ausführen,
# damit das "vite" Kommando für den Preview überhaupt existiert.
# (Nur 'typescript' zu installieren reicht oft nicht, wenn 'vite' fehlt)
RUN npm install

EXPOSE 4173

# Startet den Preview Server mit Host-Flag
CMD ["npm", "run", "preview", "--", "--host"]