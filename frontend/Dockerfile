# ══════════════════════════════════════════════════════════════════════════════
# Stage 1 — Build : compile le projet React/Vite en fichiers statiques
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les manifests en premier pour exploiter le cache des couches Docker
COPY package.json ./
RUN npm install --silent

# Copier le reste des sources, puis lancer le build de production
COPY . .
RUN npm run build

# ══════════════════════════════════════════════════════════════════════════════
# Stage 2 — Serve : distribuer le build statique via Nginx
# ══════════════════════════════════════════════════════════════════════════════
FROM nginx:1.25-alpine AS runner

# Supprimer la configuration Nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Injecter notre configuration personnalisée (proxy + sécurité + gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Permissions restrictives : lecture seule pour les fichiers statiques
RUN chmod -R 555 /usr/share/nginx/html

EXPOSE 80

# Nginx en avant-plan (requis par Docker)
CMD ["nginx", "-g", "daemon off;"]
